import { Router, type IRouter } from "express";
import { db, workPermitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Public reference lookup. Never return passport, email, phone, address, payment,
// admin notes, or other private application data.
router.get("/public/applications/:referenceNumber", async (req, res): Promise<void> => {
  const referenceNumber = String(req.params.referenceNumber || "").trim().toUpperCase();

  if (!/^MVA-\d{4}-[A-F0-9]{6}$/.test(referenceNumber)) {
    res.status(400).json({ error: "Invalid reference number" });
    return;
  }

  try {
    const [permit] = await db
      .select({
        referenceNumber: workPermitsTable.referenceNumber,
        firstName: workPermitsTable.firstName,
        lastName: workPermitsTable.lastName,
        jobTitle: workPermitsTable.jobTitle,
        employerName: workPermitsTable.employerName,
        employerCountry: workPermitsTable.employerCountry,
        startDate: workPermitsTable.startDate,
        contractDuration: workPermitsTable.contractDuration,
        status: workPermitsTable.status,
        createdAt: workPermitsTable.createdAt,
      })
      .from(workPermitsTable)
      .where(eq(workPermitsTable.referenceNumber, referenceNumber))
      .limit(1);

    if (!permit) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const status = permit.status;
    const publicStatus = status === "approved" ? "Approved" :
      status === "rejected" ? "Rejected" :
      status === "submitted" ? "Under Review" :
      status === "pending_payment" ? "Payment Pending" : "Received";

    res.json({
      found: true,
      application: {
        referenceNumber: permit.referenceNumber,
        applicantName: `${permit.firstName} ${permit.lastName.slice(0, 1)}.`,
        jobTitle: permit.jobTitle,
        employerName: permit.employerName,
        employerCountry: permit.employerCountry,
        startDate: permit.startDate,
        contractDuration: permit.contractDuration,
        status: publicStatus,
        createdAt: permit.createdAt,
      },
    });
  } catch (error) {
    console.error("Public application lookup failed", error);
    res.status(500).json({ error: "Unable to check application right now" });
  }
});

export default router;
