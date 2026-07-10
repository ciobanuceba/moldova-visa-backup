---
name: Auth system design
description: JWT auth for admin and applicant roles — env vars, table, secret
---

## Admin auth
- Credentials: `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars (defaults: `admin@moldova-visa-assist.replit.app` / `Admin@2024!`)
- Optional: `ADMIN_PASSWORD_HASH` (bcrypt) for production — takes priority over plain `ADMIN_PASSWORD`
- Route: `POST /api/auth/admin/login` → returns JWT with `{ role: "admin", email }`

## Applicant auth
- Table: `applicant_users` (id, email, password_hash, first_name, last_name, created_at)
- Routes: `POST /api/auth/applicant/register`, `POST /api/auth/applicant/login`, `GET /api/auth/applicant/me`
- JWT payload: `{ role: "applicant", id, email }`

## JWT
- Secret: `JWT_SECRET` env var (defaults to dev secret — MUST be set in production)
- Expiry: 7 days
- Middleware: `requireAdmin.ts`, `requireApplicant.ts` — extract Bearer token, verify, attach to `req.admin` / `req.applicant`

## Frontend
- `AuthProvider` in `src/lib/auth.tsx` — stores `{ token, role, email, id, firstName, lastName }` in localStorage under key `mva_auth`
- `useAuth()` hook — exposes `user`, `login`, `logout`, `isAdmin`, `isApplicant`

**Why:** Simple JWT approach chosen over session cookies for stateless API compatibility and easy mobile extension later.
