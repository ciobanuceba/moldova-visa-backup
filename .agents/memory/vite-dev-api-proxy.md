---
name: Vite dev API proxy for multi-service artifacts
description: Why the frontend's own vite dev server needs a /api proxy even though a platform-level reverse proxy also exists.
---

In a pnpm-workspace project with separate frontend and API-server artifacts, there are two different proxy layers:

1. A platform-level shared reverse proxy (reachable at port 80) that routes by path per each artifact's `.replit-artifact/artifact.toml`. Works correctly when tested directly (e.g. via curl to port 80).
2. The browser preview (app_preview screenshots, and the actual user preview pane/iframe) loads the page from the frontend artifact's *own* workflow port directly — not through the port-80 shared proxy. Relative fetches like `/api/jobs` issued from JS running on that page go to the frontend's own dev server port, not the API server.

**Why:** Without a proxy in the frontend's own vite config, `/api/*` requests hit vite's SPA fallback and return `index.html` instead of JSON. Since the response `Content-Type` is `text/html`, generated API client code that only checks the JSON-like string shape (starts with `{`/`[`) can silently treat the HTML as raw string data instead of throwing, causing confusing downstream errors like `x.map is not a function` rather than an obvious fetch/parse failure.

**How to apply:** For any multi-service frontend+API artifact pair, add a `server.proxy` entry in the frontend's `vite.config.ts` forwarding the API path prefix (e.g. `/api`) to `http://localhost:<api-server-port>` with `changeOrigin: true`. Don't rely solely on the platform's shared port-80 proxy — verify behavior via `screenshot({type: 'app_preview'})` (which mimics real user preview), not just direct curl to port 80.
