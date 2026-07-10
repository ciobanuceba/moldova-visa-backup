import { db, jobsTable } from "@workspace/db";

const jobs = await db.select({ id: jobsTable.id, title: jobsTable.title, location: jobsTable.location }).from(jobsTable);
jobs.forEach(j => console.log(`${j.id} | ${j.title} | ${j.location}`));
console.log(`\nTotal: ${jobs.length}`);
process.exit(0);
