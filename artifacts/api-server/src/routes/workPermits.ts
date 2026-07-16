import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, workPermitsTable } from "@workspace/db";
import { sendEmail } from "../lib/email";
import { logger } from "../lib/logger";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateRef(): string {
  const prefix = "MVA";
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${year}-${rand}`;
}

// USER SUBMIT
router.post("/work-permits", async (req, res): Promise<void> => {
  const body = req.body;
  logger.info({ body }, "Incoming work permit request body");

  const required = [
    "firstName", "lastName", "email", "phone", "nationality",
    "dateOfBirth", "passportNumber", "passportExpiry", "currentAddress",
    "permitType", "employerName", "employerCountry", "jobTitle",
    "jobSalary", "startDate", "contractDuration",
  ];

  for (const field of required) {
    if (!body[field] || typeof body[field]!== "string" ||!body[field].trim()) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const referenceNumber = generateRef();
  let permit;

  try {
    const [insertedPermit] = await db
     .insert(workPermitsTable)
     .values({
        referenceNumber,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        nationality: body.nationality.trim(),
        dateOfBirth: body.dateOfBirth,
        passportNumber: body.passportNumber.trim(),
        passportExpiry: body.passportExpiry,
        currentAddress: body.currentAddress.trim(),
        permitType: body.permitType.trim(),
        employerName: body.employerName.trim(),
        employerCountry: body.employerCountry.trim(),
        jobTitle: body.jobTitle.trim(),
        jobSalary: body.jobSalary.trim(),
        startDate: body.startDate,
        contractDuration: body.contractDuration.trim(),
        hasPassport: Boolean(body.hasPassport),
        hasJobOffer: Boolean(body.hasJobOffer),
        hasMedicalCert: Boolean(body.hasMedicalCert),
        hasCriminalRecord: Boolean(body.hasCriminalRecord),
        hasPhotos: Boolean(body.hasPhotos),
        hasEducationCert: Boolean(body.hasEducationCert),
        status: "pending_payment",
      })
     .returning();

    permit = insertedPermit;
  } catch (dbError) {
    logger.error({ err: dbError }, "DB insertion failed");
    res.status(500).json({ error: "Database save failed" });
    return;
  }

  const html = `<p>Hi ${permit.firstName}, Your application ${referenceNumber} received. Please complete payment.</p>`;

  sendEmail({ to: permit.email, subject: `Application Received — ${referenceNumber}`, html }).catch(()=>{});

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendEmail({ to: adminEmail, subject: `[New] ${permit.firstName} [${referenceNumber}]`, html: `<p>New: ${referenceNumber}</p>` }).catch(()=>{});
  }

  res.status(201).json({
    id: permit.id,
    referenceNumber: permit.referenceNumber,
    status: permit.status,
    createdAt: permit.createdAt?.toISOString() || new Date().toISOString(),
    firstName: permit.firstName,
    lastName: permit.lastName,
    email: permit.email,
  });
});

// ADMIN APPROVE - MAIN FIX WITH RAW SQL
router.patch("/work-permits/:id/approve-payment", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { pool } = await import("@workspace/db");
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits SET status = 'approved', payment_status = 'paid', payment_reviewed_at = NOW(), payment_rejection_reason = NULL WHERE id = $1 RETURNING *`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const updatedPermit = rows[0];
    logger.info({ id }, "Payment approved to paid+approved");

    sendEmail({
      to: updatedPermit.email,
      subject: `Payment Confirmed & Approved — ${updatedPermit.reference_number}`,
      html: `<p>Hi ${updatedPermit.first_name}, your payment for ${updatedPermit.reference_number} is approved! Status: Approved</p>`,
    }).catch(()=>{});

    res.status(200).json({ message: "Payment approved", permit: updatedPermit });
  } catch (error) {
    logger.error({ err: error }, "Approve error");
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

export default router;