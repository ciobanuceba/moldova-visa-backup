import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { runMigrations } from "./lib/migrate";
import { WebhookHandlers } from "./lib/webhookHandlers";
import router from "./routes";

const app: Express = express();

// ── Stripe webhook MUST be registered before express.json() ──────────────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

// ── General middleware ────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  })
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── DB migrations on startup ──────────────────────────────────────────────────
runMigrations()
  .then(() => logger.info("Migrations complete"))
  .catch((err) => logger.error({ err }, "Migration failed (non-fatal)"));

app.use("/api", router);

// In production, serve the built SPA from the same process as the API.
// This keeps the published app on one public port while the dev workflows
// continue to use separate frontend and API servers.
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../moldova-visa-assist/dist/public",
);
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next(err);
  });
});

export default app;
