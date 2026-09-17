import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
router.use("/admin/file-search", requireAdmin);

router.get("/admin/file-search/:referenceNumber", async (req, res): Promise<void> => {
  const referenceNumber = String(req.params.referenceNumber || "").trim().toUpperCase();
  if (!referenceNumber) { res.status(400).json({ error: "File Number is required" }); return; }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT id, reference_number, first_name, last_name, email, phone, permit_type, employer_name, employer_country, job_title, job_salary, status, payment_status, admin_notes, start_date, contract_duration, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, created_at FROM work_permits WHERE reference_number = $1 LIMIT 1`, [referenceNumber]);
    if (!rows.length) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({ application: rows[0] });
  } finally { client.release(); }
});

router.patch("/admin/file-search/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body ?? {};
  const allowed: Record<string, string> = { status: "status", employerName: "employer_name", employerCountry: "employer_country", jobTitle: "job_title", startDate: "start_date", contractDuration: "contract_duration", adminNotes: "admin_notes" };
  const setClauses: string[] = []; const values: unknown[] = []; let index = 1;
  for (const [key, column] of Object.entries(allowed)) {
    if (body[key] !== undefined) { setClauses.push(`${column} = $${index++}`); values.push(body[key] === null ? null : String(body[key]).trim()); }
  }
  if (!setClauses.length) { res.status(400).json({ error: "No fields to update" }); return; }
  values.push(id);
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`UPDATE work_permits SET ${setClauses.join(", ")} WHERE id = $${index} RETURNING id, reference_number, first_name, last_name, email, phone, permit_type, job_salary, employer_name, employer_country, job_title, status, payment_status, admin_notes, start_date, contract_duration, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, created_at`, values);
    if (!rows.length) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({ success: true, application: rows[0] });
  } finally { client.release(); }
});

export default router;
