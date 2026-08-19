import nodemailer, { type Transporter } from "nodemailer";
import dns from "node:dns";
import { setDefaultResultOrder } from "node:dns";
import { logger } from "./logger";

// Brevo/Resend use HTTPS and do not depend on Render SMTP egress.
// SMTP remains only as a legacy fallback.
setDefaultResultOrder("ipv4first");
const SMTP_FAMILY = 4;
const ipv4Lookup = ((hostname: string, _options: unknown, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
  dns.lookup(hostname, { family: SMTP_FAMILY }, callback);
}) as any;

type EmailMode = "brevo" | "resend" | "smtp" | "smtp-465" | "gmail" | "gmail-465";
type EmailConfig = { transport?: Transporter; from: string; mode: EmailMode };

let cachedTransport: EmailConfig | null | undefined;

function getBrevoFrom(): string | null {
  const from = process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM;
  return from || null;
}

function createBrevoTransport(): EmailConfig | null {
  const apiKey = process.env.BREVO_API_KEY;
  const from = getBrevoFrom();
  if (!apiKey || !from) return null;
  return { from, mode: "brevo" };
}

function createResendTransport(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { from, mode: "resend" };
}

function createSmtpTransport(portOverride?: number): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const configuredPort = Number(process.env.SMTP_PORT) || 587;
  const port = portOverride ?? configuredPort;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const transport = nodemailer.createTransport({
    host, port, secure: port === 465, family: SMTP_FAMILY, lookup: ipv4Lookup,
    auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  } as any);
  return { transport, from: process.env.EMAIL_FROM || user, mode: port === 465 ? "smtp-465" : "smtp" };
}

function createGmailTransport(portOverride?: number): EmailConfig | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  const port = portOverride ?? 587;
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com", port, secure: port === 465, family: SMTP_FAMILY, lookup: ipv4Lookup,
    auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  } as any);
  return { transport, from: `"Moldova Visa Assist" <${user}>`, mode: port === 465 ? "gmail-465" : "gmail" };
}

function getTransport(): EmailConfig | null {
  if (cachedTransport !== undefined) return cachedTransport;
  // Brevo is deliberately first: HTTPS avoids Render SMTP egress problems.
  cachedTransport = createBrevoTransport() ?? createResendTransport() ?? createSmtpTransport() ?? createGmailTransport();
  if (!cachedTransport) logger.warn("Email not configured — emails will be logged only");
  return cachedTransport;
}

function getFallbacks(current: EmailConfig): EmailConfig[] {
  const fallbacks: EmailConfig[] = [];
  if (current.mode === "brevo" || current.mode === "resend") return fallbacks;
  if (current.mode === "smtp") {
    const alternate = createSmtpTransport(465);
    if (alternate) fallbacks.push(alternate);
  }
  if (current.mode !== "gmail-465") {
    const gmail465 = createGmailTransport(465);
    if (gmail465) fallbacks.push(gmail465);
  }
  if (current.mode !== "gmail") {
    const gmail587 = createGmailTransport(587);
    if (gmail587) fallbacks.push(gmail587);
  }
  return fallbacks;
}

async function verifyBrevo(): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = getBrevoFrom();
  if (!apiKey || !from) return false;
  try {
    const response = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text.slice(0, 500) }, "Brevo API verification failed");
      return false;
    }
    logger.info({ from, mode: "brevo" }, "Brevo API verified — email sending is live");
    return true;
  } catch (err) {
    logger.error({ err }, "Brevo API connection failed");
    return false;
  }
}

async function verifyResend(): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  try {
    const response = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return false;
    logger.info({ from: process.env.RESEND_FROM || process.env.EMAIL_FROM, mode: "resend" }, "Resend API verified");
    return true;
  } catch (err) {
    logger.error({ err }, "Resend API connection failed");
    return false;
  }
}

async function tryVerify(config: EmailConfig): Promise<boolean> {
  if (config.mode === "brevo") return verifyBrevo();
  if (config.mode === "resend") return verifyResend();
  try {
    await config.transport!.verify();
    cachedTransport = config;
    logger.info({ from: config.from, mode: config.mode }, "Email transport verified — email sending is live");
    return true;
  } catch (err) {
    logger.error({ err, mode: config.mode }, "Email transport verification failed");
    return false;
  }
}

export async function verifyEmailTransport(): Promise<boolean> {
  const config = getTransport();
  if (!config) return false;
  if (await tryVerify(config)) return true;
  for (const fallback of getFallbacks(config)) if (await tryVerify(fallback)) return true;
  return false;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}

async function sendWithBrevo(opts: EmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = getBrevoFrom();
  if (!apiKey || !from) return false;
  try {
    const senderName = process.env.BREVO_FROM_NAME || "Moldova Visa Assist";
    const body: Record<string, unknown> = {
      sender: { name: senderName, email: from },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
    };
    if (opts.attachments?.length) {
      body.attachment = opts.attachments.map((a) => ({
        name: a.filename,
        content: a.content.toString("base64"),
      }));
    }
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.error({ status: response.status, response: result, to: opts.to, subject: opts.subject }, "Brevo email failed");
      return false;
    }
    cachedTransport = { from, mode: "brevo" };
    logger.info({ to: opts.to, subject: opts.subject, messageId: (result as any)?.messageId, mode: "brevo" }, "Email sent through Brevo");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Brevo request failed");
    return false;
  }
}

async function sendWithResend(opts: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;
  try {
    const body: Record<string, unknown> = { from, to: [opts.to], subject: opts.subject, html: opts.html };
    if (opts.attachments?.length) body.attachments = opts.attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") }));
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return false;
    cachedTransport = { from, mode: "resend" };
    logger.info({ to: opts.to, subject: opts.subject, messageId: (result as any)?.id, mode: "resend" }, "Email sent through Resend");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Resend request failed");
    return false;
  }
}

async function sendWithTransport(config: EmailConfig, opts: EmailOptions): Promise<boolean> {
  if (config.mode === "brevo") return sendWithBrevo(opts);
  if (config.mode === "resend") return sendWithResend(opts);
  try {
    const info = await config.transport!.sendMail({ from: config.from, to: opts.to, subject: opts.subject, html: opts.html, attachments: opts.attachments });
    cachedTransport = config;
    logger.info({ to: opts.to, subject: opts.subject, messageId: info.messageId, mode: config.mode }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject, mode: config.mode }, "Email transport failed");
    return false;
  }
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const config = getTransport();
  if (!config) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email (transport not configured — logged only)");
    return;
  }
  if (await sendWithTransport(config, opts)) return;
  for (const fallback of getFallbacks(config)) {
    if (await sendWithTransport(fallback, opts)) return;
  }
  throw new Error(`Unable to send email to ${opts.to}`);
}

const LAYOUT_HEADER = `<div style="background:#1a2744;padding:20px 24px;border-radius:8px 8px 0 0"><h1 style="color:#fff;margin:0;font-size:22px">Moldova Visa Assist</h1></div>`;
const LAYOUT_FOOTER = `<p style="color:#6b7280;font-size:14px;margin-top:32px">Cu stimă / Best regards,<br>Moldova Visa Assist Team · Chisinau, Republic of Moldova</p></div></div>`;
function wrap(body: string): string { return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px">${LAYOUT_HEADER}<div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">${body}${LAYOUT_FOOTER}`; }

export function applicationReceivedEmail(firstName: string, jobTitle: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">Application Received / Cererea a fost primită</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Thank you for applying for the <strong>${jobTitle}</strong> position. We have received your application.</p>`); }
export function applicationApprovedEmail(firstName: string, jobTitle: string, offerDetails: string): string { return wrap(`<h2 style="color:#16a34a;margin-top:0">🎉 Congratulations — Application Approved / Candidatură aprobată!</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Your application for <strong>${jobTitle}</strong> has been approved.</p><p>${offerDetails}</p><p>Please find your official Job Offer Letter attached.</p>`); }
export function applicationRejectedEmail(firstName: string, jobTitle: string, reason?: string): string { return wrap(`<h2 style="color:#dc2626;margin-top:0">Application Update / Actualizare privind candidatura</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Thank you for your interest in the <strong>${jobTitle}</strong> position.</p>${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`); }
export function workPermitReceivedEmail(firstName: string, refNumber: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">Work Permit Application Received / Cererea pentru permis a fost primită</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Your work permit application has been received. Your reference number is:</p><div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;color:#1a2744;margin:16px 0">${refNumber}</div>`); }
export function workPermitPaymentRequestEmail(firstName: string, refNumber: string, paymentUrl: string, amount: string): string { return wrap(`<h2 style="color:#b45309;margin-top:0">Action Required — Complete Your Payment / Este necesară plata</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Application <strong>${refNumber}</strong> requires payment of <strong>${amount}</strong>.</p><p><a href="${paymentUrl}">Pay Now / Plătește acum</a></p>`); }
export function workPermitPaymentConfirmedEmail(firstName: string, refNumber: string): string { return wrap(`<h2 style="color:#16a34a;margin-top:0">✅ Payment Confirmed / Plata a fost confirmată</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Payment for <strong>${refNumber}</strong> was successfully processed.</p>`); }
export function workPermitApprovedEmail(firstName: string, refNumber: string, validUntil: Date, notes?: string): string { const validStr = validUntil.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }); return wrap(`<h2 style="color:#16a34a;margin-top:0">🎉 Work Permit Approved / Permisul de muncă a fost aprobat!</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName},</p><p>Application <strong>${refNumber}</strong> has been approved.</p><p>Valid until <strong>${validStr}</strong>.</p>${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ""}`); }
export function workPermitRejectedEmail(firstName: string, refNumber: string, reason?: string): string { return wrap(`<h2 style="color:#dc2626;margin-top:0">Work Permit Application Update / Actualizare permis de muncă</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName}</p><p>Application <strong>${refNumber}</strong> cannot proceed at this time.</p>${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`); }
export function workPermitReceiptReceivedEmail(firstName: string, refNumber: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">Payment Receipt Received / Dovada plății a fost primită</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName}</p><p>Receipt for <strong>${refNumber}</strong> was received.</p>`); }
export function workPermitPaymentApprovedEmail(firstName: string, refNumber: string): string { return wrap(`<h2 style="color:#16a34a;margin-top:0">✅ Payment Approved / Plata a fost aprobată</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName}</p><p>Payment for <strong>${refNumber}</strong> was verified.</p>`); }
export function workPermitPaymentRejectedEmail(firstName: string, refNumber: string, reason?: string): string { return wrap(`<h2 style="color:#dc2626;margin-top:0">Payment Receipt Could Not Be Verified / Dovada plății nu a putut fi verificată</h2><p>Dear ${firstName}, / Stimate(ă) ${firstName}</p><p>Receipt for <strong>${refNumber}</strong> could not be verified.</p>${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}`); }
export function newPaymentReceiptAdminNotificationEmail(applicantName: string, refNumber: string, method: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">New Payment Receipt Uploaded</h2><p><strong>Applicant:</strong> ${applicantName}</p><p><strong>Reference:</strong> ${refNumber}</p><p><strong>Payment method:</strong> ${method}</p><p>Please review the uploaded receipt in the Admin Panel.</p>`); }
export function contactConfirmationEmail(name: string, message: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">We've Received Your Message / Am primit mesajul dumneavoastră</h2><p>Dear ${name}, / Stimate(ă) ${name},</p><p>Thank you for contacting Moldova Visa Assist.</p><div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151;font-style:italic">"${message}"</div>`); }
export function contactAdminNotificationEmail(name: string, email: string, phone: string | undefined, subject: string, message: string): string { return wrap(`<h2 style="color:#1a2744;margin-top:0">New Contact Form Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}<p><strong>Subject:</strong> ${subject}</p><div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151">${message}</div>`); }
