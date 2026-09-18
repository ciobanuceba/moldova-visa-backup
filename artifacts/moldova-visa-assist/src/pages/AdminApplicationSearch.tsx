import { useState } from "react";
import { Link } from "wouter";
import { useAuth, authHeaders } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lock, Search, Save, ArrowLeft } from "lucide-react";

const fields = [
["first_name","First Name"],["last_name","Last Name"],["email","Email"],["phone","Phone"],["nationality","Nationality"],
["date_of_birth","Date of Birth"],["passport_number","Passport Number"],["years_experience","Years Experience"],
["skills","Skills"],["languages","Languages"],["available_from","Available From"],["resume_url","Resume URL"],
["employer_name","Employer Name"],["employer_country","Employer Country"]
] as const;
const statuses=["pending","approved","rejected","under_review"];

export default function AdminApplicationSearch(){
const {user,isAdmin}=useAuth(); const {toast}=useToast();
const [ref,setRef]=useState(""); const [app,setApp]=useState<any>(null); const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false);
async function search(){if(!user||!ref.trim())return;setLoading(true);try{const r=await fetch(`/api/admin/applications/search/${encodeURIComponent(ref.trim().toUpperCase())}`,{headers:authHeaders(user.token)});const d=await r.json();if(!r.ok)throw new Error(d.error);setApp(d.application);}catch(e){setApp(null);toast({title:"Not found",description:e instanceof Error?e.message:"Application not found",variant:"destructive"});}finally{setLoading(false);}}
async function save(){if(!user||!app)return;setSaving(true);try{const r=await fetch(`/api/admin/applications/${app.id}/edit`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeaders(user.token)},body:JSON.stringify(toPayload(app))});const d=await r.json();if(!r.ok)throw new Error(d.error);setApp({...d.application,job_title:app.job_title,job_location:app.job_location,job_salary:app.job_salary});toast({title:"Saved",description:"Application updated successfully."});}catch(e){toast({title:"Save failed",description:e instanceof Error?e.message:"Could not save",variant:"destructive"});}finally{setSaving(false);}}
if(!isAdmin)return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><Lock className="mx-auto mb-3"/><p>Admin Access Required</p><Button asChild className="mt-4"><Link href="/admin/login">Admin Login</Link></Button></div></div>;
return <div className="min-h-screen bg-muted/20 p-4 md:p-8"><div className="max-w-5xl mx-auto">
<div className="flex flex-wrap items-center gap-3 mb-6"><Button asChild variant="outline" size="sm"><Link href="/admin"><ArrowLeft className="w-4 h-4 mr-1"/>Admin</Link></Button><h1 className="text-2xl font-bold text-primary">Application Search / Edit</h1></div>
<div className="bg-card border rounded-xl p-5"><div className="flex gap-2"><Input value={ref} onChange={e=>setRef(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void search();}} placeholder="Search Application Reference (MVA-APP-...)"/><Button onClick={search} disabled={loading}><Search className="w-4 h-4 mr-2"/>{loading?"Searching...":"Search"}</Button></div></div>
{app&&<div className="bg-card border rounded-xl p-5 mt-5 space-y-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Edit Application</h2><span className="text-sm text-muted-foreground">ID: {app.id}</span></div>
<Field label="Reference Number" value={app.reference_number||""} onChange={v=>setApp({...app,reference_number:v})}/>
<div className="grid sm:grid-cols-2 gap-4">{fields.map(([k,l])=><Field key={k} label={l} value={app[k]||""} onChange={v=>setApp({...app,[k]:v})}/>)}</div>
<div className="grid sm:grid-cols-2 gap-4"><Field label="Job" value={app.job_title||""} onChange={()=>{}}/><Field label="Job Location" value={app.job_location||""} onChange={()=>{}}/><Field label="Job Salary" value={app.job_salary||""} onChange={()=>{}}/></div>
<Field label="Cover Letter" value={app.cover_letter||""} onChange={v=>setApp({...app,cover_letter:v})}/>
<Field label="Experience" value={app.experience||""} onChange={v=>setApp({...app,experience:v})}/>
<div><label className="text-sm font-medium">Admin Notes</label><Textarea className="mt-1" value={app.admin_notes||""} onChange={e=>setApp({...app,admin_notes:e.target.value})}/></div>
<div className="grid sm:grid-cols-2 gap-4"><SelectField label="Status" value={app.status||"pending"} options={statuses} onChange={v=>setApp({...app,status:v})}/><Field label="Resume URL" value={app.resume_url||""} onChange={v=>setApp({...app,resume_url:v})}/></div>
<Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-2"/>{saving?"Saving...":"Save Changes"}</Button>
</div>}
</div></div>;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <div><label className="text-sm font-medium">{label}</label><Input className="mt-1" value={value} onChange={e=>onChange(e.target.value)}/></div>}
function SelectField({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <div><label className="text-sm font-medium">{label}</label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={value} onChange={e=>onChange(e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select></div>}
function toPayload(a:any){return {referenceNumber:a.reference_number,firstName:a.first_name,lastName:a.last_name,email:a.email,phone:a.phone,nationality:a.nationality,dateOfBirth:a.date_of_birth,passportNumber:a.passport_number,yearsExperience:a.years_experience,skills:a.skills,languages:a.languages,availableFrom:a.available_from,resumeUrl:a.resume_url,coverLetter:a.cover_letter,experience:a.experience,status:a.status,adminNotes:a.admin_notes,employerName:a.employer_name,employerCountry:a.employer_country,passportCopyData:a.passport_copy_data,photoData:a.photo_data,medicalCertData:a.medical_cert_data,criminalRecordData:a.criminal_record_data,employerLogoData:a.employer_logo_data};}
