import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { sendEmail } from "../lib/email";
import { randomBytes } from "crypto";

const router: IRouter = Router();

router.post("/public-payments/checkout", async (req, res): Promise<void> => {
  const { fileNumber, name, email, amount } = req.body ?? {};
  const numericAmount = Number(amount);
  if (!fileNumber || !name || !email || !Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 10000) {
    res.status(400).json({ error: "File number, name, email and a valid amount are required" });
    return;
  }

  const paymentReference = `PAY-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public_payments (payment_reference, file_number, name, email, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'usd', 'pending')`,
      [paymentReference, String(fileNumber).trim(), String(name).trim(), String(email).trim(), numericAmount]
    );

    const stripe = getUncachableStripeClient();
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: Math.round(numericAmount * 100),
          product_data: { name: `Payment — ${String(fileNumber).trim()}` },
        },
        quantity: 1,
      }],
      mode: "payment",
      customer_email: String(email).trim(),
      metadata: { public_payment_id: paymentReference, file_number: String(fileNumber).trim() },
      payment_intent_data: { metadata: { public_payment_id: paymentReference, file_number: String(fileNumber).trim() } },
      success_url: `${baseUrl}/payment/success?ref=${encodeURIComponent(paymentReference)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment?cancelled=1`,
    });

    await client.query(`UPDATE public_payments SET stripe_session_id = $1 WHERE payment_reference = $2`, [session.id, paymentReference]);
    res.json({ url: session.url, paymentReference });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Unable to create payment" });
  } finally {
    client.release();
  }
});

router.get("/public-payments/status", async (req, res): Promise<void> => {
  const reference = String(req.query.ref || "").trim();
  if (!reference) { res.status(400).json({ error: "Reference required" }); return; }
  const { rows } = await pool.query(
    `SELECT payment_reference, file_number, name, amount, currency, status, paid_at, created_at
     FROM public_payments WHERE payment_reference = $1`, [reference]
  );
  if (!rows.length) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(rows[0]);
});

export default router;
