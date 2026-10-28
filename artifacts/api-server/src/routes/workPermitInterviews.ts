import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
const QUESTIONS = [
  "Please introduce yourself.",
  "Tell us about your previous work experience.",
  "Have you worked in a greenhouse, farm, or agricultural field before?",
  "What experience do you have with planting, watering, and harvesting vegetables?",
  "Are you comfortable with physically demanding work and standing for long periods?",
  "How would you manage working in a warm and humid greenhouse?",
  "What would you do if you noticed an unsafe condition at work?",
  "How do you work with a team and follow a supervisor's instructions?",
  "Why would you like to work in Moldova?",
  "What do you understand about the duties and conditions of this job?"
];
const LIMIT_SECONDS = 10 * 60;

router.get("/interviews/questions", (_req, res) => {
  res.json({ questions: QUESTIONS, durationSeconds: LIMIT_SECONDS });
});

router.post("/interviews/start", async (req, res): Promise<void> => {
  const referenceNumber = String(req.body?.referenceNumber || "").trim().toUpperCase();
  const candidateName = String(req.body?.candidateName || "").trim().slice(0, 160);
  if (!/^MVA-\d{4}-[A-F0-9]{6}$/.test(referenceNumber)) {
    res.status(400).json({ error: "Enter a valid Work Permit Reference Number (MVA-YYYY-XXXXXX)." });
    return;
  }
  try {
    const permit = await pool.query(
      "SELECT id, first_name, last_name, job_title, employer_name FROM work_permits WHERE reference_number = $1 LIMIT 1",
      [referenceNumber]
    );
    if (!permit.rows.length) {
      res.status(404).json({ error: "Work Permit Reference Number not found. Please check it and try again." });
      return;
    }
    const wp = permit.rows[0];
    const accessToken = randomBytes(24).toString("hex");
    const inserted = await pool.query(
      `INSERT INTO work_permit_interviews
       (work_permit_id, reference_number, candidate_name, questions, answers, access_token, status, consent, started_at, expires_at)
       VALUES ($1,$2,$3,$4::jsonb,'[]'::jsonb,$5,'in_progress',TRUE,NOW(),NOW() + INTERVAL '10 minutes')
       RETURNING id, started_at, expires_at`,
      [wp.id, referenceNumber, candidateName || [wp.first_name, wp.last_name].filter(Boolean).join(" "), JSON.stringify(QUESTIONS), accessToken]
    );
    res.status(201).json({
      interviewId: inserted.rows[0].id,
      accessToken,
      referenceNumber,
      candidateName: candidateName || [wp.first_name, wp.last_name].filter(Boolean).join(" "),
      jobTitle: wp.job_title || "Greenhouse Worker",
      questions: QUESTIONS,
      durationSeconds: LIMIT_SECONDS,
      expiresAt: inserted.rows[0].expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Could not start the interview. Please try again later." });
  }
});

router.post("/interviews/:id/submit", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const answers = req.body?.answers;
  const accessToken = String(req.body?.accessToken || "");
  if (!Number.isInteger(id) || id <= 0 || !/^[a-f0-9]{48}$/.test(accessToken) || !Array.isArray(answers) || answers.length !== QUESTIONS.length ||
      answers.some((a: unknown) => typeof a !== "string" || a.length > 12000)) {
    res.status(400).json({ error: "Invalid interview answers." });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE work_permit_interviews
       SET answers = $1::jsonb,
           status = CASE WHEN expires_at <= NOW() THEN 'time_expired' ELSE 'completed' END,
           completed_at = NOW()
       WHERE id = $2 AND access_token = $3 AND status = 'in_progress' AND completed_at IS NULL AND expires_at >= NOW()
       RETURNING reference_number, status, expires_at`,
      [JSON.stringify(answers.map((a: string) => a.trim())), id, accessToken]
    );
    if (!result.rows.length) {
      await pool.query("UPDATE work_permit_interviews SET status = 'time_expired', completed_at = NOW() WHERE id = $1 AND access_token = $2 AND status = 'in_progress' AND expires_at < NOW()", [id, accessToken]);
      res.status(409).json({ error: "This interview is already closed, expired, or could not be found. Answers can no longer be changed." });
      return;
    }
    res.json({ success: true, referenceNumber: result.rows[0].reference_number, status: result.rows[0].status });
  } catch {
    res.status(500).json({ error: "Could not save interview answers." });
  }
});

router.get("/admin/work-permit-interviews", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query(
      `SELECT id, work_permit_id, reference_number, candidate_name, questions, answers, status,
              consent, started_at, expires_at, completed_at, created_at
       FROM work_permit_interviews
       ORDER BY created_at DESC
       LIMIT 500`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Could not load interview records." });
  }
});

export default router;
