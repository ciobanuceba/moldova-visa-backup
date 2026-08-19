import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db, workPermitsTable, applicationsTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function offerReference(app: { firstName:string; lastName:string; jobTitle:string; location:string; salary:string; startDate?:string|null }): string {
  const name = `${app.firstName} ${app.lastName}`;
  return `MVA-APP-${createHash("sha256").update([name,app.jobTitle,app.location,app.salary,app.startDate||""].join("|")).digest("hex").slice(0,10).toUpperCase()}`;
}

router.get("/public/applications/:referenceNumber", async (req,res):Promise<void> => {
  const referenceNumber=String(req.params.referenceNumber||"").trim().toUpperCase();
  if(!/^MVA-(?:\d{4}-[A-F0-9]{6}|APP-[A-F0-9]{10})$/.test(referenceNumber)){
    res.status(400).json({error:"Invalid reference number"}); return;
  }
  try {
    if(referenceNumber.startsWith("MVA-APP-")){
      const rows=await db.select({
        firstName:applicationsTable.firstName,
        lastName:applicationsTable.lastName,
        jobTitle:jobsTable.title,
        location:jobsTable.location,
        salary:jobsTable.salary,
        availableFrom:applicationsTable.availableFrom,
        status:applicationsTable.status,
        createdAt:applicationsTable.createdAt,
      }).from(applicationsTable).leftJoin(jobsTable,eq(jobsTable.id,applicationsTable.jobId));

      const app=rows.find((row)=>{
        if(!row.jobTitle||!row.location||!row.salary) return false;
        return offerReference({firstName:row.firstName,lastName:row.lastName,jobTitle:row.jobTitle,location:row.location,salary:row.salary,startDate:row.availableFrom})===referenceNumber;
      });
      if(!app){res.status(404).json({error:"Application not found"});return;}
      const publicStatus=app.status==="approved"?"Approved":app.status==="rejected"?"Rejected":app.status==="pending"?"Received":"Under Review";
      res.json({found:true,application:{referenceNumber,applicantName:`${app.firstName} ${app.lastName.slice(0,1)}.`,jobTitle:app.jobTitle,location:app.location,salary:app.salary,startDate:app.availableFrom,status:publicStatus,createdAt:app.createdAt}});
      return;
    }

    const [permit]=await db.select({
      referenceNumber:workPermitsTable.referenceNumber,
      firstName:workPermitsTable.firstName,
      lastName:workPermitsTable.lastName,
      jobTitle:workPermitsTable.jobTitle,
      employerName:workPermitsTable.employerName,
      employerCountry:workPermitsTable.employerCountry,
      startDate:workPermitsTable.startDate,
      contractDuration:workPermitsTable.contractDuration,
      status:workPermitsTable.status,
      createdAt:workPermitsTable.createdAt,
    }).from(workPermitsTable).where(eq(workPermitsTable.referenceNumber,referenceNumber)).limit(1);
    if(!permit){res.status(404).json({error:"Application not found"});return;}
    const publicStatus=permit.status==="approved"?"Approved":permit.status==="rejected"?"Rejected":permit.status==="submitted"?"Under Review":permit.status==="pending_payment"?"Payment Pending":"Received";
    res.json({found:true,application:{referenceNumber:permit.referenceNumber,applicantName:`${permit.firstName} ${permit.lastName.slice(0,1)}.`,jobTitle:permit.jobTitle,employerName:permit.employerName,employerCountry:permit.employerCountry,startDate:permit.startDate,contractDuration:permit.contractDuration,status:publicStatus,createdAt:permit.createdAt}});
  }catch(error){
    console.error("Public application lookup failed",error);
    res.status(500).json({error:"Unable to check application right now"});
  }
});

export default router;
