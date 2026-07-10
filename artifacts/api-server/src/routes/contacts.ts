import { Router, type IRouter } from "express";
import { db, contactsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";
import { sendEmail, contactConfirmationEmail, contactAdminNotificationEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contact] = await db
    .insert(contactsTable)
    .values(parsed.data)
    .returning();

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@moldova-visa-assist.replit.app";

  sendEmail({
    to: contact.email,
    subject: "We've Received Your Message — Moldova Visa Assist",
    html: contactConfirmationEmail(contact.name, contact.message),
  }).catch((err) => logger.error({ err }, "Failed to send contact confirmation email"));

  sendEmail({
    to: adminEmail,
    subject: `New Contact Form Submission: ${contact.subject}`,
    html: contactAdminNotificationEmail(contact.name, contact.email, contact.phone ?? undefined, contact.subject, contact.message),
  }).catch((err) => logger.error({ err }, "Failed to send contact admin notification email"));

  res.status(201).json({ ...contact, createdAt: contact.createdAt.toISOString() });
});

export default router;
