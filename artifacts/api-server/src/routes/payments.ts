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

const WORK_PERMIT_FEE_EUR = 9900; // €99.00 in cents
const WORK_PERMIT_FEE_LABEL = "€99.00";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Manual payment methods shown on the payment page.
// Skrill uses a fixed email (not sensitive account/routing info, safe to show).
// Nagad shows a QR code image only — never a phone number. Until a QR image is
// configured, the method is omitted from the list entirely so nothing broken
// or placeholder-y is shown to users; add NAGAD_QR_URL to enable it later
// without touching any layout code.
const SKRILL_EMAIL = "ciobanuceban@gmail.com";

function getManualPaymentMethods() {
  const methods: Array<Record<string, string>> = [
    { type: "skrill", label: "Skrill", email: SKRILL_EMAIL },
  ];

  if (process.env.NAGAD_QR_URL) {
    methods.push({ type: "nagad", label: "Nagad", qrUrl: process.env.NAGAD_QR_URL });
  }

  return methods;
}

// Get manual payment instructions (bank + mobile banking) for a work permit application
router.get("/payments/work-permit/:id/info", requireApplicant, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { email } = (req as any).applicant;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, reference_number, email, payment_status, payment_method, receipt_url, receipt_filename,
              receipt_uploaded_at, payment_rejection_reason
       FROM work_permits WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Work permit application not found" }); return; }
    const permit = rows[0];
    if (permit.email !== email) { res.status(403).json({ error: "Not authorized to view this application" }); return; }

    res.json({
      referenceNumber: permit.reference_number,
      amount: WORK_PERMIT_FEE_LABEL,
      paymentStatus: permit.payment_status,
      paymentMethod: permit.payment_method,
      receiptUrl: permit.receipt_url,
      receiptFilename: permit.receipt_filename,
      receiptUploadedAt: permit.receipt_uploaded_at,
      rejectionReason: permit.payment_rejection_reason,
      methods: getManualPaymentMethods(),
    });
  } finally {
    client.release();
  }
});

// Upload a payment receipt (base64-encoded image or PDF)
router.post("/payments/work-permit/:id/receipt", requireApplicant, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { email } = (req as any).applicant;
  const { filename, contentType, data, method } = req.body ?? {};

  if (!filename || !contentType || !data) {
    res.status(400).json({ error: "filename, contentType, and data (base64) are required" });
    return;
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(contentType)) {
    res.status(400).json({ error: "Only JPG, PNG, WEBP, or PDF files are allowed" });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, reference_number, first_name, email, payment_status FROM work_permits WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Work permit application not found" }); return; }
    const permit = rows[0];
    if (permit.email !== email) { res.status(403).json({ error: "Not authorized to update this application" }); return; }
    if (permit.payment_status === "paid") {
      res.status(409).json({ error: "This application has already been paid" });
      return;
    }

    const ext = path.extname(filename).toLowerCase() || ".bin";
    const safeName = `receipt-${randomBytes(8).toString("hex")}${ext}`;
    const filepath = path.join(UPLOAD_DIR, safeName);

    const buffer = Buffer.from(data, "base64");
    if (buffer.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({ error: "File exceeds 5 MB limit" });
      return;
    }
    fs.writeFileSync(filepath, buffer);

    const receiptUrl = `/api/upload/files/${safeName}`;
    await client.query(
      `UPDATE work_permits
       SET payment_status = 'pending_review', payment_method = $1, receipt_url = $2,
           receipt_filename = $3, receipt_uploaded_at = NOW(), payment_rejection_reason = NULL
       WHERE id = $4`,
      [method || "manual", receiptUrl, filename, id]
    );

    sendEmail({
      to: permit.email,
      subject: `Payment Receipt Received — ${permit.reference_number}`,
      html: workPermitReceiptReceivedEmail(permit.first_name, permit.reference_number),
    }).catch((err) => logger.error({ err }, "Failed to send receipt received email"));

    if (process.env.ADMIN_EMAIL) {
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Payment Receipt — ${permit.reference_number}`,
        html: newPaymentReceiptAdminNotificationEmail(permit.first_name, permit.reference_number, method || "manual"),
      }).catch((err) => logger.error({ err }, "Failed to send admin receipt notification email"));
    }

    res.json({ success: true, paymentStatus: "pending_review", receiptUrl });
  } finally {
    client.release();
  }
});

// Create a Stripe checkout session for a work permit application
router.post("/payments/work-permit/checkout", async (req, res): Promise<void> => {
  const { workPermitId } = req.body ?? {};

  if (!workPermitId) {
    res.status(400).json({ error: "workPermitId is required" });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, reference_number, first_name, last_name, email, status, payment_status
       FROM work_permits WHERE id = $1`,
      [workPermitId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Work permit application not found" });
      return;
    }

    const permit = rows[0];

    if (permit.payment_status === "paid") {
      res.status(409).json({ error: "This application has already been paid" });
      return;
    }

    const stripe = getUncachableStripeClient();

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:80";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: WORK_PERMIT_FEE_EUR,
            product_data: {
              name: "Work Permit Application Fee",
              description: `Reference: ${permit.reference_number} — Moldova Visa Assist`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: permit.email,
      metadata: {
        work_permit_id: String(permit.id),
        reference_number: permit.reference_number,
      },
      payment_intent_data: {
        metadata: {
          work_permit_id: String(permit.id),
          reference_number: permit.reference_number,
        },
      },
      success_url: `${baseUrl}/work-permit/payment-success?ref=${permit.reference_number}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/work-permit/payment-cancel?ref=${permit.reference_number}`,
    });

    await client.query(
      `UPDATE work_permits SET payment_status = 'pending', stripe_session_id = $1 WHERE id = $2`,
      [session.id, permit.id]
    );

    if (session.url) {
      sendEmail({
        to: permit.email,
        subject: `Action Required — Complete Payment for ${permit.reference_number}`,
        html: workPermitPaymentRequestEmail(
          permit.first_name,
          permit.reference_number,
          session.url,
          `€${(WORK_PERMIT_FEE_EUR / 100).toFixed(2)}`
        ),
      }).catch((err) => logger.error({ err }, "Failed to send work permit payment request email"));
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    if (err.message?.includes("STRIPE_SECRET_KEY")) {
      res.status(503).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to the Secrets tab." });
    } else {
      logger.error({ err }, "Failed to create Stripe checkout session");
      res.status(500).json({ error: "Failed to create payment session" });
    }
  } finally {
    client.release();
  }
});

// Verify payment success by session ID
router.get("/payments/work-permit/verify", async (req, res): Promise<void> => {
  const { sessionId } = req.query as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }

  try {
    const stripe = getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaid = session.payment_status === "paid";

    if (isPaid) {
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE work_permits SET payment_status = 'paid', status = 'payment_confirmed'
           WHERE stripe_session_id = $1 AND payment_status != 'paid'`,
          [sessionId]
        );
      } finally {
        client.release();
      }
    }

    res.json({ paid: isPaid, status: session.payment_status });
  } catch (err: any) {
    logger.error({ err }, "Failed to verify payment");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
