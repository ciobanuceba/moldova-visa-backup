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
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position. Vă mulțumim pentru candidatura dumneavoastră — we have received your application and our team will review it shortly.</p>
        <p>You will receive an email once a decision has been made. Veți primi un email după luarea deciziei, de obicei în 3–5 business days / zile lucrătoare.</p>`);
}

export function applicationApprovedEmail(firstName: string, jobTitle: string, offerDetails: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Congratulations — Application Approved / Candidatură aprobată!</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>We are delighted to inform you that your application for <strong>${jobTitle}</strong> has been <strong>approved</strong>. Suntem bucuroși să vă informăm că cererea dumneavoastră a fost aprobată.</p>
        <p>${offerDetails}</p>
        <p>Please find your official Job Offer Letter attached. Vă rugăm să verificați documentul și să ne contactați dacă aveți întrebări.</p>
        <p><strong>Next Steps / Pașii următori:</strong></p>
        <ol>
          <li>Review the attached offer letter / Verificați scrisoarea de ofertă</li>
          <li>Confirm your acceptance by replying to this email / Confirmați acceptarea prin reply la acest email</li>
          <li>We will guide you through the visa and relocation process / Vă vom ghida în procesul de viză și relocare</li>
        </ol>`);
}

export function applicationRejectedEmail(firstName: string, jobTitle: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Application Update / Actualizare privind candidatura</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Thank you for your interest in the <strong>${jobTitle}</strong> position. Vă mulțumim pentru interes, însă după o analiză atentă nu putem continua candidatura dumneavoastră în acest moment.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}
        <p>We encourage you to browse our other available positions and apply again. Vă încurajăm să consultați alte poziții disponibile. We wish you every success / Vă dorim mult succes în căutarea unui loc de muncă.</p>`);
}

export function workPermitReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Work Permit Application Received / Cererea pentru permis a fost primită</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Your work permit application has been received. Cererea dumneavoastră pentru permis de muncă a fost înregistrată. Your reference number is:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;color:#1a2744;margin:16px 0">${refNumber}</div>
        <p>Please keep this reference number safe. Vă rugăm să păstrați acest număr. Our team will contact you within 5–7 business days / zile lucrătoare.</p>`);
}

export function workPermitPaymentRequestEmail(
  firstName: string,
  refNumber: string,
  paymentUrl: string,
  amount: string
): string {
  return wrap(`
        <h2 style="color:#b45309;margin-top:0">Action Required — Complete Your Payment / Este necesară plata</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Your work permit application <strong>${refNumber}</strong> has been reviewed and is ready to proceed. Cererea dumneavoastră este pregătită pentru următorul pas. Please complete the application fee payment of <strong>${amount}</strong>.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${paymentUrl}" style="background:#1a2744;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;display:inline-block">Pay Now / Plătește acum</a>
        </div>
        <p>If the button above does not work, copy and paste this link into your browser. Dacă butonul nu funcționează, copiați linkul:</p>
        <p style="word-break:break-all;color:#2563eb">${paymentUrl}</p>
        <p>Once payment is confirmed, our team will proceed with reviewing your work permit application. După confirmarea plății, echipa noastră va continua verificarea dosarului.</p>`);
}

export function workPermitPaymentConfirmedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Confirmed / Plata a fost confirmată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Your payment for work permit application <strong>${refNumber}</strong> has been successfully processed. Plata pentru cererea dumneavoastră a fost procesată cu succes.</p>
        <p>Your application is now under review by our team. Dosarul este acum în proces de verificare. You will receive an update within 5–7 business days.</p>`);
}

export function workPermitApprovedEmail(firstName: string, refNumber: string, validUntil: Date, notes?: string): string {
  const validStr = validUntil.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">🎉 Work Permit Approved / Permisul de muncă a fost aprobat!</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>We are delighted to inform you that your work permit application <strong>${refNumber}</strong> has been <strong>approved</strong> by the General Inspectorate for Migration of the Republic of Moldova. Suntem bucuroși să vă informăm că cererea a fost aprobată.</p>
        <p>Your permit is valid until <strong>${validStr}</strong>. Permisul este valabil până la această dată.</p>
        <p>Please find your official decision document (<em>Decizie</em>) attached. Vă rugăm să păstrați documentul într-un loc sigur — veți avea nevoie de el pentru intrarea și munca în Moldova.</p>
        ${notes ? `<p><strong>Note from our team / Notă:</strong> ${notes}</p>` : ""}
        <p>If you have any questions, please reply to this email or contact our support team. Dacă aveți întrebări, vă rugăm să ne scrieți.</p>
        <p style="color:#6b7280;font-size:13px">This document is issued under Law no. 200 of 16.07.2010 on the regime of foreigners in the Republic of Moldova.</p>`);
}

export function workPermitRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Work Permit Application Update / Actualizare permis de muncă</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>After careful review, we regret to inform you that we are unable to proceed with your work permit application <strong>${refNumber}</strong> at this time. După verificare, nu putem continua dosarul în acest moment.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}
        <p>If you believe this is in error or would like more information, please contact our support team. Dacă aveți nevoie de clarificări, vă rugăm să ne contactați.</p>`);
}

export function workPermitReceiptReceivedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#1a2744;margin-top:0">Payment Receipt Received / Dovada plății a fost primită</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>We've received your payment receipt for work permit application <strong>${refNumber}</strong>. Am primit dovada plății, iar echipa noastră o va verifica în curând.</p>
        <p>You'll receive an email once your payment has been reviewed. Veți primi un email după verificare, de obicei în 1–2 business days / zile lucrătoare.</p>`);
}

export function workPermitPaymentApprovedEmail(firstName: string, refNumber: string): string {
  return wrap(`
        <h2 style="color:#16a34a;margin-top:0">✅ Payment Approved / Plata a fost aprobată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>Great news — we've verified your payment receipt for work permit application <strong>${refNumber}</strong> and confirmed your payment. Vă informăm că plata a fost verificată și confirmată.</p>
        <p>Your application is now under full review by our team. Dosarul este acum în verificare completă. You will receive an update within 5–7 business days.</p>`);
}

export function workPermitPaymentRejectedEmail(firstName: string, refNumber: string, reason?: string): string {
  return wrap(`
        <h2 style="color:#dc2626;margin-top:0">Payment Receipt Could Not Be Verified / Dovada plății nu a putut fi verificată</h2>
        <p>Dear ${firstName}, / Stimate(ă) ${firstName},</p>
        <p>We were unable to verify the payment receipt you submitted for work permit application <strong>${refNumber}</strong>. Nu am putut verifica dovada plății trimisă.</p>
        ${reason ? `<p><strong>Reason / Motiv:</strong> ${reason}</p>` : ""}
        <p>Please log in to your dashboard and upload a valid receipt, or contact our support team for assistance. Vă rugăm să încărcați o dovadă validă sau să ne contactați.</p>`);
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
        <h2 style="color:#1a2744;margin-top:0">We've Received Your Message / Am primit mesajul dumneavoastră</h2>
        <p>Dear ${name}, / Stimate(ă) ${name},</p>
        <p>Thank you for contacting Moldova Visa Assist. Vă mulțumim că ne-ați contactat. Our team will respond within 1–2 business days / Echipa noastră vă va răspunde în 1–2 zile lucrătoare.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:6px;margin:16px 0;color:#374151;font-style:italic">"${message}"</div>
        <p>If your inquiry is urgent, please call us directly. Pentru urgențe, vă rugăm să ne sunați.</p>`);
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
