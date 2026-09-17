import { useState } from "react";
import { Link } from "wouter";
import { useAuth, authHeaders } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lock, Search, Save, ArrowLeft } from "lucide-react";

export default function AdminFileSearch() {
  const { user, isAdmin } = useAuth(); const { toast } = useToast();
  const [ref, setRef] = useState(""); const [app, setApp] = useState<any>(null); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  async function search() {
    if (!user || !ref.trim()) return; setLoading(true);
    try { const r = await fetch(`/api/admin/file-search/${encodeURIComponent(ref.trim().toUpperCase())}`, { headers: authHeaders(user.token) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setApp(d.application); }
    catch(e) { setApp(null); toast({ title:"Not found", description:e instanceof Error?e.message:"Application not found", variant:"destructive"}); }
    finally { setLoading(false); }
  }
  async function save() {
    if (!user || !app) return; setSaving(true);
    try { const r = await fetch(`/api/admin/file-search/${app.id}`, { method:"PATCH", headers:{"Content-Type":"application/json", ...authHeaders(user.token)}, body:JSON.stringify({status:app.status, employerName:app.employer_name, employerCountry:app.employer_country, jobTitle:app.job_title, startDate:app.start_date, contractDuration:app.contract_duration, adminNotes:app.admin_notes}) }); const d=await r.json(); if(!r.ok) throw new Error(d.error); setApp(d.application); toast({title:"Saved",description:"Application updated successfully."}); }
    catch(e){toast({title:"Error",description:e instanceof Error?e.message:"Could not save",variant:"destructive"});} finally{setSaving(false);}
  }
  if(!isAdmin) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><Lock className="mx-auto mb-3"/><p>Admin Access Required</p><Button asChild className="mt-4"><Link href="/admin/login">Admin Login</Link></Button></div></div>;
  return <div className="min-h-screen bg-muted/20 p-4 md:p-8"><div className="max-w-4xl mx-auto"><div className="flex items-center gap-3 mb-6"><Button asChild variant="outline" size="sm"><Link href="/admin"><ArrowLeft className="w-4 h-4 mr-1"/>Admin</Link></Button><h1 className="text-2xl font-bold text-primary">File Number Search</h1></div><div className="bg-card border rounded-xl p-5"><div className="flex gap-2"><Input value={ref} onChange={e=>setRef(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Enter File Number / Reference Number"/><Button onClick={search} disabled={loading}><Search className="w-4 h-4 mr-2"/>{loading?"Searching...":"Search"}</Button></div></div>
    {app && <div className="bg-card border rounded-xl p-5 mt-5 space-y-5"><div className="grid sm:grid-cols-2 gap-4"><Field label="File Number" value={app.reference_number} readOnly/><Field label="Applicant" value={`${app.first_name} ${app.last_name}`} readOnly/><Field label="Email" value={app.email} readOnly/><Field label="Phone" value={app.phone} readOnly/></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-sm font-medium">Status</label><Select value={app.status} onValueChange={v=>setApp({...app,status:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{["pending_payment","submitted","payment_confirmed","approved","rejected","under_review"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><Field label="Job / Position" value={app.job_title||""} onChange={v=>setApp({...app,job_title:v})}/><Field label="Employer Name" value={app.employer_name||""} onChange={v=>setApp({...app,employer_name:v})}/><Field label="Employer Country" value={app.employer_country||""} onChange={v=>setApp({...app,employer_country:v})}/><Field label="Start Date" value={app.start_date||""} onChange={v=>setApp({...app,start_date:v})}/><Field label="Contract Duration" value={app.contract_duration||""} onChange={v=>setApp({...app,contract_duration:v})}/></div><div><label className="text-sm font-medium">Admin Notes</label><Textarea className="mt-1" value={app.admin_notes||""} onChange={e=>setApp({...app,admin_notes:e.target.value})}/></div><Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2"/>{saving?"Saving...":"Save Changes"}</Button></div>}
  </div></div>;
}
function Field({label,value,onChange,readOnly}:{label:string;value:string;onChange?:(v:string)=>void;readOnly?:boolean}) { return <div><label className="text-sm font-medium">{label}</label><Input className="mt-1" value={value} readOnly={readOnly} onChange={e=>onChange?.(e.target.value)}/></div>; }
