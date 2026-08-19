import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail, applicationReceivedEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function sanitizeString(val: unknown): string | null {
  if (typeof val !== "string" || !val.trim()) return null;
  return val.trim();
}
function getApplicationReference(app: { firstName:string; lastName:string; jobTitle:string; location:string; salary:string; startDate?:string|null }): string {
  const applicantName = `${app.firstName} ${app.lastName}`;
  const digest = createHash("sha256").update([applicantName,app.jobTitle,app.location,app.salary,app.startDate||""].join("|")).digest("hex").slice(0,10).toUpperCase();
  return `MVA-APP-${digest}`;
}

router.get("/applications", async (_req,res):Promise<void> => {
  try {
    const apps = await db.select().from(applicationsTable).orderBy(applicationsTable.createdAt);
    res.json(apps.map(a=>({...a,createdAt:a.createdAt.toISOString()})));
  } catch(err) {
    logger.error({err},"Failed to fetch applications");
    res.status(500).json({error:"Failed to fetch applications"});
  }
});

router.post("/applications", async (req,res):Promise<void> => {
  const body=req.body;
  logger.info({body},"Incoming application request body");
  const jobId=Number(body.jobId);
  if(!Number.isInteger(jobId)||jobId<0){res.status(400).json({error:"jobId must be a non-negative integer"});return;}

  const firstName=sanitizeString(body.firstName), lastName=sanitizeString(body.lastName), email=sanitizeString(body.email), phone=sanitizeString(body.phone);
  if(!firstName){res.status(400).json({error:"firstName is required"});return;}
  if(!lastName){res.status(400).json({error:"lastName is required"});return;}
  if(!email){res.status(400).json({error:"email is required"});return;}
  if(!phone){res.status(400).json({error:"phone is required"});return;}
  if(!isValidEmail(email)){res.status(400).json({error:"Invalid email address"});return;}

  const nationality=sanitizeString(body.nationality), dateOfBirth=sanitizeString(body.dateOfBirth), passportNumber=sanitizeString(body.passportNumber);
  const yearsExperience=sanitizeString(body.yearsExperience), skills=sanitizeString(body.skills), languages=sanitizeString(body.languages);
  const availableFrom=sanitizeString(body.availableFrom), resumeUrl=sanitizeString(body.resumeUrl), coverLetter=sanitizeString(body.coverLetter), experience=sanitizeString(body.experience);

  let app;
  try {
    const [insertedApp]=await db.insert(applicationsTable).values({jobId,firstName,lastName,email,phone,nationality,dateOfBirth,passportNumber,yearsExperience,skills,languages,availableFrom,resumeUrl,coverLetter,experience,status:"pending"}).returning();
    app=insertedApp;
    logger.info({appId:app.id},"Application successfully saved to database");
  } catch(dbError) {
    logger.error({err:dbError},"Database insertion failed!");
    res.status(500).json({error:"Database save failed. Please check server logs."});
    return;
  }

  let jobTitle=sanitizeString(body.jobTitle)??"your applied position";
  let location=sanitizeString(body.location)??"Europe";
  let salary=sanitizeString(body.salary)??"As discussed";
  if(jobId>0){
    const [job]=await db.select({title:jobsTable.title,location:jobsTable.location,salary:jobsTable.salary}).from(jobsTable).where(eq(jobsTable.id,jobId)).limit(1);
    if(!job){res.status(400).json({error:"Selected job no longer exists"});return;}
    jobTitle=job.title; location=job.location; salary=job.salary;
  }
  const referenceNumber=getApplicationReference({firstName,lastName,jobTitle,location,salary,startDate:availableFrom});

  sendEmail({to:email,subject:`Application Received — ${jobTitle} [${referenceNumber}]`,html:`${applicationReceivedEmail(firstName,jobTitle)}<p style="font-family:Arial,sans-serif"><strong>Reference number:</strong> ${referenceNumber}</p>`})
    .then(()=>logger.info({to:email,referenceNumber},"User confirmation email sent successfully"))
    .catch(err=>logger.error({err},"Failed to send user confirmation email"));

  const adminEmail=process.env.ADMIN_EMAIL;
  if(adminEmail){
    const adminHtml=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><div style="background:#1a2744;padding:20px;text-align:center;color:white"><h2 style="margin:0">New Job Application Submitted</h2><p style="margin:6px 0 0">Reference: ${referenceNumber}</p></div><div style="padding:24px;background:#fff;color:#374151;line-height:1.6"><p><strong>Applicant:</strong> ${firstName} ${lastName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Position:</strong> ${jobTitle}</p><p><strong>Location:</strong> ${location}</p><p><strong>Salary:</strong> ${salary}</p><p><strong>Experience:</strong> ${yearsExperience||"N/A"}</p>${resumeUrl?`<p><a href="${resumeUrl}" target="_blank">View submitted resume</a></p>`:""}</div></div>`;
    sendEmail({to:adminEmail,subject:`🚨 New Job Application: ${firstName} ${lastName} [${referenceNumber}]`,html:adminHtml})
      .then(()=>logger.info({to:adminEmail,referenceNumber},"Admin notification email sent successfully"))
      .catch(err=>logger.error({err},"Failed to send admin notification email"));
  } else logger.warn("ADMIN_EMAIL is not set in Secrets. Admin notification email skipped.");

  res.status(201).json({...app,referenceNumber,createdAt:app.createdAt.toISOString()});
});

export default router;
