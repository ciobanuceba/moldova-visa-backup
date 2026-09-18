import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { requireApplicant } from "../middleware/requireApplicant";

const router: IRouter = Router();

router.use("/applicant", requireApplicant);

// Get all applications for the logged-in applicant
router.get("/applicant/applications", async (req, res): Promise<void> => {
  const { email } = (req as any).applicant;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT a.id, a.job_id, a.reference_number, a.first_name, a.last_name, a.email, a.status,
              a.created_at, a.admin_notes, a.employer_name, a.employer_country,\n              a.nationality, a.date_of_birth, a.years_experience, a.skills, a.languages, a.available_from, a.cover_letter,
              j.title as job_title, j.location, j.salary, j.category
       FROM applications a
       LEFT JOIN jobs j ON j.id = a.job_id
       WHERE a.email = $1
       ORDER BY a.created_at DESC`,
      [email]
    );
    res.json(rows);
  } finally {
    client.release();
  }
});

// Get all work permit applications for the logged-in applicant
router.get("/applicant/work-permits", async (req, res): Promise<void> => {
  const { email } = (req as any).applicant;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, reference_number, first_name, last_name, email, permit_type,
              employer_name, company_name, employer_country, job_title, job_salary, permit_type, status, payment_status, payment_method,
              passport_expiry, current_address, passport_number, nationality, date_of_birth, start_date, contract_duration,
              employer_logo_data, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, admin_notes,
              created_at
       FROM work_permits WHERE email = $1 ORDER BY created_at DESC`,
      [email]
    );
    res.json(rows);
  } finally {
    client.release();
  }
});

export default router;
