import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicantUsersTable = pgTable("applicant_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApplicantUserSchema = createInsertSchema(applicantUsersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertApplicantUser = z.infer<typeof insertApplicantUserSchema>;
export type ApplicantUser = typeof applicantUsersTable.$inferSelect;
