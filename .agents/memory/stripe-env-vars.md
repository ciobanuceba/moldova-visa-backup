---
name: Stripe env vars
description: Stripe uses env vars directly, not Replit connector (user dismissed it)
---

## Setup
User dismissed the Replit Stripe OAuth connector. Stripe credentials must be added as Secrets:
- `STRIPE_SECRET_KEY` — Stripe secret key (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (whsec_...)

## Stripe client
`artifacts/api-server/src/lib/stripeClient.ts` — reads from env vars directly, throws clear error if missing.

## Webhook
`POST /api/stripe/webhook` — registered BEFORE `express.json()` middleware in `app.ts`, uses `express.raw()`. Verifies signature with `stripe.webhooks.constructEvent()`.

**Why:** Replit connector was not_setup and user dismissed the OAuth flow. Env var approach is portable and works in both dev and production.
