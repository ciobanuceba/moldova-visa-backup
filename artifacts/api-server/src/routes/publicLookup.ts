import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db, workPermitsTable, applicationsTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
function offerReference(app: { firstName:string; lastName:string; jobTitle:string; location:string; salary:string; startDate?:string|null }): string { return `MVA-APP-${createHash("sha256").update([`${app.firstName} ${app.lastName}`,app.jobTitle,app.location,app.salary,app.startDate||""].join("|")).digest("hex").slice(0,10).toUpperCase()}`; }
function visaReference(app: { firstName:string; lastName:string; passportNumber:string; visaType:string; travelDate:string }): string { return `MVA-VISA-${createHash("sha256").update([app.firstName,app.lastName,app.passportNumber,app.visaType,app.travelDate].join("|")).digest("hex").slice(0,10).toUpperCase()}`; }
router.get("/public/applications/:referenceNumber", async (req,res):Promise<void> => {
  const referenceNumber=String(req.params.referenceNumber||"").trim().toUpperCase();
  if(!/^(?:MVA-(?:\d{4}-[A-F0-9]{6}|APP-[A-F0-9]{10}|VISA-[A-F0-9]{10})|MIG-\d{4}-\d{6})$/.test(referenceNumber)){ res.status(400).json({error:"Invalid reference number"}); return; }
  try {
    if(referenceNumber.startsWith("MVA-VISA-")){
      const rows=await db.select({ referenceNumber:applicationsTable.referenceNumber, firstName:applicationsTable.firstName,lastName:applicationsTable.lastName,passportNumber:applicationsTable.passportNumber,coverLetter:applicationsTable.coverLetter,status:applicationsTable.status,createdAt:applicationsTable.createdAt }).from(applicationsTable).where(eq(applicationsTable.jobId,0));
      const app=rows.find(row=>{ try { const d=JSON.parse(row.coverLetter||"{}"); return d.type==="visa" && visaReference({firstName:row.firstName,lastName:row.lastName,passportNumber:row.passportNumber||"",visaType:d.visaType||"",travelDate:d.travelDate||""})===referenceNumber; } catch { return false; } });
      if(!app){res.status(404).json({error:"Visa application not found"});return;}
      const d=JSON.parse(app.coverLetter||"{}"); const status=app.status||"pending"; const publicStatus=status==="pending"?"received":status;
      res.json({found:true,application:{referenceNumber:app.referenceNumber||referenceNumber,applicantName:`${app.firstName} ${app.lastName.slice(0,1)}.`,jobTitle:`${d.visaType||"Visa"} — ${d.destination||""}`,location:d.destination||"—",startDate:d.travelDate||undefined,status:publicStatus,createdAt:app.createdAt}}); return;
    }
    if(referenceNumber.startsWith("MVA-APP-")){
      const rows=await db.select({referenceNumber:applicationsTable.referenceNumber,firstName:applicationsTable.firstName,lastName:applicationsTable.lastName,jobTitle:jobsTable.title,location:jobsTable.location,salary:jobsTable.salary,availableFrom:applicationsTable.availableFrom,status:applicationsTable.status,createdAt:applicationsTable.createdAt,employerLogoData:applicationsTable.employerLogoData}).from(applicationsTable).leftJoin(jobsTable,eq(jobsTable.id,applicationsTable.jobId));
      const app=rows.find(row=>row.referenceNumber===referenceNumber || (row.jobTitle&&row.location&&row.salary&&offerReference({firstName:row.firstName,lastName:row.lastName,jobTitle:row.jobTitle,location:row.location,salary:row.salary,startDate:row.availableFrom})===referenceNumber));
      if(!app){res.status(404).json({error:"Application not found"});return;}
      const publicStatus=app.status==="approved"?"Approved":app.status==="rejected"?"Rejected":app.status==="pending"?"Received":"Under Review";
      res.json({found:true,application:{referenceNumber,applicantName:`${app.firstName} ${app.lastName.slice(0,1)}.`,jobTitle:app.jobTitle,location:app.location,salary:app.salary,startDate:app.availableFrom,status:publicStatus,createdAt:app.createdAt}}); return;
    }
    const [permit]=await db.select({referenceNumber:workPermitsTable.referenceNumber,firstName:workPermitsTable.firstName,lastName:workPermitsTable.lastName,email:workPermitsTable.email,phone:workPermitsTable.phone,nationality:workPermitsTable.nationality,dateOfBirth:workPermitsTable.dateOfBirth,passportNumber:workPermitsTable.passportNumber,passportExpiry:workPermitsTable.passportExpiry,currentAddress:workPermitsTable.currentAddress,jobTitle:workPermitsTable.jobTitle,permitType:workPermitsTable.permitType,jobSalary:workPermitsTable.jobSalary,employerName:workPermitsTable.employerName,companyName:workPermitsTable.companyName,employerCountry:workPermitsTable.employerCountry,startDate:workPermitsTable.startDate,contractDuration:workPermitsTable.contractDuration,employerLogoData:workPermitsTable.employerLogoData,status:workPermitsTable.status,paymentStatus:workPermitsTable.paymentStatus,paymentMethod:workPermitsTable.paymentMethod,adminNotes:workPermitsTable.adminNotes,passportCopyData:workPermitsTable.passportCopyData,photoData:workPermitsTable.photoData,medicalCertData:workPermitsTable.medicalCertData,criminalRecordData:workPermitsTable.criminalRecordData,createdAt:workPermitsTable.createdAt}).from(workPermitsTable).where(eq(workPermitsTable.referenceNumber,referenceNumber)).limit(1);
    if(!permit){res.status(404).json({error:"Application not found"});return;}
    const publicStatus=permit.status;
    res.json({found:true,application:{referenceNumber:permit.referenceNumber,applicantName:`${permit.firstName} ${permit.lastName}`,firstName:permit.firstName,lastName:permit.lastName,email:permit.email,phone:permit.phone,nationality:permit.nationality,dateOfBirth:permit.dateOfBirth,passportNumber:permit.passportNumber,passportExpiry:permit.passportExpiry,currentAddress:permit.currentAddress,jobTitle:permit.jobTitle,employerName:permit.employerName,companyName:permit.companyName,employerCountry:permit.employerCountry,startDate:permit.startDate,contractDuration:permit.contractDuration,permitType:permit.permitType,jobSalary:permit.jobSalary,paymentStatus:permit.paymentStatus,paymentMethod:permit.paymentMethod,employerLogo:permit.employerLogoData,adminNotes:permit.adminNotes,documents:{passportCopy:permit.passportCopyData,photo:permit.photoData,medicalCertificate:permit.medicalCertData,criminalRecord:permit.criminalRecordData},status:publicStatus,createdAt:permit.createdAt}});
  }catch(error){ console.error("Public application lookup failed",error); res.status(500).json({error:"Unable to check application right now"}); }
});
export default router;
