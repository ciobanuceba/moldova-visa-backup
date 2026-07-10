import { Router, type IRouter } from "express";
import path from "path";
import { randomBytes } from "crypto";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const router: IRouter = Router();

/**
 * POST /upload/resume
 * Accepts JSON body: { filename: string, contentType: string, data: base64string }
 * Returns: { url: string, filename: string }
 */
router.post("/upload/resume", async (req, res): Promise<void> => {
  const { filename, contentType, data } = req.body ?? {};

  if (!filename || !contentType || !data) {
    res.status(400).json({ error: "filename, contentType, and data (base64) are required" });
    return;
  }

  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (!allowed.includes(contentType)) {
    res.status(400).json({ error: "Only PDF and DOCX files are allowed" });
    return;
  }

  const ext = path.extname(filename).toLowerCase() || ".bin";
  const safeName = `resume-${randomBytes(8).toString("hex")}${ext}`;
  const filepath = path.join(UPLOAD_DIR, safeName);

  try {
    const buffer = Buffer.from(data, "base64");
    if (buffer.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({ error: "File exceeds 5 MB limit" });
      return;
    }
    fs.writeFileSync(filepath, buffer);
  } catch {
    res.status(500).json({ error: "Failed to save file" });
    return;
  }

  res.json({ url: `/api/upload/files/${safeName}`, filename });
});

/** GET /upload/files/:filename — serve uploaded resume */
router.get("/upload/files/:filename", (req, res): void => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filepath);
});

export default router;
