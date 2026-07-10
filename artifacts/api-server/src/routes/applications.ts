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

  const [app] = await db
    .insert(applicationsTable)
    .values({
      jobId,
      firstName,
      lastName,
      email,
      phone,
      nationality:     sanitizeString(body.nationality),
      dateOfBirth:     sanitizeString(body.dateOfBirth),
      passportNumber:  sanitizeString(body.passportNumber),
      yearsExperience: sanitizeString(body.yearsExperience),
      skills:          sanitizeString(body.skills),
      languages:       sanitizeString(body.languages),
      availableFrom:   sanitizeString(body.availableFrom),
      resumeUrl:       sanitizeString(body.resumeUrl),
      coverLetter:     sanitizeString(body.coverLetter),
      experience:      sanitizeString(body.experience),
      status: "pending",
    })
    .returning();

  // Send confirmation email (non-blocking — failures are logged, not surfaced)
  const jobTitle = sanitizeString(body.jobTitle) ?? "your applied position";
  sendEmail({
    to: email,
    subject: `Application Received — ${jobTitle}`,
    html: applicationReceivedEmail(firstName, jobTitle),
  }).catch((err) => logger.error({ err }, "Failed to send application received email"));

  res.status(201).json({ ...app, createdAt: app.createdAt.toISOString() });
});

export default router;
