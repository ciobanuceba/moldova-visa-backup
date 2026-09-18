import { Router, type IRouter } from "express";
import { randomBytes, createHash } from "crypto";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
router.use("/admin", requireAdmin);
const selectFields = `id, reference_number, first_name, last_name, email, phone, nationality, date_of_birth, passport_number, passport_expiry, current_address, permit_type, employer_name, employer_country, job_title, job_salary, start_date, contract_duration, has_passport, has_job_offer, has_medical_cert, has_criminal_record, has_photos, has_education_cert, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, status, payment_status, payment_method, receipt_url, receipt_filename, payment_rejection_reason, admin_notes, created_at`;
function text(v: unknown, fallback = ""): string { return typeof v === "string" && v.trim() ? v.trim() : fallback; }
function dataUrl(v: unknown): string | null { return typeof v === "string" && v.startsWith("data:") && v.includes(";base64,") && v.length <= 4_000_000 ? v : null; }
function newReference(): string { return `MVA-ADM-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`; }
function offerReference(app: { firstName:string; lastName:string; jobTitle:string; location:string; salary:string; startDate?:string|null }): string { return `MVA-APP-${createHash("sha256").update([`${app.firstName} ${app.lastName}`,app.jobTitle,app.location,app.salary,app.startDate||""].join("|")).digest("hex").slice(0,10).toUpperCase()}`; }

router.get("/admin/file-search/:referenceNumber", async (req, res): Promise<void> => {
  const referenceNumber = text(req.params.referenceNumber).toUpperCase();
  if (!referenceNumber) { res.status(400).json({ error: "File Number is required" }); return; }
  const { rows } = await pool.query(`SELECT ${selectFields} FROM work_permits WHERE reference_number = $1 LIMIT 1`, [referenceNumber]);
  if (rows.length) { res.json({ application: rows[0], sourceType: "work_permit" }); return; }
  if (referenceNumber.startsWith("MVA-APP-")) {
    const { rows: apps } = await pool.query(`SELECT a.id, a.first_name, a.last_name, a.email, a.phone, a.nationality, a.date_of_birth, a.passport_number, a.available_from, a.status, a.admin_notes, a.passport_copy_data, a.photo_data, a.medical_cert_data, a.criminal_record_data, a.created_at, j.title AS job_title, j.salary AS job_salary, j.location AS location, j.id AS job_id FROM applications a LEFT JOIN jobs j ON j.id = a.job_id`);
    const app = apps.find((row:any) => row.job_title && row.location && row.job_salary && offerReference({firstName:row.first_name,lastName:row.last_name,jobTitle:row.job_title,location:row.location,salary:row.job_salary,startDate:row.available_from}) === referenceNumber);
    if (app) {
      res.json({ application: {
        id: app.id, reference_number: referenceNumber, first_name: app.first_name, last_name: app.last_name, email: app.email, phone: app.phone,
        nationality: app.nationality, date_of_birth: app.date_of_birth, passport_number: app.passport_number, passport_expiry: "",
        current_address: "", permit_type: "Job Application", employer_name: "", employer_country: "Moldova",
        job_title: app.job_title, job_salary: app.job_salary, start_date: app.available_from, contract_duration: "",
        status: app.status, admin_notes: app.admin_notes, payment_status: "unpaid", payment_method: "",
        passport_copy_data: app.passport_copy_data, photo_data: app.photo_data, medical_cert_data: app.medical_cert_data,
        criminal_record_data: app.criminal_record_data, source_type: "application", job_id: app.job_id, created_at: app.created_at
      }, sourceType: "application" }); return;
    }
  }
  res.status(404).json({ error: "Application not found" });
});

router.post("/admin/file-search", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const referenceNumber = text(b.referenceNumber, newReference()).toUpperCase();
  const required = ["firstName","lastName","email","phone","nationality","dateOfBirth","passportNumber","passportExpiry","currentAddress","permitType","employerName","employerCountry","jobTitle","jobSalary","startDate","contractDuration"];
  for (const field of required) if (!text(b[field])) { res.status(400).json({ error: `Missing required field: ${field}` }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(b.email))) { res.status(400).json({ error: "Invalid email address" }); return; }
  const docs = { passportCopyData: dataUrl(b.passportCopyData), photoData: dataUrl(b.photoData), medicalCertData: dataUrl(b.medicalCertData), criminalRecordData: dataUrl(b.criminalRecordData) };
  try {
    const { rows } = await pool.query(`INSERT INTO work_permits (reference_number, first_name, last_name, email, phone, nationality, date_of_birth, passport_number, passport_expiry, current_address, permit_type, employer_name, employer_country, job_title, job_salary, start_date, contract_duration, has_passport, has_job_offer, has_medical_cert, has_criminal_record, has_photos, has_education_cert, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, status, payment_status, payment_method, admin_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) RETURNING ${selectFields}`, [referenceNumber,text(b.firstName),text(b.lastName),text(b.email).toLowerCase(),text(b.phone),text(b.nationality),text(b.dateOfBirth),text(b.passportNumber),text(b.passportExpiry),text(b.currentAddress),text(b.permitType),text(b.employerName),text(b.employerCountry),text(b.jobTitle),text(b.jobSalary),text(b.startDate),text(b.contractDuration),Boolean(b.hasPassport),Boolean(b.hasJobOffer),Boolean(b.hasMedicalCert),Boolean(b.hasCriminalRecord),Boolean(b.hasPhotos),Boolean(b.hasEducationCert),docs.passportCopyData,docs.photoData,docs.medicalCertData,docs.criminalRecordData,text(b.status,"submitted"),text(b.paymentStatus,"unpaid"),text(b.paymentMethod)||null,text(b.adminNotes)||null]);
    res.status(201).json({ success: true, application: rows[0] });
  } catch (err: any) { if (err?.code === "23505") res.status(409).json({ error: "That File Number already exists" }); else { console.error(err); res.status(500).json({ error: "Failed to create file" }); } }
});

router.patch("/admin/file-search/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const b = req.body ?? {};
  const map: Record<string,string> = { referenceNumber:"reference_number", firstName:"first_name", lastName:"last_name", email:"email", phone:"phone", nationality:"nationality", dateOfBirth:"date_of_birth", passportNumber:"passport_number", passportExpiry:"passport_expiry", currentAddress:"current_address", permitType:"permit_type", employerName:"employer_name", employerCountry:"employer_country", jobTitle:"job_title", jobSalary:"job_salary", startDate:"start_date", contractDuration:"contract_duration", hasPassport:"has_passport", hasJobOffer:"has_job_offer", hasMedicalCert:"has_medical_cert", hasCriminalRecord:"has_criminal_record", hasPhotos:"has_photos", hasEducationCert:"has_education_cert", passportCopyData:"passport_copy_data", photoData:"photo_data", medicalCertData:"medical_cert_data", criminalRecordData:"criminal_record_data", status:"status", paymentStatus:"payment_status", paymentMethod:"payment_method", adminNotes:"admin_notes", paymentRejectionReason:"payment_rejection_reason" };
  const clauses:string[]=[]; const values:unknown[]=[]; let i=1;
  for (const [key,column] of Object.entries(map)) if (b[key] !== undefined) { clauses.push(`${column} = $${i++}`); if (["hasPassport","hasJobOffer","hasMedicalCert","hasCriminalRecord","hasPhotos","hasEducationCert"].includes(key)) values.push(Boolean(b[key])); else if (["passportCopyData","photoData","medicalCertData","criminalRecordData"].includes(key)) values.push(b[key] === null || b[key] === "" ? null : dataUrl(b[key])); else values.push(b[key] === null ? null : text(b[key])); }
  if (!clauses.length) { res.status(400).json({ error: "No fields to update" }); return; }
  values.push(id);
  try { const {rows}=await pool.query(`UPDATE work_permits SET ${clauses.join(", ")} WHERE id = $${i} RETURNING ${selectFields}`,values); if(!rows.length){res.status(404).json({error:"Application not found"});return;} res.json({success:true,application:rows[0]}); }
  catch(err:any){ if(err?.code==="23505") res.status(409).json({error:"That File Number already exists"}); else {console.error(err);res.status(500).json({error:"Could not save changes"});} }
});

router.patch("/admin/file-search/application/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const b = req.body ?? {};
  const map: Record<string,string> = { firstName:"first_name", lastName:"last_name", email:"email", phone:"phone", nationality:"nationality", dateOfBirth:"date_of_birth", passportNumber:"passport_number", startDate:"available_from", status:"status", adminNotes:"admin_notes", passportCopyData:"passport_copy_data", photoData:"photo_data", medicalCertData:"medical_cert_data", criminalRecordData:"criminal_record_data" };
  const clauses:string[]=[]; const values:unknown[]=[]; let i=1;
  for (const [key,column] of Object.entries(map)) if (b[key] !== undefined) {
    clauses.push(column + " = $" + i++);
    if (["passportCopyData","photoData","medicalCertData","criminalRecordData"].includes(key)) values.push(b[key] === null || b[key] === "" ? null : dataUrl(b[key]));
    else values.push(b[key] === null ? null : text(b[key]));
  }
  if (!clauses.length) { res.status(400).json({ error: "No fields to update" }); return; }
  values.push(id);
  try {
    const { rows } = await pool.query("UPDATE applications SET " + clauses.join(", ") + " WHERE id = $" + i + " RETURNING id, first_name, last_name, email, phone, nationality, date_of_birth, passport_number, available_from, status, admin_notes, passport_copy_data, photo_data, medical_cert_data, criminal_record_data, created_at", values);
    if (!rows.length) { res.status(404).json({ error: "Application not found" }); return; }
    const a = rows[0];
    res.json({ success:true, application:{...a, reference_number: `MVA-APP-${offerReference({firstName:a.first_name,lastName:a.last_name,jobTitle:"",location:"",salary:"",startDate:a.available_from}).slice(8)}`, source_type:"application"} });
  } catch(err) { console.error(err); res.status(500).json({error:"Could not save changes"}); }
});
export default router;
