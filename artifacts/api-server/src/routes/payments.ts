import { Router, type IRouter } from "express";
import path from "path";
import { randomBytes } from "crypto";
import fs from "fs";
import { pool } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { logger } from "../lib/logger";
import {
  sendEmail,
  workPermitPaymentRequestEmail,
  workPermitReceiptReceivedEmail,
  newPaymentReceiptAdminNotificationEmail,
} from "../lib/email";
import { requireApplicant } from "../middleware/requireApplicant";

const router: IRouter = Router();

const WORK_PERMIT_FEE_EUR = 12000;
const WORK_PERMIT_FEE_LABEL = "€120.00";
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const SKRILL_EMAIL = "ciobanuceban@gmail.com";

function getManualPaymentMethods() {
  const methods: Array<Record<string, string>> = [{ type: "skrill", label: "Skrill", email: SKRILL_EMAIL }];
  if (process.env.NAGAD_NUMBER) {
    const nagad: Record<string, string> = { type: "nagad", label: "Nagad", number: process.env.NAGAD_NUMBER };
    if (process.env.NAGAD_QR_URL) nagad.qrUrl = process.env.NAGAD_QR_URL;
    methods.push(nagad);
  }
  return methods;
}

function getPublicBaseUrl(): string {
  const renderUrl = String(process.env.RENDER_EXTERNAL_URL || "").trim().replace(/\/$/, "");
  if (renderUrl) return renderUrl;
  const replitDomain = String(process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "").split(",")[0].trim();
  if (replitDomain) return `https://${replitDomain}`;
  return "http://localhost:5000";
}

// Standalone public payment page: user supplies only name, file number and amount.
// No application search/list is exposed to the user.
router.post("/payments/general/checkout", async (req, res): Promise<void> => {
  const { name, fileNumber, amount } = req.body ?? {};
  const cleanName = String(name || "").trim();
  const cleanFileNumber = String(fileNumber || "").trim();
  const numericAmount = Number(amount);
  if (!cleanName || !cleanFileNumber || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    res.status(400).json({ error: "Name, file number and a valid amount are required" });
    return;
  }
  if (numericAmount > 100000) {
    res.status(400).json({ error: "Payment amount is too large" });
    return;
  }

  try {
    const stripe = getUncachableStripeClient();
    const baseUrl = getPublicBaseUrl();
    const amountCents = Math.round(numericAmount * 100);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: { name: `Payment — ${cleanFileNumber}` },
        },
        quantity: 1,
      }],
      mode: "payment",
      metadata: { payer_name: cleanName, file_number: cleanFileNumber },
      payment_intent_data: { metadata: { payer_name: cleanName, file_number: cleanFileNumber } },
      success_url: `${baseUrl}/work-permit/payment-success?ref=${encodeURIComponent(cleanFileNumber)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/work-permit/payment-cancel?ref=${encodeURIComponent(cleanFileNumber)}`,
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    logger.error({ error }, "General payment checkout failed");
    res.status(500).json({ error: "Payment service is temporarily unavailable" });
  }
});

router.get("/payments/work-permit/:id/info", requireApplicant, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { email } = (req as any).applicant;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT id, reference_number, email, payment_status, payment_method, receipt_url, receipt_filename, receipt_uploaded_at, payment_rejection_reason FROM work_permits WHERE id = $1`, [id]);
    if (rows.length === 0) { res.status(404).json({ error: "Work permit application not found" }); return; }
    const permit = rows[0];
    if (permit.email !== email) { res.status(403).json({ error: "Not authorized" }); return; }
    res.json({ referenceNumber: permit.reference_number, amount: WORK_PERMIT_FEE_LABEL, paymentStatus: permit.payment_status, paymentMethod: permit.payment_method, receiptUrl: permit.receipt_url, receiptFilename: permit.receipt_filename, receiptUploadedAt: permit.receipt_uploaded_at, rejectionReason: permit.payment_rejection_reason, methods: getManualPaymentMethods() });
  } finally { client.release(); }
});

router.post("/payments/work-permit/:id/receipt", requireApplicant, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { email } = (req as any).applicant;
  const { filename, contentType, data, method } = req.body ?? {};
  if (!filename || !contentType || !data) { res.status(400).json({ error: "Missing required fields" }); return; }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT id, reference_number, first_name, email, payment_status FROM work_permits WHERE id = $1`, [id]);
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    if (rows[0].email !== email) { res.status(403).json({ error: "Not authorized" }); return; }
    const ext = path.extname(filename).toLowerCase() || ".bin";
    const safeName = `receipt-${randomBytes(8).toString("hex")}${ext}`;
    const filepath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
    const receiptUrl = `/api/upload/files/${safeName}`;
    await client.query(`UPDATE work_permits SET payment_status = 'pending_review', payment_method = $1, receipt_url = $2, receipt_filename = $3, receipt_uploaded_at = NOW(), payment_rejection_reason = NULL WHERE id = $4`, [method || "manual", receiptUrl, filename, id]);
    res.json({ success: true, paymentStatus: "pending_review", receiptUrl });
  } finally { client.release(); }
});

router.post("/payments/work-permit/checkout", requireApplicant, async (req, res): Promise<void> => {
  const { workPermitId } = req.body ?? {};
  if (!workPermitId) { res.status(400).json({ error: "workPermitId required" }); return; }
  const { email } = (req as any).applicant;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT id, reference_number, first_name, email FROM work_permits WHERE id = $1 AND email = $2`, [workPermitId, email]);
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    const permit = rows[0];
    const stripe = getUncachableStripeClient();
    const baseUrl = getPublicBaseUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "eur", unit_amount: WORK_PERMIT_FEE_EUR, product_data: { name: "Work Permit Fee" } }, quantity: 1 }],
      mode: "payment", customer_email: permit.email,
      metadata: { work_permit_id: String(permit.id) }, payment_intent_data: { metadata: { work_permit_id: String(permit.id) } },
      success_url: `${baseUrl}/work-permit/payment-success?ref=${permit.reference_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/work-permit/payment-cancel?ref=${permit.reference_number}`,
    });
    await client.query(`UPDATE work_permits SET stripe_session_id = $1 WHERE id = $2`, [session.id, workPermitId]);
    res.json({ url: session.url, sessionId: session.id });
  } finally { client.release(); }
});

router.get("/payments/work-permit/verify", async (req, res): Promise<void> => {
  const { sessionId } = req.query as { sessionId?: string };
  if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }
  const stripe = getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid") {
    const client = await pool.connect();
    try { await client.query(`UPDATE work_permits SET payment_status = 'pending_review', status = 'payment_confirmed' WHERE stripe_session_id = $1`, [sessionId]); }
    finally { client.release(); }
  }
  res.json({ paid: session.payment_status === "paid" });
});

export default router;
