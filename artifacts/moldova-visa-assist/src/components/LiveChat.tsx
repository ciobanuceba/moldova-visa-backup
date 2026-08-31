import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessage { id: number; sender: "user" | "admin"; message: string; created_at?: string; }

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem("mva_chat_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("mva_chat_email") || "");
  const [fileNumber, setFileNumber] = useState(() => localStorage.getItem("mva_chat_file") || "");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(() => Number(localStorage.getItem("mva_chat_conversation")) || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    if (!conversationId) return;
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => { if (open && conversationId) loadMessages(); }, [open, conversationId]);
  useEffect(() => {
    if (!open || !conversationId) return;
    const timer = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(timer);
  }, [open, conversationId]);

  async function send() {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      let res: Response;
      if (!conversationId) {
        if (!name.trim() || !email.trim()) return;
        localStorage.setItem("mva_chat_name", name.trim());
        localStorage.setItem("mva_chat_email", email.trim());
        localStorage.setItem("mva_chat_file", fileNumber.trim());
        res = await fetch("/api/chat/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, fileNumber, message: text }) });
        const data = await res.json();
        if (!res.ok) return;
        setConversationId(data.conversation.id);
        localStorage.setItem("mva_chat_conversation", String(data.conversation.id));
        setMessages(data.messages || []);
      } else {
        res = await fetch(`/api/chat/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, sender: "user" }) });
        if (res.ok) await loadMessages();
      }
      setMessage("");
    } finally { setSending(false); }
  }

  return <>
    <button type="button" aria-label="Open live chat" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
      <MessageCircle className="w-6 h-6" />
    </button>
    {open && <div className="fixed bottom-5 right-5 z-[70] w-[calc(100vw-2rem)] max-w-sm h-[520px] bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between"><div><div className="font-semibold">Live Chat</div><div className="text-xs opacity-75">Message our admin</div></div><button onClick={() => setOpen(false)} aria-label="Close chat"><X className="w-5 h-5" /></button></div>
      {!conversationId && <div className="p-4 space-y-3 border-b"><Input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} /><Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><Input placeholder="File number (optional)" value={fileNumber} onChange={e => setFileNumber(e.target.value)} /></div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">{messages.length === 0 ? <p className="text-center text-sm text-muted-foreground py-10">Send a message and our admin will reply.</p> : messages.map(m => <div key={m.id} className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${m.sender === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-card border"}`}>{m.message}</div>)}</div>
      <div className="p-3 border-t flex gap-2"><Input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type a message…" /><Button size="icon" onClick={send} disabled={sending || !message.trim()}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button></div>
    </div>}
  </>;
}
