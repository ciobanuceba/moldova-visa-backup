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

// ======================================================
// ধাপ ১: ইউজার ফর্ম সাবমিট রাউট (স্ট্যাটাস হবে: "pending_payment")
// ======================================================
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
        paymentStatus: "unpaid" as any,
      })
      .returning();

    permit = insertedPermit;
    logger.info({ permitId: permit.id, referenceNumber }, "Work permit saved");
  } catch (dbError) {
    logger.error({ err: dbError }, "DB insertion failed");
    res.status(500).json({ error: "Database save failed" });
    return;
  }

  const paymentInstructionHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #f59e0b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">আবেদন গ্রহণ করা হয়েছে (পেমেন্ট বাকি)</h2>
        <p style="margin: 5px 0 0 0; color: #fef3c7; font-size: 14px;">Ref: ${referenceNumber}</p>
      </div>
      <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
        <p>প্রিয় ${permit.firstName},</p>
        <p>আপনার আবেদনটি পেয়েছি। ভেরিফিকেশনের জন্য পেমেন্ট সম্পন্ন করুন।</p>
      </div>
    </div>
  `;

  sendEmail({
    to: permit.email,
    subject: `Application Received (Payment Pending) — ${referenceNumber}`,
    html: paymentInstructionHtml,
  }).catch((err) => logger.error({ err }, "Failed to send email"));

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      subject: `[Pending Payment] ${permit.firstName} [${referenceNumber}]`,
      html: `<p>New application ${permit.firstName} ${permit.lastName} - Ref: ${referenceNumber}</p>`,
    }).catch(() => {});
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

// ======================================================
// ধাপ ২ ও ৩: ADMIN Payment Accept - MAIN FIX
// ======================================================
router.patch("/work-permits/:id/approve-payment", async (req, res): Promise<void> => {
  const { id } = req.params;

  try {
    // FIX: age sudhu status update hoto, ekhon paymentStatus o paid hobe
    // Tai User Dashboard e ar Pending Review atke thakbe na
    const [updatedPermit] = await db
      .update(workPermitsTable)
      .set({
        status: "approved", // approved korlam jate user Approved dekhte pai
        paymentStatus: "paid" as any,
        paymentReviewedAt: new Date() as any,
        paymentRejectionReason: null as any,
      })
      .where(eq(workPermitsTable.id, parseInt(id)))
      .returning();

    if (!updatedPermit) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    logger.info({ id }, "Payment approved and marked as paid/approved by admin");

    const paymentSuccessHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #16a34a; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! 🎉</h2>
          <p style="margin: 5px 0 0 0; color: #dcfce7; font-size: 14px;">Ref: ${updatedPermit.referenceNumber}</p>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
          <p>প্রিয় ${updatedPermit.firstName},</p>
          <p>আপনার পেমেন্ট যাচাই করা হয়েছে। আপনার আবেদনটি এখন Approved!</p>
          <p>ধন্যবাদ,<br>Moldova Visa Assist Team</p>
        </div>
      </div>
    `;

    sendEmail({
      to: updatedPermit.email,
      subject: `Payment Confirmed & Approved — ${updatedPermit.referenceNumber}`,
      html: paymentSuccessHtml,
    }).catch((err) => logger.error({ err }, "Failed to send confirmation email"));

    res.status(200).json({
      message: "Payment approved successfully",
      permit: updatedPermit,
    });
  } catch (error) {
    logger.error({ err: error }, "Error updating payment status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;