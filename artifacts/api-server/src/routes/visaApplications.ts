import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db, applicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail, applicationReceivedEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function makeReference(data: Record<string, string>) {
  const raw = [data.firstName, data.lastName, data.passportNumber, data.visaType, data.travelDate].join("|");
  return `MVA-VISA-${createHash("sha256").update(raw).digest("hex").slice(0, 10).toUpperCase()}`;
}

router.post("/visa-applications", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const fields = ["firstName", "lastName", "email", "phone", "nationality", "dateOfBirth", "passportNumber", "visaType", "destination", "travelDate", "purpose"];
  const data: Record<string, string> = {};
  for (const field of fields) {
    const value = clean(body[field]);
    if (!value) { res.status(400).json({ error: `${field} is required` }); return; }
    data[field] = value;
  }
  if (!validEmail(data.email)) { res.status(400).json({ error: "Invalid email address" }); return; }

  const referenceNumber = makeReference(data);
  const details = JSON.stringify({
    type: "visa",
    referenceNumber,
    visaType: data.visaType,
    destination: data.destination,
    travelDate: data.travelDate,
    returnDate: clean(body.returnDate),
    accommodation: clean(body.accommodation),
    purpose: data.purpose,
    notes: clean(body.notes),
  });

  try {
    const [application] = await db.insert(applicationsTable).values({
      jobId: 0,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      nationality: data.nationality,
      dateOfBirth: data.dateOfBirth,
      passportNumber: data.passportNumber,
      coverLetter: details,
      status: "pending",
    }).returning();

    sendEmail({
      to: data.email,
      subject: `Visa Application Received [${referenceNumber}]`,
      html: `${applicationReceivedEmail(data.firstName, "Visa Application")}<p style="font-family:Arial,sans-serif"><strong>Reference number:</strong> ${referenceNumber}</p>`,
    }).catch(err => logger.error({ err }, "Failed to send visa applicant email"));

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Visa Application [${referenceNumber}]`,
        html: `<div style="font-family:Arial,sans-serif"><h2>New Visa Application</h2><p><strong>Reference:</strong> ${referenceNumber}</p><p><strong>Applicant:</strong> ${data.firstName} ${data.lastName}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Nationality:</strong> ${data.nationality}</p><p><strong>Visa type:</strong> ${data.visaType}</p><p><strong>Destination:</strong> ${data.destination}</p><p><strong>Travel date:</strong> ${data.travelDate}</p></div>`,
      }).catch(err => logger.error({ err }, "Failed to send visa admin email"));
    }

    res.status(201).json({ id: application.id, referenceNumber, status: "pending" });
  } catch (error) {
    logger.error({ err: error }, "Failed to save visa application");
    res.status(500).json({ error: "Unable to save visa application" });
  }
});

export default router;
