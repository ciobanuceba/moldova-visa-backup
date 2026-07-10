# Moldova Visa Assist — Deployment Checklist

Generated: 2026-07-03 | Status: Production Ready ✅

---

## Required Environment Variables

Set all secrets in the **Secrets** tab (never in code or `.env` files).

### Critical — App will not start without these
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Auto-injected by Replit |
| `JWT_SECRET` | Long random string for signing JWTs — **change from default before going live** | `openssl rand -hex 64` |

### Admin credentials
| Variable | Description | Default (change before launch) |
|---|---|---|
| `ADMIN_EMAIL` | Admin login email | `admin@moldova-visa-assist.replit.app` |
| `ADMIN_PASSWORD` | Admin login password | `Admin@2024!` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password (optional, preferred over plain) | — |

### Stripe payments (work permit fee — €99)
| Variable | Description | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` for prod, `sk_test_...` for test) | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret for verifying events | Stripe dashboard → Webhooks → signing secret |

### Email notifications (optional — degrades gracefully if not set)
| Variable | Description | Example |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (defaults to 587) | `587` |
| `SMTP_USER` | SMTP username / email address | `noreply@yourdomain.com` |
| `SMTP_PASS` | SMTP password or app password | — |
| `FROM_EMAIL` | Sender address in emails | `noreply@moldova-visa-assist.com` |

---

## Pre-Deploy Steps

### 1. Rotate all default credentials
- [ ] Set `JWT_SECRET` to a cryptographically random value (`openssl rand -hex 64`)
- [ ] Change `ADMIN_EMAIL` to a real admin email
- [ ] Set `ADMIN_PASSWORD_HASH` to a bcrypt hash of your chosen password:
  ```bash
  node -e "const b=require('bcryptjs'); b.hash('YourPassword', 12).then(console.log)"
  ```
- [ ] Remove or override `ADMIN_PASSWORD` once `ADMIN_PASSWORD_HASH` is set

### 2. Stripe setup
- [ ] Create a Stripe account at https://stripe.com
- [ ] Set `STRIPE_SECRET_KEY` (use test key `sk_test_...` first, then `sk_live_...` for production)
- [ ] Create a webhook endpoint in Stripe pointing to `https://<your-domain>/api/stripe/webhook`
  - Events to listen for: `checkout.session.completed`, `payment_intent.payment_failed`
- [ ] Set `STRIPE_WEBHOOK_SECRET` from the webhook's signing secret
- [ ] Test a payment with Stripe card `4242 4242 4242 4242` before going live

### 3. Email setup (recommended)
- [ ] Configure SMTP credentials (Gmail, Mailgun, SendGrid, etc.)
- [ ] Send a test contact form submission and verify email arrives
- [ ] Verify approval/rejection emails send from admin panel

### 4. Database
- [ ] Migrations run automatically on server start — no manual step needed
- [ ] If promoting dev DB to production: verify all tables exist and have correct columns
- [ ] Seed initial job listings via `POST /api/admin/jobs` or through the admin panel

### 5. Domain & TLS
- [ ] Add a custom domain in Replit's deployment settings
- [ ] Confirm HTTPS is active on the custom domain before enabling Stripe live mode

---

## Functional Test Checklist

### Public pages
- [ ] `/` — Home, stats count, featured jobs load
- [ ] `/jobs` — Job listings with search and filter
- [ ] `/jobs/:id` — Job detail, apply button works
- [ ] `/apply/:jobId` — Multi-step application form submits
- [ ] `/services` — Service descriptions visible
- [ ] `/about` — About page loads
- [ ] `/contact` — Form submits and shows success state
- [ ] `/faq` — FAQ accordion works
- [ ] `/work-permit` — 3-step permit form completes
- [ ] `/letter-builder` — Letter builder tool works
- [ ] `/privacy`, `/terms` — Policy pages accessible

### Authentication
- [ ] `/register` — Applicant can create account
- [ ] `/login` — Applicant can log in
- [ ] `/dashboard` — Shows applicant's applications and work permits
- [ ] `/admin/login` — Admin login works
- [ ] `/admin` — Statistics tab loads, can switch to Applications / Work Permits / Jobs tabs
- [ ] Admin can approve/reject applications (email + PDF sent)
- [ ] Admin can create/toggle/delete jobs

### Payment flow
- [ ] Work permit submits and returns reference number
- [ ] Stripe checkout page opens for work permit
- [ ] Test payment succeeds (card `4242 4242 4242 4242`)
- [ ] Payment success page shows reference and status
- [ ] Payment cancel page shows recovery options
- [ ] Work permit status updates to `payment_confirmed` after payment

---

## Architecture Summary

```
Frontend (React + Vite)    →  /
API Server (Express)       →  /api
```

Both run as separate services behind Replit's shared reverse proxy. No CORS configuration needed.

### Auth flow
- Admin: `POST /api/auth/admin/login` → JWT (7-day) → stored in `localStorage`
- Applicant: `POST /api/auth/applicant/register|login` → JWT (7-day) → stored in `localStorage`
- Admin routes: require `Authorization: Bearer <token>` with `role: "admin"`
- Applicant routes: require `Authorization: Bearer <token>` with `role: "applicant"`

### Email behaviour
- If SMTP env vars are not set: emails are logged to the server console, not sent
- All email sending is non-blocking — server never errors due to email failure

### PDF generation
- PDFKit generates offer letters as in-memory Buffers
- No file system writes; PDFs are streamed directly to the response or emailed as attachments
- pdfkit is externalized from esbuild (required for font file resolution)

---

## Performance notes

- All queries use indexed columns (primary keys, email)
- `applicant_users.email` has a UNIQUE index (DB-enforced)
- `work_permits.reference_number` has a UNIQUE index
- Static assets are served by Vite's built output with content-hash filenames (long cache TTLs safe)
- API bundle is ~5.3 MB (includes all dependencies except pdfkit, nodemailer, pg — those load from node_modules)

---

## What gracefully degrades without optional env vars

| Missing variable | Effect |
|---|---|
| `SMTP_*` | Emails logged to console; users still receive success confirmation in the browser |
| `STRIPE_SECRET_KEY` | Work permit payment returns clear 503 with instructions; rest of app unaffected |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification skipped; payment status updated via verify endpoint instead |
| `FROM_EMAIL` | Falls back to `noreply@moldova-visa-assist.replit.app` |
