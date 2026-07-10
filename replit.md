# Moldova Visa Assist

A full-stack job portal that connects Moldovan talent with verified employers across Europe. The app provides comprehensive visa support, legal guidance, and job placement services.

## Stack

- **Frontend** (`artifacts/moldova-visa-assist`): React + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Wouter routing
- **API Server** (`artifacts/api-server`): Express + TypeScript, Drizzle ORM, PostgreSQL (Replit built-in)
- **Shared libs** (`lib/`): `api-client-react` (generated React Query hooks), `api-spec` (OpenAPI + Orval codegen), `api-zod` (Zod validators), `db` (Drizzle schema + connection)
- **Package manager**: pnpm workspaces

## Running the project

Three workflows are configured. Start them from the Workflows panel or run manually:

| Service | Command |
|---|---|
| Frontend (dev) | `pnpm --filter @workspace/moldova-visa-assist run dev` |
| API Server | `pnpm --filter @workspace/api-server run dev` |
| Mockup sandbox | `pnpm --filter @workspace/mockup-sandbox run dev` |

The API server builds with esbuild before starting (`node ./build.mjs`).

## Database

Uses Replit's built-in PostgreSQL. `DATABASE_URL` is injected automatically — do not set it manually.

Schema tables: `jobs`, `applications`, `contacts`

To run migrations via Drizzle Kit:
```
cd lib/db && pnpm drizzle-kit push
```

## Project structure

```
artifacts/
  api-server/          # Express REST API (preview path: /api)
  moldova-visa-assist/ # React SPA (preview path: /)
  mockup-sandbox/      # Component preview server for canvas (preview path: /__mockup)
lib/
  api-client-react/    # Generated TanStack Query hooks (source: lib/api-spec)
  api-spec/            # OpenAPI spec + Orval config
  api-zod/             # Zod schemas derived from OpenAPI spec
  db/                  # Drizzle ORM schema and db connection
```

## Pages

- `/` — Home (hero, stats, featured jobs)
- `/jobs` — Job listings with filters
- `/jobs/:id` — Job detail
- `/apply/:jobId` — Job application form
- `/services` — Visa & relocation services
- `/about` — About the company
- `/contact` — Contact form
- `/admin` — Admin panel (job management, applications)

## User preferences

<!-- Add user preferences here as they are expressed -->
