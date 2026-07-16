import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, workPermitsTable } from "@workspace/db";
import { sendEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateRef(): string {
  const prefix = "MVA";
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${year}-${rand}`;
}

router.post("/work-permits", async (req, res): Promise<void> => {
  const body = req.body;
  const required = ["firstName","lastName","email","phone","nationality","dateOfBirth","passportNumber","passportExpiry","currentAddress","permitType","employerName","employerCountry","jobTitle","jobSalary","startDate","contractDuration"];
  for (const f of required) {
    if (!body[f] || typeof body[f]!== "string" ||!body[f].trim()) {
      res.status(400).json({ error: `Missing: ${f}` });
      return;
    }
  }
  const ref = generateRef();
  try {
    const [permit] = await db.insert(workPermitsTable).values({
      referenceNumber: ref,
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
    }).returning();

    sendEmail({ to: permit.email, subject: `Received ${ref}`, html: `<p>Hi ${permit.firstName}, application ${ref} received.</p>` }).catch(()=>{});

    res.status(201).json({ id: permit.id, referenceNumber: permit.referenceNumber, status: permit.status, firstName: permit.firstName, lastName: permit.lastName, email: permit.email, createdAt: permit.createdAt?.toISOString() });
  } catch (e) {
    logger.error({ err: e }, "DB fail");
    res.status(500).json({ error: "DB save failed" });
  }
});

router.patch("/work-permits/:id/approve-payment", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { pool } = await import("@workspace/db");
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE work_permits SET status = 'approved', payment_status = 'paid', payment_reviewed_at = NOW(), payment_rejection_reason = NULL WHERE id = $1 RETURNING *`,
      [parseInt(id)]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const p = rows[0];
    sendEmail({ to: p.email, subject: `Payment Approved ${p.reference_number}`, html: `<p>Payment for ${p.reference_number} approved!</p>` }).catch(()=>{});
    res.json({ message: "Approved", permit: p });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error" });
  } finally {
    client.release();
  }
});

export default router;