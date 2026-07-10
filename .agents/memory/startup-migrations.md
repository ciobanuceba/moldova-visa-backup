---
name: API Server Startup Migrations
description: Pattern for running idempotent DB migrations on server startup when pnpm db push is not available
---

When `pnpm --filter @workspace/db run push` cannot run (e.g. environment restrictions), the pattern is:

1. Write `artifacts/api-server/src/lib/migrate.ts` that imports `pool` from `@workspace/db` and runs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` SQL.
2. Import and call `runMigrations()` in `app.ts` before the router is mounted.
3. Catch errors and log them as non-fatal — server still starts, endpoint will throw on first hit if table is missing, making the failure visible.

**Why:** esbuild bundles the API server, so any code reachable from `src/app.ts` gets bundled and executed at runtime. No separate migration runner needed.

**How to apply:** Use whenever you need to add columns or tables and the Drizzle push CLI is unavailable. Always use `IF NOT EXISTS` to keep it idempotent.
