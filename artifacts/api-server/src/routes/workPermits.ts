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
  logger.info({ body }, "Incoming work permit request body");

  const required = [
    "firstName", "lastName", "email", "phone", "nationality",
    "dateOfBirth", "passportNumber", "passportExpiry", "currentAddress",
    "permitType", "employerName", "employerCountry", "jobTitle",
    "jobSalary", "startDate", "contractDuration",
  ];

  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || !body[field].trim()) {
      logger.error({ field }, "Missing required field in work permit");
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    logger.error({ email: body.email }, "Invalid email format in work permit");
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const referenceNumber = generateRef();
  let permit;

  try {
    // ডাটাবেজ সেভ করার চেষ্টা (Safe Insertion)
    const [insertedPermit] = await db
      .insert(workPermitsTable)
      .values({
        referenceNumber,
        firstName:        body.firstName.trim(),
        lastName:          body.lastName.trim(),
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

    permit = insertedPermit;
    logger.info({ permitId: permit.id, referenceNumber }, "Work permit successfully saved to database");
  } catch (dbError) {
    // ডাটাবেজ ফেইল হলে লগ প্রিন্ট হবে কিন্তু সার্ভার ক্র্যাশ করবে না
    logger.error({ err: dbError }, "Database insertion failed for Work Permit!");
    res.status(500).json({ error: "Database save failed. Please check server logs." });
    return;
  }

  // ১. ইউজারকে কনফার্মেশন মেইল পাঠানো (Non-blocking)
  sendEmail({
    to: permit.email,
    subject: `Work Permit Application Received — ${referenceNumber}`,
    html: workPermitReceivedEmail(permit.firstName, referenceNumber),
  })
    .then(() => logger.info({ to: permit.email }, "User work permit confirmation email sent successfully"))
    .catch((err) => logger.error({ err }, "Failed to send work permit received email"));

  // ২. অ্যাডমিনকে নোটিফিকেশন মেইল পাঠানো (Non-blocking)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #0f172a; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">🚨 New Work Permit Submitted</h2>
          <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Ref: ${referenceNumber}</p>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
          <p>Hi Admin,</p>
          <p>A new work permit application has been submitted on the portal. Details below:</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; width: 35%;">Applicant Name:</td><td style="padding: 8px;">${permit.firstName} ${permit.lastName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${permit.email}">${permit.email}</a></td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${permit.phone}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Nationality:</td><td style="padding: 8px;">${permit.nationality}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Passport No:</td><td style="padding: 8px;">${permit.passportNumber}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Permit Type:</td><td style="padding: 8px;">${permit.permitType}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Employer:</td><td style="padding: 8px;">${permit.employerName} (${permit.employerCountry})</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Job Title:</td><td style="padding: 8px;">${permit.jobTitle}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Salary / Duration:</td><td style="padding: 8px;">${permit.jobSalary} / ${permit.contractDuration}</td></tr>
          </table>

          <p style="margin-top: 24px; font-size: 13px; color: #64748b; text-align: center;">Moldova Visa Assist · Admin System</p>
        </div>
      </div>
    `;

    sendEmail({
      to: adminEmail,
      subject: `[Work Permit] New Application: ${permit.firstName} ${permit.lastName} [${referenceNumber}]`,
      html: adminHtml,
    })
      .then(() => logger.info({ to: adminEmail }, "Admin work permit notification sent successfully"))
      .catch((err) => logger.error({ err }, "Failed to send admin work permit notification"));
  } else {
    logger.warn("ADMIN_EMAIL is not set. Admin work permit notification skipped.");
  }

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