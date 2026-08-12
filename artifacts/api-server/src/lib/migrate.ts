// @ts-nocheck
import { pool } from "@workspace/db";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS nationality TEXT,
        ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
        ADD COLUMN IF NOT EXISTS passport_number TEXT,
        ADD COLUMN IF NOT EXISTS years_experience TEXT,
        ADD COLUMN IF NOT EXISTS skills TEXT,
        ADD COLUMN IF NOT EXISTS languages TEXT,
        ADD COLUMN IF NOT EXISTS available_from TEXT,
        ADD COLUMN IF NOT EXISTS resume_url TEXT,
        ADD COLUMN IF NOT EXISTS admin_notes TEXT;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS work_permits (
        id SERIAL PRIMARY KEY,
        reference_number TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        nationality TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        passport_number TEXT NOT NULL,
        passport_expiry TEXT NOT NULL,
        current_address TEXT NOT NULL,
        permit_type TEXT NOT NULL,
        employer_name TEXT NOT NULL,
        employer_country TEXT NOT NULL,
        job_title TEXT NOT NULL,
        job_salary TEXT NOT NULL,
        start_date TEXT NOT NULL,
        contract_duration TEXT NOT NULL,
        has_passport BOOLEAN NOT NULL DEFAULT FALSE,
        has_job_offer BOOLEAN NOT NULL DEFAULT FALSE,
        has_medical_cert BOOLEAN NOT NULL DEFAULT FALSE,
        has_criminal_record BOOLEAN NOT NULL DEFAULT FALSE,
        has_photos BOOLEAN NOT NULL DEFAULT FALSE,
        has_education_cert BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'submitted',
        admin_notes TEXT,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        stripe_session_id TEXT,
        stripe_payment_intent_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE work_permits
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
        ADD COLUMN IF NOT EXISTS payment_method TEXT,
        ADD COLUMN IF NOT EXISTS receipt_url TEXT,
        ADD COLUMN IF NOT EXISTS receipt_filename TEXT,
        ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS payment_reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;
    `);

    await client.query(`
      ALTER TABLE work_permits
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applicant_users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } finally {
    client.release();
  }
}
