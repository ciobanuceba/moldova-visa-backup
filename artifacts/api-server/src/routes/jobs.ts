import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, jobsTable } from "@workspace/db";
import {
  CreateJobBody,
  GetJobParams,
  ListJobsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/jobs", async (req, res): Promise<void> => {
  const query = ListJobsQueryParams.safeParse(req.query);
  const conditions = [];

  conditions.push(eq(jobsTable.isActive, true));

  if (query.success && query.data.category) {
    conditions.push(eq(jobsTable.category, query.data.category));
  }
  if (query.success && query.data.location) {
    conditions.push(eq(jobsTable.location, query.data.location));
  }

  const jobs = await db
    .select()
    .from(jobsTable)
    .where(and(...conditions))
    .orderBy(jobsTable.createdAt);

  res.json(jobs.map((j) => ({ ...j, createdAt: j.createdAt.toISOString() })));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.insert(jobsTable).values(parsed.data).returning();
  res.status(201).json({ ...job, createdAt: job.createdAt.toISOString() });
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.id, params.data.id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ ...job, createdAt: job.createdAt.toISOString() });
});

export default router;
