import nodemailer, { type Transporter } from "nodemailer";
import { setDefaultResultOrder } from "node:dns";
import { logger } from "./logger";

// Render instances can prefer IPv6 while the outbound network path to Gmail
// is not reachable over IPv6. Prefer IPv4 globally and explicitly tell
// Nodemailer to use IPv4 for SMTP connections.
setDefaultResultOrder("ipv4first");

const SMTP_FAMILY = 4;

type EmailMode = "smtp" | "gmail";
type EmailConfig = { transport: Transporter; from: string; mode: EmailMode };

let cachedTransport: EmailConfig | null | undefined;

function createSmtpTransport(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    family: SMTP_FAMILY,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return {
    transport,
    from: process.env.EMAIL_FROM || user,
    mode: "smtp",
  };
}

function createGmailTransport(): EmailConfig | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) return null;

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: SMTP_FAMILY,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  return {
    transport,
    from: `"Moldova Visa Assist" <${user}>`,
    mode: "gmail",
  };
}

function getTransport(): EmailConfig | null {
  if (cachedTransport !== undefined) return cachedTransport;

  // Keep the existing Render SMTP configuration as the primary transport.
  // If it cannot connect, sendEmail() will automatically try Gmail.
  cachedTransport = createSmtpTransport() ?? createGmailTransport();

  if (!cachedTransport) {
    logger.warn("Email not configured — emails will be logged only");
  }

  return cachedTransport;
}

function getGmailFallback(current: EmailConfig): EmailConfig | null {
  if (current.mode === "gmail") return null;

  const gmail = createGmailTransport();
  if (!gmail) return null;

  // Avoid retrying the exact same Gmail SMTP account twice.
  const smtpUser = process.env.SMTP_USER;
  const gmailUser = process.env.GMAIL_USER;
  if (
    current.mode === "smtp" &&
    process.env.SMTP_HOST === "smtp.gmail.com" &&
    smtpUser &&
    gmailUser &&
    smtpUser.toLowerCase() === gmailUser.toLowerCase()
  ) {
    return null;
  }

  return gmail;
}

export async function verifyEmailTransport(): Promise<boolean> {
  const config = getTransport();
  if (!config) return false;

  try {
    await config.transport.verify();
    logger.info({ from: config.from, mode: config.mode }, "Email transport verified — email sending is live");
    return true;
  } catch (err) {
    logger.error({ err, mode: config.mode }, "Email transport verification failed");

    const fallback = getGmailFallback(config);
    if (!fallback) return false;

    try {
      await fallback.transport.verify();
      cachedTransport = fallback;
      logger.info({ from: fallback.from, mode: fallback.mode }, "Gmail fallback verified — email sending is live");
      return true;
    } catch (fallbackErr) {
      logger.error({ err: fallbackErr, mode: fallback.mode }, "Gmail fallback verification failed");
      return false;
    }
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  let config = getTransport();

  if (!config) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email (transport not configured — logged only)");
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
    logger.info({ to: opts.to, subject: opts.subject, messageId: info.messageId, mode: config.mode }, "Email sent");
    return;
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject, mode: config.mode }, "Primary email transport failed");
  }

  // If the configured SMTP server is unreachable, automatically retry through
  // the separate Gmail credentials when available.
  const fallback = getGmailFallback(config);
  if (fallback) {
    try {
      const info = await fallback.transport.sendMail({
        from: fallback.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        attachments: opts.attachments,
      });
      cachedTransport = fallback;
      logger.info({ to: opts.to, subject: opts.subject, messageId: info.messageId, mode: fallback.mode }, "Email sent through Gmail fallback");
      return;
    } catch (fallbackErr) {
      logger.error({ err: fallbackErr, to: opts.to, subject: opts.subject, mode: fallback.mode }, "Gmail fallback email failed");
    }
  }

  throw new Error(`Unable to send email to ${opts.to}`);
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
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Application Received / Cererea a fost primită</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position. We have received your application.</p>`);
}

export function applicationApprovedEmail(firstName: string, jobTitle: string, offerDetails: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Congratulations — Application Approved / Candidatură aprobată!</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Your application for <strong>${jobTitle}</strong> has been approved.</p>
        <p>${offerDetails}</p>
        <p>Please find your official Job Offer Letter attached.</p>`);
}

export function applicationRejectedEmail(firstName: string, jobTitle: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Application Update / Actualizare privind candidatura</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`);
}

export function workPermitReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Work Permit Application Received / Cererea pentru permis a fost primită</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Your work permit application has been received. Your reference number is:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;color:#1a2744;margin:16px 0">${refNumber}</div>`);
}

export function workPermitPaymentRequestEmail(firstName: string, refNumber: string, paymentUrl: string, amount: string): string {
  return wrap(`
        <h2 style="color:#b45309;margin-top:0">Action Required — Complete Your Payment / Este necesară plata</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Application <strong>${refNumber}</strong> requires payment of <strong>${amount}</strong>.</p>
        <p><a href="${paymentUrl}">Pay Now / Plătește acum</a></p>`);
}

export function workPermitPaymentConfirmedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Confirmed / Plata a fost confirmată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Payment for <strong>${refNumber}</strong> was successfully processed.</p>`);
}

export function workPermitApprovedEmail(firstName: string, refNumber: string, validUntil: Date, notes?: string): string {
  const validStr = validUntil.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Work Permit Approved / Permisul de muncă a fost aprobat!</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Application <strong>${refNumber}</strong> has been approved.</p>
        <p>Valid until <strong>${validStr}</strong>.</p>
        ${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ""}`);
}

export function workPermitRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Work Permit Application Update / Actualizare permis de muncă</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Application <strong>${refNumber}</strong> cannot proceed at this time.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`);
}

export function workPermitReceiptReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Payment Receipt Received / Dovada plății a fost primită</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Receipt for <strong>${refNumber}</strong> was received.</p>`);
}

export function workPermitPaymentApprovedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Approved / Plata a fost aprobată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Payment for <strong>${refNumber}</strong> was verified.</p>`);
}

export function workPermitPaymentRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Payment Receipt Could Not Be Verified / Dovada plății nu a putut fi verificată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Receipt for <strong>${refNumber}</strong> could not be verified.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`);
}

export function newPaymentReceiptAdminNotificationEmail(applicantName: string, refNumber: string, method: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">New Payment Receipt Uploaded</h2>
        <p><strong>Applicant:</strong> ${applicantName}</p>
        <p><strong>Reference:</strong> ${refNumber}</p>
        <p><strong>Payment method:</strong> ${method}</p>
        <p>Please review the uploaded receipt in the Admin Panel.</p>`);
}

export function contactConfirmationEmail(name: string, message: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">We've Received Your Message / Am primit mesajul dumneavoastră</h2>
        <p>Dear ${name}, / Stimate(ă) ${name},</p>
        <p>Thank you for contacting Moldova Visa Assist.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151;font-style:italic">"${message}"</div>`);
}

export function contactAdminNotificationEmail(name: string, email: string, phone: string | undefined, subject: string, message: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151">${message}</div>`);
}
