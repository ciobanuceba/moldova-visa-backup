import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, workPermitsTable } from "@workspace/db";
import { sendEmail, workPermitReceivedEmail } from "../lib/email";
import { logger } from "../lib/logger";
import { eq } from "drizzle-orm"; // পেমেন্ট আপডেট করার জন্য এটি প্রয়োজন

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
    logger.error({ email: body.email }, "Invalid email format in work permit");
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
        status:           "pending_payment", // এখানে স্ট্যাটাস pending_payment সেট করা হলো
      })
      .returning();

    permit = insertedPermit;
    logger.info({ permitId: permit.id, referenceNumber }, "Work permit draft saved with pending_payment status");
  } catch (dbError) {
    logger.error({ err: dbError }, "Database insertion failed for Work Permit!");
    res.status(500).json({ error: "Database save failed. Please check server logs." });
    return;
  }

  // ১. ইউজারকে পেমেন্ট করার নির্দেশনাসহ প্রথম মেইল পাঠানো (ধাপ ১)
  const paymentInstructionHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #f59e0b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">আবেদন গ্রহণ করা হয়েছে (পেমেন্ট বাকি)</h2>
        <p style="margin: 5px 0 0 0; color: #fef3c7; font-size: 14px;">Ref: ${referenceNumber}</p>
      </div>
      <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
        <p>প্রিয় ${permit.firstName},</p>
        <p>আপনার ওয়ার্ক পারমিট আবেদনটি আমরা সফলভাবে পেয়েছি। আপনার আবেদনটি ভেরিফিকেশন ও পরবর্তী প্রসেসিংয়ে পাঠানোর জন্য অনুগ্রহ করে নির্ধারিত ফি প্রদান সম্পন্ন করুন।</p>
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>পেমেন্ট করার নিয়ম:</strong> আমাদের দেওয়া পেমেন্ট মাধ্যমে আপনার ফি জমা দিন। পেমেন্ট সম্পন্ন করে আমাদের কনফার্ম করার পর আপনার ফাইলটি সরাসরি রিভিউতে চলে যাবে।
        </div>
        <p>ধন্যবাদ,<br>Moldova Visa Assist Team</p>
      </div>
    </div>
  `;

  sendEmail({
    to: permit.email,
    subject: `Application Received (Payment Pending) — ${referenceNumber}`,
    html: paymentInstructionHtml,
  })
    .then(() => logger.info({ to: permit.email }, "User pending payment notification email sent"))
    .catch((err) => logger.error({ err }, "Failed to send payment pending email"));

  // ২. অ্যাডমিনকে নোটিফিকেশন মেইল পাঠানো
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #0f172a; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">🚨 New Application (Pending Payment)</h2>
          <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Ref: ${referenceNumber}</p>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
          <p>Hi Admin,</p>
          <p>A new application is waiting for payment. Once you receive the manual payment, accept it from the Admin Dashboard.</p>
          <p><strong>Applicant:</strong> ${permit.firstName} ${permit.lastName}</p>
        </div>
      </div>
    `;

    sendEmail({
      to: adminEmail,
      subject: `[Pending Payment] Application: ${permit.firstName} [${referenceNumber}]`,
      html: adminHtml,
    }).catch((err) => logger.error({ err }, "Failed to send admin notification"));
  }

  res.status(201).json({
    id:              permit.id,
    referenceNumber: permit.referenceNumber,
    status:          permit.status,
    createdAt:       permit.createdAt?.toISOString() || new Date().toISOString(),
    firstName:       permit.firstName,
    lastName:        permit.lastName,
    email:           permit.email,
  });
});

// ======================================================
// ধাপ ২ ও ৩: অ্যাডমিন কর্তৃক পেমেন্ট অ্যাকসেপ্ট ও অটো-মেইল রাউট
// ======================================================
router.patch("/work-permits/:id/approve-payment", async (req, res): Promise<void> => {
  const { id } = req.params;

  try {
    // ইউজারের স্ট্যাটাস আপডেট করে "submitted" (বা Paid) করা হচ্ছে
    const [updatedPermit] = await db
      .update(workPermitsTable)
      .set({ status: "submitted" })
      .where(eq(workPermitsTable.id, parseInt(id)))
      .returning();

    if (!updatedPermit) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    logger.info({ id }, "Application marked as paid/submitted by admin");

    // পেমেন্ট সফল হওয়ার অটোমেটিক দ্বিতীয় মেইল পাঠানো (ধাপ ৩)
    const paymentSuccessHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #16a34a; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! 🎉</h2>
          <p style="margin: 5px 0 0 0; color: #dcfce7; font-size: 14px;">Ref: ${updatedPermit.referenceNumber}</p>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #374151; line-height: 1.6;">
          <p>প্রিয় ${updatedPermit.firstName},</p>
          <p>আপনার আবেদনের বিপরীতে পেমেন্টটি আমরা সফলভাবে যাচাই এবং গ্রহণ করেছি।</p>
          <p>আপনার আবেদনটি বর্তমানে আমাদের ইমিগ্রেশন বিশেষজ্ঞদের দ্বারা রিভিউ করা হচ্ছে। পরবর্তী যেকোনো আপডেটের জন্য আমরা আপনার সাথে যোগাযোগ করব।</p>
          <p>ধন্যবাদ,<br>Moldova Visa Assist Team</p>
        </div>
      </div>
    `;

    sendEmail({
      to: updatedPermit.email,
      subject: `Payment Confirmed & Under Review — ${updatedPermit.referenceNumber}`,
      html: paymentSuccessHtml,
    }).catch((err) => logger.error({ err }, "Failed to send payment confirmation email"));

    res.status(200).json({ 
      message: "Payment approved successfully, confirmation email sent", 
      permit: updatedPermit 
    });
  } catch (error) {
    logger.error({ err: error }, "Error updating payment status");
    res.status(500).json({ error: "Internal server error" });
  }
});



export default router;