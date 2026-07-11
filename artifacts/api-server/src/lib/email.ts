import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

let cachedTransport: { transport: Transporter; from: string } | null | undefined;

function getTransport(): { transport: Transporter; from: string } | null {
  if (cachedTransport !== undefined) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "noreply@moldova-visa-assist.replit.app";

  if (!host || !user || !pass) {
    logger.warn("SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing) — emails will be logged to console only");
    cachedTransport = null;
    return cachedTransport;
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  cachedTransport = { transport, from };
  return cachedTransport;
}

export async function verifyEmailTransport(): Promise<boolean> {
  const config = getTransport();
  if (!config) return false;
  try {
    await config.transport.verify();
    logger.info({ host: process.env.SMTP_HOST, from: config.from }, "SMTP connection verified — email sending is live");
    return true;
  } catch (err) {
    logger.error({ err }, "SMTP verification failed — check SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS");
    return false;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const config = getTransport();

  if (!config) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email (SMTP not configured — logged only)");
    return;
  }

  try {
    const info = await config.transport.sendMail({
      from: config.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    });
    logger.info({ to: opts.to, subject: opts.subject, messageId: info.messageId }, "Email sent");
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Failed to send email");
    throw err;
  }
}

const LAYOUT_HEADER = `
  <div style="background:#1a2744;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Moldova Visa Assist</h1>
  </div>`;

const LAYOUT_FOOTER = `
    <p style="color:#6b7280;font-size:14px;margin-top:32px">Moldova Visa Assist SRL · Chisinau, Republic of Moldova</p>
  </div>
</div>`;

function wrap(body: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">
    ${LAYOUT_HEADER}
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
      ${body}
      ${LAYOUT_FOOTER}`;
}

export function applicationReceivedEmail(firstName: string, jobTitle: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Application Received</h2>
        <p>Dear ${firstName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position. We have received your application and our team will review it shortly.</p>
        <p>You will receive an email once a decision has been made. This typically takes 3–5 business days.</p>`);
}

export function applicationApprovedEmail(firstName: string, jobTitle: string, offerDetails: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Congratulations — Application Approved!</h2>
        <p>Dear ${firstName},</p>
        <p>We are delighted to inform you that your application for <strong>${jobTitle}</strong> has been <strong>approved</strong>.</p>
        <p>${offerDetails}</p>
        <p>Please find your official Job Offer Letter attached to this email. Please review it carefully and contact us if you have any questions.</p>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Review the attached offer letter</li>
          <li>Confirm your acceptance by replying to this email</li>
          <li>We will guide you through the visa and relocation process</li>
        </ol>`);
}

export function applicationRejectedEmail(firstName: string, jobTitle: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Application Update</h2>
        <p>Dear ${firstName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position. After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>We encourage you to browse our other available positions and apply again. We wish you every success in your job search.</p>`);
}

export function workPermitReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Work Permit Application Received</h2>
        <p>Dear ${firstName},</p>
        <p>Your work permit application has been received. Your reference number is:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;color:#1a2744;margin:16px 0">${refNumber}</div>
        <p>Please keep this reference number safe. Our team will review your application and contact you within 5–7 business days.</p>`);
}

export function workPermitPaymentRequestEmail(
  firstName: string,
  refNumber: string,
  paymentUrl: string,
  amount: string
): string {
  return wrap(`
        <h2 style="color:#b45309;margin-top:0">Action Required — Complete Your Payment</h2>
        <p>Dear ${firstName},</p>
        <p>Your work permit application <strong>${refNumber}</strong> has been reviewed and is ready to proceed. To continue processing, please complete the application fee payment of <strong>${amount}</strong>.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${paymentUrl}" style="background:#1a2744;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;display:inline-block">Pay Now</a>
        </div>
        <p>If the button above does not work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;color:#2563eb">${paymentUrl}</p>
        <p>Once payment is confirmed, our team will proceed with reviewing your work permit application.</p>`);
}

export function workPermitPaymentConfirmedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Confirmed</h2>
        <p>Dear ${firstName},</p>
        <p>Your payment for work permit application <strong>${refNumber}</strong> has been successfully processed.</p>
        <p>Your application is now under review by our team. You will receive an update within 5–7 business days.</p>`);
}

export function workPermitApprovedEmail(firstName: string, refNumber: string, validUntil: Date, notes?: string): string {
  const validStr = validUntil.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Work Permit Approved!</h2>
        <p>Dear ${firstName},</p>
        <p>We are delighted to inform you that your work permit application <strong>${refNumber}</strong> has been <strong>approved</strong> by the General Inspectorate for Migration of the Republic of Moldova.</p>
        <p>Your permit is valid until <strong>${validStr}</strong>.</p>
        <p>Please find your official decision document (<em>Decizie</em>) attached to this email. Keep it in a safe place — you will need it when entering and working in Moldova.</p>
        ${notes ? `<p><strong>Note from our team:</strong> ${notes}</p>` : ""}
        <p>If you have any questions, please reply to this email or contact our support team.</p>
        <p style="color:#6b7280;font-size:13px">This document is issued under Law no. 200 of 16.07.2010 on the regime of foreigners in the Republic of Moldova.</p>`);
}

export function workPermitRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Work Permit Application Update</h2>
        <p>Dear ${firstName},</p>
        <p>After careful review, we regret to inform you that we are unable to proceed with your work permit application <strong>${refNumber}</strong> at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>If you believe this is in error or would like more information, please contact our support team.</p>`);
}

export function workPermitReceiptReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Payment Receipt Received</h2>
        <p>Dear ${firstName},</p>
        <p>We've received your payment receipt for work permit application <strong>${refNumber}</strong>. Our team will verify it and confirm your payment status shortly.</p>
        <p>You'll receive an email once your payment has been reviewed. This usually takes 1–2 business days.</p>`);
}

export function workPermitPaymentApprovedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Approved</h2>
        <p>Dear ${firstName},</p>
        <p>Great news — we've verified your payment receipt for work permit application <strong>${refNumber}</strong> and confirmed your payment.</p>
        <p>Your application is now under full review by our team. You will receive an update within 5–7 business days.</p>`);
}

export function workPermitPaymentRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Payment Receipt Could Not Be Verified</h2>
        <p>Dear ${firstName},</p>
        <p>We were unable to verify the payment receipt you submitted for work permit application <strong>${refNumber}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Please log in to your dashboard and upload a valid receipt, or contact our support team for assistance.</p>`);
}

export function newPaymentReceiptAdminNotificationEmail(
  applicantName: string,
  refNumber: string,
  method: string
): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">New Payment Receipt Uploaded</h2>
        <p><strong>Applicant:</strong> ${applicantName}</p>
        <p><strong>Reference:</strong> ${refNumber}</p>
        <p><strong>Payment method:</strong> ${method}</p>
        <p>Please review the uploaded receipt in the Admin Panel and mark the payment as Approved or Rejected.</p>`);
}

export function contactConfirmationEmail(name: string, message: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">We've Received Your Message</h2>
        <p>Dear ${name},</p>
        <p>Thank you for contacting Moldova Visa Assist. Our team has received your message and will respond within 1–2 business days.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151;font-style:italic">"${message}"</div>
        <p>If your inquiry is urgent, please call us directly.</p>`);
}

export function contactAdminNotificationEmail(
  name: string,
  email: string,
  phone: string | undefined,
  subject: string,
  message: string
): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151">${message}</div>`);
}
