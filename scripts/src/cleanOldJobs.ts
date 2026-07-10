import { pool } from "@workspace/db";

const OLD_JOB_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const client = await pool.connect();
try {
  const { rows } = await client.query(
    `DELETE FROM jobs WHERE id = ANY($1::int[]) RETURNING id, title`,
    [OLD_JOB_IDS],
  );
  console.log(`Deleted ${rows.length} old test jobs:`);
  rows.forEach((j: { id: number; title: string }) =>
    console.log(`  ✕ [${j.id}] ${j.title}`),
  );
} finally {
  client.release();
  process.exit(0);
}
