import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import visaApplicationsRouter from "./visaApplications";
import contactsRouter from "./contacts";
import statsRouter from "./stats";
import workPermitsRouter from "./workPermits";
import uploadRouter from "./upload";
import authRouter from "./auth";
import adminRouter from "./admin";
import adminManualRouter from "./adminManual";
import applicantRouter from "./applicant";
import paymentsRouter from "./payments";
import publicLookupRouter from "./publicLookup";

const router: IRouter = Router();
router.use(healthRouter); router.use(authRouter); router.use(jobsRouter); router.use(applicationsRouter); router.use(visaApplicationsRouter); router.use(contactsRouter); router.use(statsRouter); router.use(workPermitsRouter); router.use(uploadRouter); router.use(adminRouter); router.use(adminManualRouter); router.use(applicantRouter); router.use(paymentsRouter); router.use(publicLookupRouter);
export default router;
