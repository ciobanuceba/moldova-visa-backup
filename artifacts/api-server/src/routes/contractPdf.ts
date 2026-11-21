import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdmin } from "../middleware/requireAdmin";
import { randomBytes } from "node:crypto";

const router = Router();
const PRICE_BDT = 3000;

// Public: submit Nagad transaction for the fixed-price contract PDF.
router.post("/contract-pdf/orders", async (req, res): Promise<void> => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const referenceNumber = String(req.body?.referenceNumber || "").trim().toUpperCase();
  const transactionId = String(req.body?.transactionId || "").trim();
  if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^MVA-[A-Z0-9-]{4,32}$/.test(referenceNumber) || !/^[a-zA-Z0-9-]{5,80}$/.test(transactionId)) {
    res.status(400).json({ error: "Enter your full name, valid email, Work Permit Reference Number and Nagad Transaction ID." }); return;
  }
  try {
    const permit = await pool.query("SELECT reference_number FROM work_permits WHERE reference_number = $1 AND LOWER(email) = $2", [referenceNumber, email]);
    if (!permit.rows.length) { res.status(400).json({ error: "The Reference Number and email do not match a Work Permit record." }); return; }
    const { rows } = await pool.query(
      `INSERT INTO contract_pdf_orders (customer_name, customer_email, reference_number, nagad_transaction_id, amount_bdt)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, status, created_at, reference_number`,
      [name, email, referenceNumber, transactionId, PRICE_BDT]
    );
    res.status(201).json({ success: true, order: rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") { res.status(409).json({ error: "This Transaction ID has already been submitted." }); return; }
    res.status(500).json({ error: "Could not submit your payment for review." });
  }
});

// Admin-only order queue and review actions.
router.get("/admin/contract-pdf/orders", requireAdmin, async (_req, res): Promise<void> => {
  const { rows } = await pool.query(`SELECT o.id, o.customer_name, o.customer_email, o.reference_number, o.nagad_transaction_id, o.amount_bdt, o.status, o.admin_note, o.created_at, o.reviewed_at, (d.reference_number IS NOT NULL) AS document_uploaded FROM contract_pdf_orders o LEFT JOIN contract_pdf_documents d ON d.reference_number = o.reference_number ORDER BY o.created_at DESC`);
  res.json(rows);
});

router.post("/admin/contract-pdf/orders/:id/document", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const fileName = String(req.body?.fileName || "Employment-Contract.pdf").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const encoded = String(req.body?.pdfBase64 || "");
  if (!Number.isInteger(id) || id < 1 || !encoded || encoded.length > 11_000_000) { res.status(400).json({ error: "A valid order and PDF file (max 8 MB) are required." }); return; }
  const pdfBuffer = Buffer.from(encoded, "base64");
  if (pdfBuffer.length < 8 || pdfBuffer.length > 8 * 1024 * 1024 || pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") { res.status(400).json({ error: "The uploaded file is not a valid PDF." }); return; }
  const { rows } = await pool.query("SELECT reference_number FROM contract_pdf_orders WHERE id = $1", [id]);
  if (!rows.length || !rows[0].reference_number) { res.status(404).json({ error: "This order has no linked Reference Number." }); return; }
  await pool.query(`INSERT INTO contract_pdf_documents (reference_number, file_name, pdf_data) VALUES ($1, $2, $3) ON CONFLICT (reference_number) DO UPDATE SET file_name = EXCLUDED.file_name, pdf_data = EXCLUDED.pdf_data, uploaded_at = NOW()`, [rows[0].reference_number, fileName, pdfBuffer]);
  res.json({ success: true, referenceNumber: rows[0].reference_number });
});

router.patch("/admin/contract-pdf/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  const note = String(req.body?.note || "").trim().slice(0, 1000);
  if (!Number.isInteger(id) || id < 1 || !["approved", "rejected"].includes(status)) { res.status(400).json({ error: "Invalid order review." }); return; }
  if (status === "approved") {
    const { rows: pending } = await pool.query("SELECT reference_number FROM contract_pdf_orders WHERE id = $1 AND status = 'pending'", [id]);
    if (!pending.length) { res.status(404).json({ error: "Pending order not found." }); return; }
    if (pending[0].reference_number) {
      const doc = await pool.query("SELECT 1 FROM contract_pdf_documents WHERE reference_number = $1", [pending[0].reference_number]);
      if (!doc.rows.length) { res.status(409).json({ error: "Upload the matching applicant PDF before approving this order." }); return; }
    }
  }
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET status = $1, admin_note = $2, reviewed_at = NOW() WHERE id = $3 AND status = 'pending' RETURNING id, status`,
    [status, note || null, id]
  );
  if (!rows.length) { res.status(404).json({ error: "Pending order not found." }); return; }
  res.json({ success: true, order: rows[0] });
});

// Customer may check only their own order using order ID and email.
router.get("/contract-pdf/orders/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!Number.isInteger(id) || id < 1 || !email) { res.status(400).json({ error: "Order ID and email are required." }); return; }
  const { rows } = await pool.query(
    `SELECT id, status, amount_bdt, admin_note, reference_number FROM contract_pdf_orders WHERE id = $1 AND customer_email = $2`,
    [id, email]
  );
  if (!rows.length) { res.status(404).json({ error: "Order not found." }); return; }
  res.json(rows[0]);
});

// Approved orders only receive a short-lived, single-use download token.
router.post("/contract-pdf/orders/:id/download-token", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!Number.isInteger(id) || id < 1 || !email) { res.status(400).json({ error: "Order ID and email are required." }); return; }
  const token = randomBytes(32).toString("hex");
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET download_token = $1, download_token_expires_at = NOW() + INTERVAL '15 minutes'
     WHERE id = $2 AND customer_email = $3 AND status = 'approved'
     RETURNING id`, [token, id, email]
  );
  if (!rows.length) { res.status(403).json({ error: "Payment approval could not be verified." }); return; }
  res.json({ downloadUrl: `/api/contract-pdf/download/${token}` });
});
router.get("/contract-pdf/download/:token", async (req, res): Promise<void> => {
  const token = String(req.params.token || "");
  const { rows } = await pool.query(
    `UPDATE contract_pdf_orders SET download_token = NULL, download_token_expires_at = NULL
     WHERE download_token = $1 AND download_token_expires_at > NOW() AND status = 'approved'
     RETURNING id, reference_number`, [token]
  );
  if (!rows.length) { res.status(403).json({ error: "This download link is invalid or expired." }); return; }
  let pdfBuffer: Buffer;
  let downloadName = "Employment-Contract.pdf";
  if (rows[0].reference_number) {
    const doc = await pool.query("SELECT file_name, pdf_data FROM contract_pdf_documents WHERE reference_number = $1", [rows[0].reference_number]);
    if (!doc.rows.length) { res.status(503).json({ error: "The applicant's document is temporarily unavailable." }); return; }
    pdfBuffer = doc.rows[0].pdf_data as Buffer;
    downloadName = doc.rows[0].file_name;
  } else {
    const encodedPdf = process.env.CONTRACT_PDF_BASE64;
    if (!encodedPdf) { res.status(503).json({ error: "The document is temporarily unavailable." }); return; }
    pdfBuffer = Buffer.from(encodedPdf, "base64");
  }
  if (pdfBuffer.length < 8 || pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") { res.status(503).json({ error: "The document is temporarily unavailable." }); return; }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(pdfBuffer.length));
  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  res.setHeader("Cache-Control", "no-store");
  res.end(pdfBuffer);
});
export default router;
