import { Router, type IRouter } from "express";
import { createHmac } from "crypto";
import { pool } from "@workspace/db";
import { sendEmail } from "../lib/email";
import { requireAdmin } from "../middleware/requireAdmin";

const router: IRouter = Router();
const adminEmail = () => process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@moldova-visa-assist.replit.app";
const chatSecret = () => process.env.CHAT_SECRET || process.env.SESSION_SECRET || process.env.DATABASE_URL || "mva-chat-secret";
function accessToken(id: number) { return createHmac("sha256", chatSecret()).update(`chat:${id}`).digest("hex"); }
function validToken(id: number, token: unknown) { return typeof token === "string" && token === accessToken(id); }

router.post("/chat/conversations", async (req, res): Promise<void> => {
  const { name, email, fileNumber, message } = req.body ?? {};
  if (!name || !email || !message) { res.status(400).json({ error: "Name, email and message are required" }); return; }
  const client = await pool.connect();
  try {
    const c = await client.query(`INSERT INTO chat_conversations (name,email,file_number) VALUES ($1,$2,$3) RETURNING *`, [String(name).trim(), String(email).trim(), fileNumber ? String(fileNumber).trim() : null]);
    const conversation = c.rows[0];
    const welcome = "Welcome to Moldova. Thank you for contacting us. Your message has been received, and our admin will reply as soon as possible.";
    const m = await client.query(`INSERT INTO chat_messages (conversation_id,sender,message) VALUES ($1,'user',$2) RETURNING *`, [conversation.id, String(message).trim()]);
    const w = await client.query(`INSERT INTO chat_messages (conversation_id,sender,message) VALUES ($1,'admin',$2) RETURNING *`, [conversation.id, welcome]);
    await client.query(`UPDATE chat_conversations SET last_message_at=NOW() WHERE id=$1`, [conversation.id]);
    sendEmail({ to: adminEmail(), subject: `New Live Chat Message — ${conversation.name}`, html: `<h2>New Live Chat Message</h2><p><b>Name:</b> ${conversation.name}</p><p><b>Email:</b> ${conversation.email}</p><p><b>File Number:</b> ${conversation.file_number || "Not provided"}</p><p>${String(message).trim()}</p><p>Open the Admin Dashboard to reply.</p>` }).catch(() => {});
    res.status(201).json({ conversation, token: accessToken(conversation.id), messages: [m.rows[0], w.rows[0]] });
  } finally { client.release(); }
});

router.get("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !validToken(id, req.query.token)) { res.status(403).json({ error: "Invalid chat access" }); return; }
  const { rows } = await pool.query(`SELECT * FROM chat_messages WHERE conversation_id=$1 ORDER BY created_at ASC`, [id]);
  res.json(rows);
});

router.post("/chat/conversations/:id/messages", async (req, res): Promise<void> => {
  const id = Number(req.params.id); const { message, token } = req.body ?? {};
  if (!Number.isInteger(id) || !message || !validToken(id, token)) { res.status(403).json({ error: "Invalid chat access" }); return; }
  const client = await pool.connect();
  try {
    const c = await client.query(`SELECT * FROM chat_conversations WHERE id=$1`, [id]);
    if (!c.rows.length) { res.status(404).json({ error: "Conversation not found" }); return; }
    const m = await client.query(`INSERT INTO chat_messages (conversation_id,sender,message) VALUES ($1,'user',$2) RETURNING *`, [id, String(message).trim()]);
    await client.query(`UPDATE chat_conversations SET last_message_at=NOW() WHERE id=$1`, [id]);
    const convo = c.rows[0];
    sendEmail({ to: adminEmail(), subject: `New Live Chat Message — ${convo.name}`, html: `<h2>New Live Chat Message</h2><p><b>${convo.name}</b> (${convo.email})</p><p>${String(message).trim()}</p><p>Open the Admin Dashboard to reply.</p>` }).catch(() => {});
    res.status(201).json(m.rows[0]);
  } finally { client.release(); }
});

router.get("/admin/chat/conversations", requireAdmin, async (_req, res): Promise<void> => {
  const { rows } = await pool.query(`SELECT c.*, (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id=c.id) AS message_count FROM chat_conversations c ORDER BY c.last_message_at DESC`);
  res.json(rows);
});

router.post("/admin/chat/conversations/:id/messages", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id); const { message } = req.body ?? {};
  if (!Number.isInteger(id) || !message) { res.status(400).json({ error: "Message is required" }); return; }
  const { rows } = await pool.query(`INSERT INTO chat_messages (conversation_id,sender,message) VALUES ($1,'admin',$2) RETURNING *`, [id, String(message).trim()]);
  await pool.query(`UPDATE chat_conversations SET last_message_at=NOW() WHERE id=$1`, [id]);
  res.status(201).json(rows[0]);
});

export default router;
