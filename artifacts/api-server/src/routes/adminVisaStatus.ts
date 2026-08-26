import { Router, type IRouter } from "express";
import { db, applicationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
router.use("/admin/visa", requireAdmin);

const ALLOWED = ["pending", "review", "processing", "decision_ready", "approved", "rejected"] as const;

type VisaStatus = typeof ALLOWED[number];

function isVisa(details: string | null) {
  try { return JSON.parse(details || "{}").type === "visa"; } catch { return false; }
}
function publicStatus(status: string) {
  return status === "pending" ? "received" : status;
}
function timeline(status: string) {
  const order = ["received", "review", "processing", "decision_ready", "approved"];
  const current = status === "rejected" ? -1 : order.indexOf(status);
  return order.map((key, index) => ({ key, completed: current >= index, current: current === index }));
}

router.get("/admin/visa-applications", async (_req, res): Promise<void> => {
  const rows = await db.select({ id: applicationsTable.id, firstName: applicationsTable.firstName, lastName: applicationsTable.lastName, email: applicationsTable.email, passportNumber: applicationsTable.passportNumber, coverLetter: applicationsTable.coverLetter, status: applicationsTable.status, createdAt: applicationsTable.createdAt }).from(applicationsTable).orderBy(desc(applicationsTable.createdAt));
  const visas = rows.filter(row => isVisa(row.coverLetter)).map(row => {
    const details = JSON.parse(row.coverLetter || "{}");
    const status = publicStatus(row.status || "pending");
    return { id: row.id, applicantName: `${row.firstName} ${row.lastName}`, email: row.email, referenceNumber: details.referenceNumber, visaType: details.visaType, destination: details.destination, travelDate: details.travelDate, status, createdAt: row.createdAt };
  });
  res.json(visas);
});

router.patch("/admin/visa-applications/:id/status", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  if (!Number.isInteger(id) || !ALLOWED.includes(status as VisaStatus)) { res.status(400).json({ error: "Invalid application or status" }); return; }
  const [row] = await db.select({ id: applicationsTable.id, coverLetter: applicationsTable.coverLetter }).from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
  if (!row || !isVisa(row.coverLetter)) { res.status(404).json({ error: "Visa application not found" }); return; }
  await db.update(applicationsTable).set({ status }).where(eq(applicationsTable.id, id));
  res.json({ success: true, status, timeline: timeline(publicStatus(status)) });
});

export default router;
