import { Router, type IRouter } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  sendEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  workPermitApprovedEmail,
  workPermitRejectedEmail,
  workPermitPaymentApprovedEmail,
  workPermitPaymentRejectedEmail,
} from "../lib/email";
import { generateOfferLetterPdf } from "../lib/pdf";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use("/admin", requireAdmin);

// ── Admin statistics ──────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    // Application status breakdown
    const { rows: appStats } = await client.query(`
      SELECT
        COUNT(*)::int                                           AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int        AS pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int       AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int       AS rejected
      FROM applications
    `);

    // Work permit status + revenue
    const { rows: wpStats } = await client.query(`
      SELECT
        COUNT(*)::int                                                AS total,
        COUNT(*) FILTER (WHERE status = 'submitted')::int           AS submitted,
        COUNT(*) FILTER (WHERE status = 'payment_confirmed')::int   AS payment_confirmed,
        COUNT(*) FILTER (WHERE status = 'approved')::int            AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int            AS rejected,
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int        AS paid_count
      FROM work_permits
    `);

    // Applications over last 30 days (daily)
    const { rows: appsByDay } = await client.query(`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'Mon DD') AS day,
        created_at::date                                  AS date,
        COUNT(*)::int                                     AS count
      FROM applications
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date, day
      ORDER BY date ASC
    `);

    // Applications by job category
    const { rows: byCategory } = await client.query(`
      SELECT
        COALESCE(j.category, 'General') AS category,
        COUNT(*)::int                    AS count
      FROM applications a
      LEFT JOIN jobs j ON j.id = a.job_id
      GROUP BY category
      ORDER BY count DESC
      LIMIT 8
    `);

    // Work permits by country (employer_country)
    const { rows: byCountry } = await client.query(`
      SELECT employer_country AS country, COUNT(*)::int AS count
      FROM work_permits
      GROUP BY employer_country
      ORDER BY count DESC
      LIMIT 6
    `);

    // Recent activity (last 10 events across applications + work permits)
    const { rows: recentActivity } = await client.query(`
      (
        SELECT 'application' AS type, first_name || ' ' || last_name AS name,
               status, created_at
        FROM applications
        ORDER BY created_at DESC LIMIT 5
      )
      UNION ALL
      (
        SELECT 'work_permit' AS type, first_name || ' ' || last_name AS name,
               status, created_at
        FROM work_permits
        ORDER BY created_at DESC LIMIT 5
      )
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Applicant registrations over last 30 days
    const { rows: registrations } = await client.query(`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'Mon DD') AS day,
        created_at::date                                  AS date,
        COUNT(*)::int                                     AS count
      FROM applicant_users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date, day
      ORDER BY date ASC
    `);

    const apps = appStats[0];
    const wps = wpStats[0];
    const approvalRate = apps.total > 0
      ? Math.round((apps.approved / apps.total) * 100)
      : 0;
    const revenue = wps.paid_count * 99; // €99 per paid permit

    res.json({
      applications: {
        total: apps.total,
        pending: apps.pending,
        approved: apps.approved,
        rejected: apps.rejected,
        approvalRate,
      },
      workPermits: {
        total: wps.total,
        submitted: wps.submitted,
        paymentConfirmed: wps.payment_confirmed,
        approved: wps.approved,
        rejected: wps.rejected,
        paidCount: wps.paid_count,
        revenue,
      },
      charts: {
        applicationsByDay: appsByDay.map(r => ({ day: r.day, applications: r.count })),
        byCategory: byCategory.map(r => ({ category: r.category, count: r.count })),
        byCountry: byCountry.map(r => ({ country: r.country, count: r.count })),
        registrationsByDay: registrations.map(r => ({ day: r.day, signups: r.count })),
      },
      recentActivity: recentActivity.map(r => ({
        type: r.type,
        name: r.name,
        status: r.status,
        createdAt: r.created_at,
      })),
    });
  } finally {
    client.release();
  }
});

// ── Applications ──────────────────────────────────────────────────────────────

router.get("/admin/applications", async (_req, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .orderBy(applicationsTable.createdAt);
  res.json(apps.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.patch("/admin/applications/:id/approve", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { notes } = req.body ?? {};

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT a.*, j.title as job_title, j.location, j.salary
       FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE a.id = $1`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Application not found" }); return; }
    const app = rows[0];

    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateOfferLetterPdf({
        applicantName: `${app.first_name} ${app.last_name}`,
        jobTitle: app.job_title ?? "Position",
        location: app.location ?? "Europe",
        salary: app.salary ?? "As discussed",
        startDate: app.available_from ?? undefined,
        adminNotes: notes ?? undefined,
      });
    } catch (err) {
      logger.error({ err }, "PDF generation failed — approving without PDF");
    }

    await client.query(
      `UPDATE applications SET status = 'approved', admin_notes = $1 WHERE id = $2`,
      [notes ?? null, id]
    );

    await sendEmail({
      to: app.email,
      subject: `Congratulations — Your Application for ${app.job_title ?? "the position"} is Approved`,
      html: applicationApprovedEmail(
        app.first_name,
        app.job_title ?? "your applied position",
        notes ?? "We will contact you shortly with the next steps."
      ),
      attachments: pdfBuffer
        ? [{ filename: "Job_Offer_Letter.pdf", content: pdfBuffer, contentType: "application/pdf" }]
        : undefined,
    });

    res.json({ success: true, status: "approved" });
  } finally {
    client.release();
  }
});

router.patch("/admin/applications/:id/reject", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { reason } = req.body ?? {};

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT a.*, j.title as job_title FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE a.id = $1`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Application not found" }); return; }
    const app = rows[0];

    await client.query(
      `UPDATE applications SET status = 'rejected', admin_notes = $1 WHERE id = $2`,
      [reason ?? null, id]
    );

    await sendEmail({
      to: app.email,
      subject: `Application Update — ${app.job_title ?? "Your Application"}`,
      html: applicationRejectedEmail(app.first_name, app.job_title ?? "the position", reason),
    });

    res.json({ success: true, status: "rejected" });
  } finally {
    client.release();
  }
});

// On-demand offer letter PDF (admin can download it separately)
router.get("/admin/applications/:id/offer-letter", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT a.*, j.title as job_title, j.location, j.salary
       FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE a.id = $1`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Application not found" }); return; }
    const app = rows[0];
    const pdfBuffer = await generateOfferLetterPdf({
      applicantName: `${app.first_name} ${app.last_name}`,
      jobTitle:      app.job_title ?? "Position",
      location:      app.location ?? "Europe",
      salary:        app.salary ?? "As discussed",
      startDate:     app.available_from ?? undefined,
      adminNotes:    app.admin_notes ?? undefined,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Offer_Letter_${id}.pdf"`);
    res.send(pdfBuffer);
  } finally {
    client.release();
  }
});

// ── Work Permits ──────────────────────────────────────────────────────────────

router.get("/admin/work-permits", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT * FROM work_permits ORDER BY created_at DESC`);
    res.json(rows);
  } finally {
    client.release();
  }
});

router.patch("/admin/work-permits/:id/approve", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { notes } = req.body ?? {};
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits SET status = 'approved', admin_notes = $1 WHERE id = $2 RETURNING *`,
      [notes ?? null, id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const permit = rows[0];

    sendEmail({
      to: permit.email,
      subject: `Work Permit Approved — ${permit.reference_number}`,
      html: workPermitApprovedEmail(permit.first_name, permit.reference_number, notes ?? undefined),
    }).catch((err) => logger.error({ err }, "Failed to send work permit approved email"));

    res.json({ success: true, status: "approved" });
  } finally { client.release(); }
});

router.patch("/admin/work-permits/:id/reject", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { reason } = req.body ?? {};
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits SET status = 'rejected', admin_notes = $1 WHERE id = $2 RETURNING *`,
      [reason ?? null, id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const permit = rows[0];

    sendEmail({
      to: permit.email,
      subject: `Work Permit Application Update — ${permit.reference_number}`,
      html: workPermitRejectedEmail(permit.first_name, permit.reference_number, reason ?? undefined),
    }).catch((err) => logger.error({ err }, "Failed to send work permit rejected email"));

    res.json({ success: true, status: "rejected" });
  } finally { client.release(); }
});

// ── Payments (manual receipt review) ───────────────────────────────────────────

router.get("/admin/payments", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, reference_number, first_name, last_name, email, job_title, employer_name,
              employer_country, status, payment_status, payment_method, receipt_url,
              receipt_filename, receipt_uploaded_at, payment_reviewed_at, payment_rejection_reason,
              created_at
       FROM work_permits
       WHERE receipt_url IS NOT NULL
       ORDER BY receipt_uploaded_at DESC NULLS LAST`
    );
    res.json(rows);
  } finally {
    client.release();
  }
});

router.patch("/admin/payments/:id/approve", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits
       SET payment_status = 'paid', status = CASE WHEN status = 'submitted' THEN 'payment_confirmed' ELSE status END,
           payment_reviewed_at = NOW(), payment_rejection_reason = NULL
       WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const permit = rows[0];

    sendEmail({
      to: permit.email,
      subject: `Payment Approved — ${permit.reference_number}`,
      html: workPermitPaymentApprovedEmail(permit.first_name, permit.reference_number),
    }).catch((err) => logger.error({ err }, "Failed to send payment approved email"));

    res.json({ success: true, paymentStatus: "paid" });
  } finally {
    client.release();
  }
});

router.patch("/admin/payments/:id/reject", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { reason } = req.body ?? {};
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits
       SET payment_status = 'rejected', payment_reviewed_at = NOW(), payment_rejection_reason = $1
       WHERE id = $2 RETURNING *`,
      [reason ?? null, id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const permit = rows[0];

    sendEmail({
      to: permit.email,
      subject: `Payment Receipt Update — ${permit.reference_number}`,
      html: workPermitPaymentRejectedEmail(permit.first_name, permit.reference_number, reason ?? undefined),
    }).catch((err) => logger.error({ err }, "Failed to send payment rejected email"));

    res.json({ success: true, paymentStatus: "rejected" });
  } finally {
    client.release();
  }
});

// ── Jobs ──────────────────────────────────────────────────────────────────────

router.post("/admin/jobs", async (req, res): Promise<void> => {
  const { title, location, salary, category, type, description, requirements, benefits, isActive } = req.body ?? {};
  if (!title || !location || !category) {
    res.status(400).json({ error: "title, location and category are required" });
    return;
  }
  const [job] = await db
    .insert(jobsTable)
    .values({
      title:        String(title).trim(),
      location:     String(location).trim(),
      salary:       salary       ? String(salary).trim()       : "Competitive",
      category:     String(category).trim(),
      type:         type         ? String(type).trim()         : "Full-time",
      description:  description  ? String(description).trim()  : "",
      requirements: requirements ? String(requirements).trim() : "",
      benefits:     benefits     ? String(benefits).trim()     : undefined,
      isActive:     isActive !== false,
    })
    .returning();
  res.status(201).json(job);
});

router.patch("/admin/jobs/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = req.body ?? {};
  const client = await pool.connect();
  try {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    const strField = (key: string, col: string) => {
      if (body[key] !== undefined) { setClauses.push(`${col} = $${idx++}`); values.push(String(body[key]).trim()); }
    };
    strField("title",        "title");
    strField("location",     "location");
    strField("salary",       "salary");
    strField("category",     "category");
    strField("type",         "type");
    strField("description",  "description");
    strField("requirements", "requirements");
    strField("benefits",     "benefits");
    if (body.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(Boolean(body.isActive)); }
    if (setClauses.length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
    values.push(id);
    const { rows } = await client.query(
      `UPDATE jobs SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (rows.length === 0) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(rows[0]);
  } finally {
    client.release();
  }
});

router.patch("/admin/jobs/:id/toggle", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  const [updated] = await db.update(jobsTable).set({ isActive: !job.isActive }).where(eq(jobsTable.id, id)).returning();
  res.json(updated);
});

router.delete("/admin/jobs/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.json({ success: true });
});

export default router;
