import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { signToken, hashPassword, comparePassword } from "../lib/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { requireApplicant } from "../middleware/requireApplicant";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ciobanuceban@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Saif_sn1992";

// ── Admin auth ────────────────────────────────────────────────────────────────

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  // Compare against hashed or plain password depending on env setup
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  let valid: boolean;
  if (storedHash) {
    valid = await comparePassword(password, storedHash);
  } else {
    valid = password === ADMIN_PASSWORD;
  }
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ role: "admin", email: ADMIN_EMAIL });
  res.json({ token, email: ADMIN_EMAIL, role: "admin" });
});

router.get("/auth/admin/me", requireAdmin, (req, res): void => {
  res.json((req as any).admin);
});

// ── Applicant auth ────────────────────────────────────────────────────────────

router.post("/auth/applicant/register", async (req, res): Promise<void> => {
  const { email, password, firstName, lastName } = req.body ?? {};
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "email, password, firstName and lastName are required" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query(
      "SELECT id FROM applicant_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const { rows } = await client.query(
      `INSERT INTO applicant_users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name`,
      [email.toLowerCase(), passwordHash, firstName.trim(), lastName.trim()]
    );
    const user = rows[0];
    const token = signToken({ role: "applicant", id: user.id, email: user.email });
    res.status(201).json({ token, id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: "applicant" });
  } finally {
    client.release();
  }
});

router.post("/auth/applicant/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, email, password_hash, first_name, last_name FROM applicant_users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ role: "applicant", id: user.id, email: user.email });
    res.json({ token, id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: "applicant" });
  } finally {
    client.release();
  }
});

router.get("/auth/applicant/me", requireApplicant, async (req, res): Promise<void> => {
  const applicant = (req as any).applicant;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, email, first_name, last_name, created_at FROM applicant_users WHERE id = $1",
      [applicant.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ ...rows[0], role: "applicant" });
  } finally {
    client.release();
  }
});

export default router;
