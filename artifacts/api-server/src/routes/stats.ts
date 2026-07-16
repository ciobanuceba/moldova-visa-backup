import { Router, type IRouter } from "express";
import { db, jobsTable, applicationsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  try {
    const [jobsResult] = await db
     .select({ count: count() })
     .from(jobsTable)
     .where(eq(jobsTable.isActive, true));

    const [appsResult] = await db
     .select({ count: count() })
     .from(applicationsTable);

    const categoriesResult = await db
     .selectDistinct({ category: jobsTable.category })
     .from(jobsTable)
     .where(eq(jobsTable.isActive, true));

    const countriesResult = await db.execute(
      sql`SELECT COUNT(DISTINCT location) as count FROM jobs WHERE is_active = true`
    );

    const countriesCount =
      (countriesResult.rows[0] as { count: string })?.count?? "0";

    res.json({
      totalJobs: jobsResult.count,
      totalApplications: appsResult.count,
      totalCategories: categoriesResult.length,
      countriesServed: parseInt(countriesCount, 10),
    });
  } catch (err) {
    console.error("Stats error:", err);
    // Fallback jate Loading atke na thake
    res.json({
      totalJobs: 0,
      totalApplications: 0,
      totalCategories: 0,
      countriesServed: 0,
    });
  }
});

export default router;