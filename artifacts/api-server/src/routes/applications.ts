import { Router, type IRouter } from "express";
import { db, applicationsTable } from "@workspace/db";
import { sendEmail, applicationReceivedEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeString(val: unknown): string | null {
  if (typeof val !== "string" || !val.trim()) return null;
  return val.trim();
}

router.get("/applications", async (_req, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .orderBy(applicationsTable.createdAt);
  res.json(apps.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/applications", async (req, res): Promise<void> => {
  const body = req.body;

  const jobId = Number(body.jobId);
  if (!Number.isInteger(jobId) || jobId < 0) {
    res.status(400).json({ error: "jobId must be a non-negative integer" });
    return;
  }

  const firstName = sanitizeString(body.firstName);
  const lastName  = sanitizeString(body.lastName);
  const email     = sanitizeString(body.email);
  const phone     = sanitizeString(body.phone);

  if (!firstName) { res.status(400).json({ error: "firstName is required" }); return; }
  if (!lastName)  { res.status(400).json({ error: "lastName is required" });  return; }
  if (!email)     { res.status(400).json({ error: "email is required" });     return; }
  if (!phone)     { res.status(400).json({ error: "phone is required" });     return; }
  if (!isValidEmail(email)) { res.status(400).json({ error: "Invalid email address" }); return; }

  const nationality     = sanitizeString(body.nationality);
  const dateOfBirth     = sanitizeString(body.dateOfBirth);
  const passportNumber  = sanitizeString(body.passportNumber);
  const yearsExperience = sanitizeString(body.yearsExperience);
  const skills          = sanitizeString(body.skills);
  const languages       = sanitizeString(body.languages);
  const availableFrom   = sanitizeString(body.availableFrom);
  const resumeUrl       = sanitizeString(body.resumeUrl);
  const coverLetter     = sanitizeString(body.coverLetter);
  const experience      = sanitizeString(body.experience);

  const [app] = await db
    .insert(applicationsTable)
    .values({
      jobId,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      dateOfBirth,
      passportNumber,
      yearsExperience,
      skills,
      languages,
      availableFrom,
      resumeUrl,
      coverLetter,
      experience,
      status: "pending",
    })
    .returning();

  const jobTitle = sanitizeString(body.jobTitle) ?? "your applied position";

  // ১. ইউজারকে অটো-কনফার্মেশন মেইল পাঠানো (Non-blocking)
  sendEmail({
    to: email,
    subject: `Application Received — ${jobTitle}`,
    html: applicationReceivedEmail(firstName, jobTitle),
  }).catch((err) => logger.error({ err }, "Failed to send application received email"));


  // ২. এডমিনকে ইমেইল নোটিফিকেশন পাঠানো (Non-blocking)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    // এডমিন ইমেইলের জন্য সুন্দর একটি HTML বডি তৈরি করা হলো
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #1a2744; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">New Visa Application Submitted</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
          <p>Hi Admin,</p>
          <p>A new visa application has been successfully submitted on the portal. Below are the candidate's details:</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; width: 35%;">Full Name:</td><td style="padding: 8px;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${phone}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Nationality:</td><td style="padding: 8px;">${nationality || "N/A"}</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold;">Passport No:</td><td style="padding: 8px;">${passportNumber || "N/A"}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Target Job:</td><td style="padding: 8px;">${jobTitle}</td></tr>
            <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold;">Experience:</td><td style="padding: 8px;">${yearsExperience ? `${yearsExperience} Years` : "N/A"}</td></tr>
          </table>

          ${resumeUrl ? `
          <div style="margin-top: 20px; padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-weight: bold;">Submitted Resume / PDF:</p>
            <a href="${resumeUrl}" target="_blank" style="background: #2563eb; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px; display: inline-block;">View Document / PDF</a>
          </div>` : ""}

          <p style="margin-top: 24px; font-size: 13px; color: #6b7280; text-align: center;">Moldova Visa Assist · Admin Notification</p>
        </div>
      </div>
    `;

    sendEmail({
      to: adminEmail,
      subject: `🚨 New Application: ${firstName} ${lastName} [${jobTitle}]`,
      html: adminHtml,
    }).catch((err) => logger.error({ err }, "Failed to send admin notification email"));
  } else {
    logger.warn("ADMIN_EMAIL is not set in Secrets. Admin notification email skipped.");
  }

  res.status(201).json({ ...app, createdAt: app.createdAt.toISOString() });
});

export default router;