import { getUncachableStripeClient, getWebhookSecret } from "./stripeClient";
import { pool } from "@workspace/db";
import { sendEmail, workPermitPaymentConfirmedEmail } from "./email";
import { logger } from "./logger";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
          "Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    const stripe = getUncachableStripeClient();
    const webhookSecret = getWebhookSecret();

    let event: import("stripe").Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    logger.info({ type: event.type }, "Stripe webhook received");

    if (event.type === "payment_intent.succeeded") {
      await WebhookHandlers.handlePaymentIntentSucceeded(event);
    } else if (event.type === "checkout.session.completed") {
      await WebhookHandlers.handleCheckoutSessionCompleted(event);
    }
  }

  static async handlePaymentIntentSucceeded(
    event: import("stripe").Stripe.Event
  ): Promise<void> {
    try {
      const paymentIntent = event.data.object as import("stripe").Stripe.PaymentIntent;
      const workPermitId = paymentIntent.metadata?.work_permit_id;
      if (!workPermitId) return;

      const client = await pool.connect();
      try {
        const { rows } = await client.query(
          `UPDATE work_permits
             SET payment_status = 'paid', stripe_payment_intent_id = $1,
                 status = CASE WHEN status = 'submitted' THEN 'payment_confirmed' ELSE status END
           WHERE id = $2
           RETURNING first_name, email, reference_number`,
          [paymentIntent.id, workPermitId]
        );
        if (rows.length > 0) {
          const { first_name, email, reference_number } = rows[0];
          await sendEmail({
            to: email,
            subject: `Payment Confirmed — ${reference_number}`,
            html: workPermitPaymentConfirmedEmail(first_name, reference_number),
          });
          logger.info({ workPermitId, reference_number }, "Work permit payment confirmed via webhook");
        }
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error({ err }, "Error in handlePaymentIntentSucceeded");
    }
  }

  static async handleCheckoutSessionCompleted(
    event: import("stripe").Stripe.Event
  ): Promise<void> {
    try {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      if (session.payment_status !== "paid") return;

      const workPermitId = session.metadata?.work_permit_id;
      if (!workPermitId) return;

      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE work_permits
             SET payment_status = 'paid', stripe_session_id = $1,
                 status = CASE WHEN status = 'submitted' THEN 'payment_confirmed' ELSE status END
           WHERE id = $2 AND payment_status != 'paid'`,
          [session.id, workPermitId]
        );
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error({ err }, "Error in handleCheckoutSessionCompleted");
    }
  }
}
