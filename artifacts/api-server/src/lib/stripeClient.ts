import Stripe from "stripe";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. " +
      "Please add your Stripe secret key to the Secrets tab."
    );
  }
  return key;
}

export function getUncachableStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey());
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET environment variable is not set. " +
      "Please add your Stripe webhook signing secret to the Secrets tab."
    );
  }
  return secret;
}
