import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, pool, workPermitsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";
import { generateOfferLetterPdf } from "../lib/pdf";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();
router.use("/admin/manual", requireAdmin);

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function manualReference(): string {
  return `MVA-MAN-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

// Historical Job Offer records are stored separately and never overwrite applications or work permits.
router.get("/admin/manual/old-job-offers", async (_req, res): Promise<void> => {
  try {
    const { rows } = await pool.query(
      "SELECT id, reference_number, applicant_name, job_title, location, salary, employer_name, employer_country, start_date, contract_duration, admin_notes, created_at FROM old_job_offers ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Historical Job Offer list failed", err);
    res.status(500).json({ error: "Could not load old Job Offer records" });
  }
});

router.get("/admin/manual/old-job-offers/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid old Job Offer record ID" }); return; }
  try {
    const { rows } = await pool.query(
      "SELECT id, reference_number, applicant_name, job_title, location, salary, employer_name, employer_country, start_date, contract_duration, admin_notes, created_at FROM old_job_offers WHERE id = $1",
      [id]
    );
    if (!rows.length) { res.status(404).json({ error: "Old Job Offer record not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error("Historical Job Offer lookup failed", err);
    res.status(500).json({ error: "Could not load old Job Offer record" });
  }
});

// Create a PDF from a saved historical record, email it only to the admin, and return it for download.
router.post("/admin/manual/old-job-offers/:id/download", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid old Job Offer record ID" }); return; }
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
  if (!adminEmail) { res.status(503).json({ error: "Admin email is not configured. Please contact the administrator." }); return; }
  try {
    const { rows } = await pool.query(
      "SELECT reference_number, applicant_name, job_title, location, salary, employer_name, start_date, admin_notes FROM old_job_offers WHERE id = $1",
      [id]
    );
    if (!rows.length) { res.status(404).json({ error: "Old Job Offer record not found" }); return; }
    const record = rows[0];
    const pdf = await generateOfferLetterPdf({
      applicantName: record.applicant_name,
      jobTitle: record.job_title,
      location: record.location,
      salary: record.salary,
      startDate: record.start_date || undefined,
      employerName: record.employer_name || "MOLDOVA VISA ASSIST SRL",
      adminNotes: record.admin_notes || undefined,
      referenceNumber: record.reference_number,
      applicationDate: new Date().toISOString(),
    });
    await sendEmail({
      to: adminEmail,
      subject: `Historical Job Offer PDF — ${record.applicant_name} — ${record.reference_number}`,
      html: `<div style="font-family:Arial,sans-serif"><h2>Historical Job Offer PDF Ready</h2><p><strong>Applicant:</strong> ${record.applicant_name}</p><p><strong>Old Reference:</strong> ${record.reference_number}</p><p><strong>Position:</strong> ${record.job_title}</p><p>The Job Offer PDF is attached. Please review it and forward it to the applicant when appropriate.</p></div>`,
      attachments: [{ filename: `Job_Offer_${record.reference_number}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Job_Offer_${record.reference_number}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("Historical Job Offer PDF/email failed", err);
    res.status(500).json({ error: "Could not create and email the Job Offer PDF to Admin" });
  }
});

router.put("/admin/manual/old-job-offers/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid old Job Offer record ID" }); return; }
  const body = req.body ?? {};
  const referenceNumber = text(body.referenceNumber).toUpperCase();
  const applicantName = text(body.applicantName);
  const jobTitle = text(body.jobTitle);
  const location = text(body.location);
  const salary = text(body.salary);
  if (!referenceNumber || !applicantName || !jobTitle || !location || !salary) {
    res.status(400).json({ error: "Reference Number, applicant name, position, location and salary are required" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE old_job_offers SET
       reference_number = $1, applicant_name = $2, job_title = $3, location = $4, salary = $5,
       employer_name = $6, employer_country = $7, start_date = $8, contract_duration = $9, admin_notes = $10
       WHERE id = $11
       RETURNING id, reference_number, applicant_name, job_title, location, salary, employer_name, employer_country, start_date, contract_duration, admin_notes, created_at`,
      [referenceNumber, applicantName, jobTitle, location, salary, text(body.employerName) || null, text(body.employerCountry) || null, text(body.startDate) || null, text(body.contractDuration) || null, text(body.adminNotes) || null, id]
    );
    if (!rows.length) { res.status(404).json({ error: "Old Job Offer record not found" }); return; }
    res.json({ success: true, record: rows[0] });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "This old Job Offer Reference Number is already saved" });
      return;
    }
    console.error("Historical Job Offer update failed", err);
    res.status(500).json({ error: "Could not update old Job Offer record" });
  }
});

router.post("/admin/manual/old-job-offers", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const referenceNumber = text(body.referenceNumber).toUpperCase();
  const applicantName = text(body.applicantName);
  const jobTitle = text(body.jobTitle);
  const location = text(body.location);
  const salary = text(body.salary);
  if (!referenceNumber || !applicantName || !jobTitle || !location || !salary) {
    res.status(400).json({ error: "Reference Number, applicant name, position, location and salary are required" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO old_job_offers
       (reference_number, applicant_name, job_title, location, salary, employer_name, employer_country, start_date, contract_duration, admin_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, reference_number, applicant_name, job_title, location, salary, employer_name, employer_country, start_date, contract_duration, admin_notes, created_at`,
      [referenceNumber, applicantName, jobTitle, location, salary, text(body.employerName) || null, text(body.employerCountry) || null, text(body.startDate) || null, text(body.contractDuration) || null, text(body.adminNotes) || null]
    );
    res.status(201).json({ success: true, record: rows[0] });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "This old Job Offer Reference Number is already saved" });
      return;
    }
    console.error("Historical Job Offer save failed", err);
    res.status(500).json({ error: "Could not save old Job Offer record" });
  }
});

// Manual Job Offer: generates the existing Job Offer PDF only. No existing application is changed.
router.post("/admin/manual/job-offer", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const applicantName = text(body.applicantName);
  const jobTitle = text(body.jobTitle);
  const location = text(body.location);
  const salary = text(body.salary);
  if (!applicantName || !jobTitle || !location || !salary) {
    res.status(400).json({ error: "Applicant name, position, location and salary are required" });
    return;
  }

  try {
    const pdf = await generateOfferLetterPdf({
      applicantName,
      jobTitle,
      location,
      salary,
      startDate: text(body.startDate) || undefined,
      employerName: text(body.employerName, "MOLDOVA VISA ASSIST SRL"),
      adminNotes: text(body.adminNotes) || undefined,
      referenceNumber: text(body.referenceNumber, manualReference()),
      applicationDate: text(body.applicationDate) || new Date().toISOString(),
      email: text(body.email) || undefined,
      phone: text(body.phone) || undefined,
      nationality: text(body.nationality) || undefined,
      dateOfBirth: text(body.dateOfBirth) || undefined,
      passportNumber: text(body.passportNumber) || undefined,
      yearsExperience: text(body.yearsExperience) || undefined,
      skills: text(body.skills) || undefined,
      languages: text(body.languages) || undefined,
      experience: text(body.experience) || undefined,
      coverLetter: text(body.coverLetter) || undefined,
      resumeUrl: text(body.resumeUrl) || undefined,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Manual_Job_Offer_${Date.now()}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("Manual Job Offer generation failed", err);
    res.status(500).json({ error: "Failed to generate Job Offer PDF" });
  }
});

// Manual Work Permit entry: creates a normal work_permits row and leaves the existing PDF/actions untouched.
router.post("/admin/manual/work-permit", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const required = [
    "firstName", "lastName", "email", "phone", "nationality", "dateOfBirth",
    "passportNumber", "passportExpiry", "currentAddress", "permitType",
    "employerName", "employerCountry", "jobTitle", "jobSalary", "startDate", "contractDuration",
  ];
  for (const field of required) {
    if (!text(body[field])) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.email))) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const referenceNumber = manualReference();
    const [permit] = await db.insert(workPermitsTable).values({
      referenceNumber,
      firstName: text(body.firstName),
      lastName: text(body.lastName),
      email: text(body.email).toLowerCase(),
      phone: text(body.phone),
      nationality: text(body.nationality),
      dateOfBirth: text(body.dateOfBirth),
      passportNumber: text(body.passportNumber),
      passportExpiry: text(body.passportExpiry),
      currentAddress: text(body.currentAddress),
      permitType: text(body.permitType),
      employerName: text(body.employerName),
      employerCountry: text(body.employerCountry),
      jobTitle: text(body.jobTitle),
      jobSalary: text(body.jobSalary),
      startDate: text(body.startDate),
      contractDuration: text(body.contractDuration),
      hasPassport: Boolean(body.hasPassport),
      hasJobOffer: Boolean(body.hasJobOffer),
      hasMedicalCert: Boolean(body.hasMedicalCert),
      hasCriminalRecord: Boolean(body.hasCriminalRecord),
      hasPhotos: Boolean(body.hasPhotos),
      hasEducationCert: Boolean(body.hasEducationCert),
      status: "submitted",
      paymentStatus: "unpaid",
      adminNotes: text(body.adminNotes) || null,
    }).returning();

    res.status(201).json({ success: true, permit });
  } catch (err) {
    console.error("Manual Work Permit creation failed", err);
    res.status(500).json({ error: "Failed to create manual Work Permit application" });
  }
});

export default router;
