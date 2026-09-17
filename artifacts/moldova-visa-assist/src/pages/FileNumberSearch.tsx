import { FormEvent, useState } from "react";

export default function FileNumberSearch() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setResult(null);
    const ref = reference.trim().toUpperCase();
    if (!ref) { setError("Please enter your File Number."); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/public/applications/${encodeURIComponent(ref)}`);
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Application not found");
      setResult(d.application);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to search right now."); }
    finally { setLoading(false); }
  }
  return <div className="min-h-[70vh] bg-slate-50 px-4 py-12"><div className="mx-auto max-w-3xl"><div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
    <div className="mb-7 text-center"><h1 className="text-2xl font-bold text-[#1a2744]">File Number Search</h1><p className="mt-2 text-sm text-slate-500">Enter your File Number to view the latest application status, employer information and submitted documents.</p></div>
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Enter File Number" className="h-12 flex-1 rounded-lg border px-4 font-mono uppercase outline-none focus:ring-2 focus:ring-slate-400"/><button disabled={loading} className="h-12 rounded-lg bg-[#1a2744] px-6 font-semibold text-white disabled:opacity-60">{loading ? "Searching..." : "Search"}</button></form>
    {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {result && <div className="mt-6 space-y-6">
      <div className="rounded-xl border bg-slate-50 p-5"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">File Number</p><p className="font-mono font-bold text-[#1a2744]">{result.referenceNumber}</p></div><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold">{result.status}</span></div><div className="grid gap-4 sm:grid-cols-2"><Info label="Applicant" value={result.applicantName}/><Info label="Job Title" value={result.jobTitle}/><Info label="Employer" value={result.employerName}/><Info label="Employer Country" value={result.employerCountry}/><Info label="Permit Type" value={result.permitType}/><Info label="Salary" value={result.jobSalary}/><Info label="Start Date" value={result.startDate}/><Info label="Contract Duration" value={result.contractDuration}/><Info label="Payment Status" value={result.paymentStatus}/></div></div>
      <Documents documents={result.documents}/>
    </div>}
  </div></div></div>;
}
function Info({label,value}:{label:string;value?:string|null}) { return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-900">{value || "—"}</p></div>; }
function Documents({documents}:{documents?:{passportCopy?:string|null;photo?:string|null;medicalCertificate?:string|null;criminalRecord?:string|null}}) {
  const items=[
    ["Passport Copy",documents?.passportCopy],
    ["Passport Size Photo",documents?.photo],
    ["Medical Certificate",documents?.medicalCertificate],
    ["Criminal Record Clearance",documents?.criminalRecord],
  ] as const;
  const available=items.filter(([,value])=>Boolean(value));
  if(!available.length) return <div className="rounded-xl border bg-white p-5"><h2 className="font-semibold text-[#1a2744]">Submitted Documents</h2><p className="mt-2 text-sm text-slate-500">No document preview is available for this application.</p></div>;
  return <div className="rounded-xl border bg-white p-5"><h2 className="mb-4 font-semibold text-[#1a2744]">Submitted Documents</h2><div className="grid gap-5 sm:grid-cols-2">{available.map(([label,value])=><div key={label} className="overflow-hidden rounded-xl border bg-slate-50"><div className="border-b px-4 py-3 text-sm font-semibold">{label}</div>{value?.startsWith("data:image/") ? <img src={value} alt={label} className="max-h-80 w-full object-contain p-3"/> : value?.startsWith("data:application/pdf") ? <iframe title={label} src={value} className="h-80 w-full"/> : <a href={value || "#"} target="_blank" rel="noreferrer" className="block p-5 text-sm font-medium text-blue-700">Open document</a>}</div>)}</div></div>;
}
