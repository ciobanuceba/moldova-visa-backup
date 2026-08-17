import nodemailer from "nodemailer";
import { logger } from "./logger";

let cachedTransporter: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter !== undefined) {
    return cachedTransporter as any;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    logger.warn("GMAIL_USER or GMAIL_PASS missing — emails will be logged only");
    cachedTransporter = null;
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: { user, pass },
  } as any);

  return cachedTransporter;
}

export async function verifyEmailTransport(): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.verify();
    logger.info({ from: process.env.GMAIL_USER }, "Gmail is configured — email sending is live");
    return true;
  } catch (e) {
    logger.error({ e }, "Gmail verify failed");
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
  const transporter = getTransporter();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

  if (!transporter) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email (Gmail not configured — logged only)");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Moldova Visa Assist" <${process.env.GMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent via Gmail to user");

    if (adminEmail && adminEmail.toLowerCase() !== opts.to.toLowerCase()) {
      await transporter.sendMail({
        from: `"Moldova Visa Assist" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `[COPY to ${opts.to}] ${opts.subject}`,
        html: `<p style="background:#fef3c7;padding:10px;border-radius:4px"><b>Original sent to:</b> ${opts.to}</p><hr/>${opts.html}`,
        attachments: opts.attachments,
      });
      logger.info({ to: adminEmail }, "Copy sent to admin");
    }

  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Failed to send email via Gmail");
    throw err;
  }
}

const LAYOUT_HEADER = `
  <div style="background:#1a2744;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Moldova Visa Assist</h1>
  </div>`;

const LAYOUT_FOOTER = `
    <p style="color:#6b7280;font-size:14px;margin-top:32px">Cu stimă / Best regards,<br>Moldova Visa Assist Team · Chisinau, Republic of Moldova</p>
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
  return wrap(`<h2 style="color:#1a2744;margin-top:0">Application Received / Cererea a fost primită</h2><p>Dear ${firstName},</p><p>Thank you for applying for the <strong>${jobTitle}</strong> position.</p>`);
}
export function applicationApprovedEmail(firstName: string, jobTitle: string, offerDetails: string): string {
  return wrap(`<h2 style="color:#16a34a;margin-top:0">🎉 Congratulations — Application Approved!</h2><p>Dear ${firstName},</p><p>Your application for <strong>${jobTitle}</strong> has been <strong>approved</strong>.</p><p>${offerDetails}</p>`);
}
export function applicationRejectedEmail(firstName: string, jobTitle: string, reason?: string): string {
  return wrap(`<h2 style="color:#dc2626;margin-top:0">Application Update</h2><p>Dear ${firstName},</p><p>Thank you for your interest in <strong>${jobTitle}</strong>.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}`);
}
export function workPermitReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`<h2>Work Permit Received</h2><p>Dear ${firstName},</p><div style="background:#f3f4f6;padding:16px;text-align:center;font-size:20px;font-weight:bold">${refNumber}</div>`);
}
export function workPermitPaymentRequestEmail(firstName: string, refNumber: string, paymentUrl: string, amount: string): string {
  return wrap(`<h2>Action Required — Payment</h2><p>Dear ${firstName},</p><p>Application <strong>${refNumber}</strong> - Amount <strong>${amount}</strong></p><a href="${paymentUrl}">Pay Now</a>`);
}
export function workPermitPaymentConfirmedEmail(firstName: string, refNumber: string): string {
  return wrap(`<h2>✅ Payment Confirmed</h2><p>Dear ${firstName},</p><p>Payment for ${refNumber} confirmed.</p>`);
}
export function workPermitApprovedEmail(firstName: string, refNumber: string, validUntil: Date, notes?: string): string {
  return wrap(`<h2>🎉 Work Permit Approved</h2><p>Dear ${firstName},</p><p>Permit ${refNumber} approved until ${validUntil.toDateString()}</p>${notes ? `<p>${notes}</p>` : ""}`);
}
export function workPermitRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`<h2>Work Permit Rejected</h2><p>Dear ${firstName},</p><p>Application ${refNumber} rejected.</p>${reason ? `<p>${reason}</p>` : ""}`);
}
export function workPermitReceiptReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`<h2>Receipt Received</h2><p>Dear ${firstName},</p><p>Receipt for ${refNumber} received.</p>`);
}
export function workPermitPaymentApprovedEmail(firstName: string, refNumber: string): string {
  return wrap(`<h2>✅ Payment Approved</h2><p>Dear ${firstName},</p><p>Payment for ${refNumber} approved.</p>`);
}
export function workPermitPaymentRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`<h2>Payment Not Verified</h2><p>Dear ${firstName},</p><p>Receipt for ${refNumber} not verified.</p>${reason ? `<p>${reason}</p>` : ""}`);
}
export function newPaymentReceiptAdminNotificationEmail(applicantName: string, refNumber: string, method: string): string {
  return wrap(`<h2>New Payment Receipt</h2><p>${applicantName} - ${refNumber} - ${method}</p>`);
}
export function contactConfirmationEmail(name: string, message: string): string {
  return wrap(`<h2>Message Received</h2><p>Dear ${name},</p><div>${message}</div>`);
}
export function contactAdminNotificationEmail(name: string, email: string, phone: string | undefined, subject: string, message: string): string {
  return wrap(`<h2>New Contact</h2><p>${name} - ${email} - ${subject}</p><div>${message}</div>`);
}