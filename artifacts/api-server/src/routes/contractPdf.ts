import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const router = Router();
const PRICE_BDT = 3000;
const PDF_PATH = path.resolve(process.cwd(), "private-assets/Amit_Mondal_Employment_Contract.pdf");

// Public: submit Nagad transaction for the fixed-price contract PDF.
router.post("/contract-pdf/orders", async (req, res): Promise<void> => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const transactionId = String(req.body?.transactionId || "").trim();
  if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^[a-zA-Z0-9-]{5,80}$/.test(transactionId)) {
    res.status(400).json({ error: "Enter your full name, a valid email address and a valid Nagad Transaction ID." }); return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO contract_pdf_orders (customer_name, customer_email, nagad_transaction_id, amount_bdt)
       VALUES ($1, $2, $3, $4) RETURNING id, status, created_at`,
      [name, email, transactionId, PRICE_BDT]
    );
    res.status(201).json({ success: true, order: rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") { res.status(409).json({ error: "This Transaction ID has already been submitted." }); return; }
    res.status(500).json({ error: "Could not submit your payment for review." });
  }
});

// Admin-only order queue and review actions.
router.get("/admin/contract-pdf/orders", requireAdmin, async (_req, res): Promise<void> => {
  const { rows } = await pool.query(`SELECT id, customer_name, customer_email, nagad_transaction_id, amount_bdt, status, admin_note, created_at, reviewed_at FROM contract_pdf_orders ORDER BY created_at DESC`);
  res.json(rows);
});
router.patch("/admin/contract-pdf/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  const note = String(req.body?.note || "").trim().slice(0, 1000);
  if (!Number.isInteger(id) || id < 1 || !["approved", "rejected"].includes(status)) { res.status(400).json({ error: "Invalid order review." }); return; }
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET status = $1, admin_note = $2, reviewed_at = NOW() WHERE id = $3 AND status = 'pending' RETURNING id, status`,
    [status, note || null, id]
  );
  if (!rows.length) { res.status(404).json({ error: "Pending order not found." }); return; }
  res.json({ success: true, order: rows[0] });
});

// Approved orders only receive a short-lived, single-use download token.
router.post("/contract-pdf/orders/:id/download-token", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!Number.isInteger(id) || id < 1 || !email) { res.status(400).json({ error: "Order ID and email are required." }); return; }
  const token = randomBytes(32).toString("hex");
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET download_token = $1, download_token_expires_at = NOW() + INTERVAL '15 minutes'
     WHERE id = $2 AND customer_email = $3 AND status = 'approved'
     RETURNING id`, [token, id, email]
  );
  if (!rows.length) { res.status(403).json({ error: "Payment approval could not be verified." }); return; }
  res.json({ downloadUrl: `/api/contract-pdf/download/${token}` });
});
router.get("/contract-pdf/download/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token || "");
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET download_token = NULL, download_token_expires_at = NULL
     WHERE download_token = $1 AND download_token_expires_at > NOW() AND status = 'approved'
     RETURNING id`, [token]
  );
  if (!rows.length) { res.status(403).json({ error: "This download link is invalid or expired." }); return; }
  if (!fs.existsSync(PDF_PATH)) { res.status(503).json({ error: "The document is temporarily unavailable." }); return; }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="Employment-Contract.pdf"');
  res.setHeader("Cache-Control", "no-store");
  fs.createReadStream(PDF_PATH).pipe(res);
});
export default router;
