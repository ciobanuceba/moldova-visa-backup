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

  return (
    <div className="min-h-[75vh] bg-gradient-to-b from-slate-100 via-white to-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-[#1a2744] px-5 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-4 flex h-20 w-28 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden"><img src="/moldova_logo.png" alt="Moldova Visa Assist" className="max-h-full max-w-full object-contain p-2"/></div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Moldova Visa Assist</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">File Number Search</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">Check your application and employer information securely using your File Number.</p>
              <a href="#" className="mt-3 inline-block text-xs font-semibold text-white underline underline-offset-4">moldova-visa-assist.onrender.com</a>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <form onSubmit={submit} className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:p-4">
              <input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Enter File Number" aria-label="File Number" className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 font-mono uppercase shadow-sm outline-none transition focus:border-[#1a2744] focus:ring-2 focus:ring-[#1a2744]/20"/>
              <button disabled={loading} className="h-12 rounded-xl bg-[#1a2744] px-7 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60">{loading ? "Searching..." : "Search File"}</button>
            </form>

            {error && <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            {result && <div className="mt-8 space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">File Number</p>
                  <p className="mt-1 break-all font-mono text-xl font-black text-[#1a2744] sm:text-2xl">{result.referenceNumber}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#1a2744]">{result.status}</span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <SectionTitle icon="👤" title="Applicant Information" />
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Info label="Applicant Name" value={result.applicantName}/>
                    <Info label="Job Title" value={result.jobTitle}/>
                    <Info label="Permit Type" value={result.permitType}/>
                    <Info label="Start Date" value={result.startDate}/>
                    <Info label="Contract Duration" value={result.contractDuration}/>
                    <Info label="Payment Status" value={result.paymentStatus}/>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="h-40 bg-slate-100">
                    {result.employerLogo ? <img src={result.employerLogo} alt={result.employerName || "Employer logo"} className="h-full w-full object-contain p-4"/> : <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-widest text-slate-400">Employer Logo</div>}
                  </div>
                  <div className="p-5 sm:p-6">
                    <SectionTitle icon="🏢" title="Employer Information" />
                    <div className="mt-5 space-y-4">
                      <Info label="Company Name" value={result.employerName}/>
                      <Info label="Employer Country" value={result.employerCountry}/>
                      <Info label="Salary" value={result.jobSalary}/>
                    </div>
                  </div>
                </section>
              </div>

              <Documents documents={result.documents}/>
            </div>}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 text-center sm:px-8">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} Moldova Visa Assist. All rights reserved.</p>
            <a href="#" className="mt-1 inline-block text-xs font-semibold text-[#1a2744] underline underline-offset-4">moldova-visa-assist.onrender.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({icon,title}:{icon:string;title:string}) {
  return <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">{icon}</span><h2 className="text-lg font-bold text-[#1a2744]">{title}</h2></div>;
}
function Info({label,value}:{label:string;value?:string|null}) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</p></div>; }

function Documents({documents}:{documents?:{passportCopy?:string|null;photo?:string|null;medicalCertificate?:string|null;criminalRecord?:string|null}}) {
  const items=[["Passport Copy",documents?.passportCopy],["Passport Size Photo",documents?.photo],["Medical Certificate",documents?.medicalCertificate],["Criminal Record Clearance",documents?.criminalRecord]] as const;
  const available=items.filter(([,value])=>Boolean(value));
  if(!available.length) return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><SectionTitle icon="📄" title="Submitted Documents"/><p className="mt-4 text-sm text-slate-500">No document preview is available for this application.</p></div>;
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><SectionTitle icon="📄" title="Submitted Documents"/><div className="mt-5 grid gap-5 sm:grid-cols-2">{available.map(([label,value])=><div key={label} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><div className="border-b bg-white px-4 py-3 text-sm font-semibold text-[#1a2744]">{label}</div>{value?.startsWith("data:image/") ? <img src={value} alt={label} className="max-h-80 w-full object-contain p-3"/> : value?.startsWith("data:application/pdf") ? <iframe title={label} src={value} className="h-80 w-full"/> : <a href={value || "#"} target="_blank" rel="noreferrer" className="block p-5 text-sm font-semibold text-blue-700">Open document</a>}</div>)}</div></div>;
}
