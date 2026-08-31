import { useEffect, useState } from "react";
import { ArrowLeft, Send, MessageCircle, Loader2, Search, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, authHeaders } from "@/lib/auth";

interface Conversation { id: number; name: string; email: string; file_number?: string | null; last_message_at?: string; message_count?: number; }
interface ChatMessage { id: number; sender: "user" | "admin"; message: string; created_at?: string; }

export default function AdminChat() {
  const { user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadConversations(search = emailSearch) {
    if (!user) return;
    const query = search.trim() ? `?email=${encodeURIComponent(search.trim())}` : "";
    const res = await fetch(`/api/admin/chat/conversations${query}`, { headers: authHeaders(user.token) });
    if (res.ok) setConversations(await res.json());
  }
  async function loadMessages(id = selected) {
    if (!id) return;
    const res = await fetch(`/api/chat/conversations/${id}/messages`);
    if (res.ok) setMessages(await res.json());
  }
  useEffect(() => { loadConversations(); }, [user]);
  useEffect(() => { if (selected) loadMessages(selected); }, [selected]);
  useEffect(() => { const t = window.setInterval(() => { loadConversations(); if (selected) loadMessages(selected); }, 3000); return () => window.clearInterval(t); }, [selected, user, emailSearch]);

  async function reply() {
    if (!user || !selected || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${selected}/messages`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(user.token) }, body: JSON.stringify({ message: text.trim() }) });
      if (res.ok) { setText(""); await loadMessages(selected); await loadConversations(); }
    } finally { setSending(false); }
  }

  async function deleteConversation(id: number) {
    if (!user || deleting) return;
    if (!window.confirm("Delete this conversation and all its messages? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/chat/conversations/${id}`, { method: "DELETE", headers: authHeaders(user.token) });
      if (res.ok) { if (selected === id) { setSelected(null); setMessages([]); } await loadConversations(); }
    } finally { setDeleting(false); }
  }

  if (!isAdmin) return <div className="p-10 text-center">Admin access required.</div>;
  const current = conversations.find(c => c.id === selected);
  return <div className="min-h-screen bg-muted/20 p-4 md:p-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Button variant="outline" size="icon" asChild><Link href="/admin"><ArrowLeft className="w-4 h-4" /></Link></Button><div><h1 className="text-2xl font-serif font-bold text-primary">Live Chat</h1><p className="text-sm text-muted-foreground">Search by email, view conversations, reply, or delete them.</p></div></div>
      <div className="flex gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") loadConversations(); }} placeholder="Find conversations by email…" /></div><Button variant="outline" onClick={() => loadConversations()}><Search className="w-4 h-4 mr-2" />Search</Button>{emailSearch && <Button variant="ghost" onClick={() => { setEmailSearch(""); loadConversations(""); }}>Clear</Button>}</div>
      <div className="grid md:grid-cols-[320px_1fr] bg-card border rounded-2xl overflow-hidden min-h-[620px]">
        <div className="border-r divide-y overflow-y-auto">{conversations.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground"><MessageCircle className="w-6 h-6 mx-auto mb-2" />No chats found.</div> : conversations.map(c => <div key={c.id} className={`flex items-center hover:bg-muted/50 ${selected === c.id ? "bg-muted" : ""}`}><button onClick={() => setSelected(c.id)} className="flex-1 text-left p-4 min-w-0"><div className="font-semibold truncate">{c.name}</div><div className="text-xs text-muted-foreground truncate">{c.email}</div>{c.file_number && <div className="text-xs font-mono mt-1">{c.file_number}</div>}<div className="text-xs text-muted-foreground mt-1">{c.message_count ?? 0} messages</div></button><Button variant="ghost" size="icon" className="mr-2 shrink-0 text-destructive hover:text-destructive" title="Delete conversation" onClick={() => deleteConversation(c.id)} disabled={deleting}><Trash2 className="w-4 h-4" /></Button></div>)}</div>
        <div className="flex flex-col">{current ? <><div className="p-4 border-b flex items-center justify-between gap-3"><div><div className="font-semibold">{current.name}</div><div className="text-xs text-muted-foreground">{current.email}{current.file_number ? ` · ${current.file_number}` : ""}</div></div><Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteConversation(current.id)} disabled={deleting}><Trash2 className="w-4 h-4 mr-2" />Delete</Button></div><div className="flex-1 overflow-y-auto p-5 space-y-3">{messages.map(m => <div key={m.id} className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.sender === "admin" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{m.message}</div>)}</div><div className="p-3 border-t flex gap-2"><Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") reply(); }} placeholder="Reply to this user…" /><Button onClick={reply} disabled={sending || !text.trim()}>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button></div></> : <div className="flex-1 flex items-center justify-center text-muted-foreground"><MessageCircle className="w-5 h-5 mr-2" />Select a conversation</div>}</div>
      </div>
    </div>
  </div>;
}
