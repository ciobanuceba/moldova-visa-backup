import { Router, type IRouter } from "express";
import { randomBytes } from "crypto";
import { db, workPermitsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";
import { generateOfferLetterPdf } from "../lib/pdf";

const router: IRouter = Router();
router.use("/admin/manual", requireAdmin);

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function manualReference(): string {
  return `MVA-MAN-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

// Manual Job Offer: generates the existing Job Offer PDF only. No existing application is changed.
router.post("/admin/manual/job-offer", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const applicantName = text(body.applicantName);
  const jobTitle = text(body.jobTitle);
  const location = text(body.location);
  const salary = text(body.salary);
  if (!applicantName || !jobTitle || !location || !salary) {
    res.status(400).json({ error: "Applicant name, position, location and salary are required" });
    return;
  }

  try {
    const pdf = await generateOfferLetterPdf({
      applicantName,
      jobTitle,
      location,
      salary,
      startDate: text(body.startDate) || undefined,
      employerName: text(body.employerName, "MOLDOVA VISA ASSIST SRL"),
      adminNotes: text(body.adminNotes) || undefined,
      referenceNumber: text(body.referenceNumber, manualReference()),
      applicationDate: text(body.applicationDate) || new Date().toISOString(),
      email: text(body.email) || undefined,
      phone: text(body.phone) || undefined,
      nationality: text(body.nationality) || undefined,
      dateOfBirth: text(body.dateOfBirth) || undefined,
      passportNumber: text(body.passportNumber) || undefined,
      yearsExperience: text(body.yearsExperience) || undefined,
      skills: text(body.skills) || undefined,
      languages: text(body.languages) || undefined,
      experience: text(body.experience) || undefined,
      coverLetter: text(body.coverLetter) || undefined,
      resumeUrl: text(body.resumeUrl) || undefined,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Manual_Job_Offer_${Date.now()}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error("Manual Job Offer generation failed", err);
    res.status(500).json({ error: "Failed to generate Job Offer PDF" });
  }
});

// Manual Work Permit entry: creates a normal work_permits row and leaves the existing PDF/actions untouched.
router.post("/admin/manual/work-permit", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const required = [
    "firstName", "lastName", "email", "phone", "nationality", "dateOfBirth",
    "passportNumber", "passportExpiry", "currentAddress", "permitType",
    "employerName", "employerCountry", "jobTitle", "jobSalary", "startDate", "contractDuration",
  ];
  for (const field of required) {
    if (!text(body[field])) {
      res.status(400).json({ error: `Missing required field: ${field}` });
      return;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(body.email))) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const referenceNumber = manualReference();
    const [permit] = await db.insert(workPermitsTable).values({
      referenceNumber,
      firstName: text(body.firstName),
      lastName: text(body.lastName),
      email: text(body.email).toLowerCase(),
      phone: text(body.phone),
      nationality: text(body.nationality),
      dateOfBirth: text(body.dateOfBirth),
      passportNumber: text(body.passportNumber),
      passportExpiry: text(body.passportExpiry),
      currentAddress: text(body.currentAddress),
      permitType: text(body.permitType),
      employerName: text(body.employerName),
      employerCountry: text(body.employerCountry),
      jobTitle: text(body.jobTitle),
      jobSalary: text(body.jobSalary),
      startDate: text(body.startDate),
      contractDuration: text(body.contractDuration),
      hasPassport: Boolean(body.hasPassport),
      hasJobOffer: Boolean(body.hasJobOffer),
      hasMedicalCert: Boolean(body.hasMedicalCert),
      hasCriminalRecord: Boolean(body.hasCriminalRecord),
      hasPhotos: Boolean(body.hasPhotos),
      hasEducationCert: Boolean(body.hasEducationCert),
      status: "submitted",
      paymentStatus: "unpaid",
      adminNotes: text(body.adminNotes) || null,
    }).returning();

    res.status(201).json({ success: true, permit });
  } catch (err) {
    console.error("Manual Work Permit creation failed", err);
    res.status(500).json({ error: "Failed to create manual Work Permit application" });
  }
});

export default router;
