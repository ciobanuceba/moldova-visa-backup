import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, workPermitsTable } from "@workspace/db";
import { sendEmail, workPermitReceivedEmail } from "../lib/email";
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

  const required = [
    "firstName", "lastName", "email", "phone", "nationality",
    "dateOfBirth", "passportNumber", "passportExpiry", "currentAddress",
    "permitType", "employerName", "employerCountry", "jobTitle",
    "jobSalary", "startDate", "contractDuration",
  ];

  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const referenceNumber = generateRef();

  const [permit] = await db
    .insert(workPermitsTable)
    .values({
      referenceNumber,
      firstName:        body.firstName.trim(),
      lastName:         body.lastName.trim(),
      email:            body.email.trim().toLowerCase(),
      phone:            body.phone.trim(),
      nationality:      body.nationality.trim(),
      dateOfBirth:      body.dateOfBirth,
      passportNumber:   body.passportNumber.trim(),
      passportExpiry:   body.passportExpiry,
      currentAddress:   body.currentAddress.trim(),
      permitType:       body.permitType.trim(),
      employerName:     body.employerName.trim(),
      employerCountry:  body.employerCountry.trim(),
      jobTitle:         body.jobTitle.trim(),
      jobSalary:        body.jobSalary.trim(),
      startDate:        body.startDate,
      contractDuration: body.contractDuration.trim(),
      hasPassport:      Boolean(body.hasPassport),
      hasJobOffer:      Boolean(body.hasJobOffer),
      hasMedicalCert:   Boolean(body.hasMedicalCert),
      hasCriminalRecord: Boolean(body.hasCriminalRecord),
      hasPhotos:        Boolean(body.hasPhotos),
      hasEducationCert: Boolean(body.hasEducationCert),
      status:           "submitted",
    })
    .returning();

  // Send confirmation email (non-blocking)
  sendEmail({
    to: permit.email,
    subject: `Work Permit Application Received — ${referenceNumber}`,
    html: workPermitReceivedEmail(permit.firstName, referenceNumber),
  }).catch((err) => logger.error({ err }, "Failed to send work permit received email"));

  res.status(201).json({
    id:              permit.id,
    referenceNumber: permit.referenceNumber,
    status:          permit.status,
    createdAt:       permit.createdAt.toISOString(),
    firstName:       permit.firstName,
    lastName:        permit.lastName,
    email:           permit.email,
  });
});

export default router;
