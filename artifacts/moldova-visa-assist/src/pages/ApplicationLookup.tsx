import { FormEvent, useState } from "react";

const API_BASE = "/api";

type Result = { referenceNumber: string; applicantName: string; jobTitle: string; employerName?: string; employerCountry?: string; location?: string; salary?: string; startDate?: string; contractDuration?: string; status: string; createdAt: string };

export default function ApplicationLookup() {
  const [reference, setReference] = useState(""); const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setResult(null); const ref = reference.trim().toUpperCase();
    if (!/^(?:MVA-\d{4}-[A-F0-9]{6}|MVA-APP-[A-F0-9]{10}|MVA-VISA-[A-F0-9]{10})$/.test(ref)) { setError("Enter a valid reference number, for example MVA-VISA-1A2B3C4D5E."); return; }
    setLoading(true);
    try { const response = await fetch(`${API_BASE}/public/applications/${encodeURIComponent(ref)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Application not found"); setResult(data.application); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to check application."); }
    finally { setLoading(false); }
  }
  return <div className="min-h-[70vh] bg-slate-50 px-4 py-12"><div className="mx-auto max-w-2xl"><div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8"><div className="mb-8 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#1a2744] text-2xl text-white">MVA</div><h1 className="text-2xl font-bold text-[#1a2744]">Check Application</h1><p className="mt-2 text-sm text-slate-500">Enter your Moldova Visa Assist application reference number.</p></div><form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><input value={reference} onChange={e => setReference(e.target.value)} placeholder="MVA-VISA-1A2B3C4D5E" className="h-12 flex-1 rounded-lg border px-4 font-mono uppercase outline-none focus:ring-2 focus:ring-slate-400" aria-label="Application reference number" /><button disabled={loading} className="h-12 rounded-lg bg-[#1a2744] px-6 font-semibold text-white disabled:opacity-60">{loading ? "Checking..." : "Search"}</button></form>{error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{result && <div className="mt-6 rounded-xl border bg-slate-50 p-5"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</p><p className="font-mono font-bold text-[#1a2744]">{result.referenceNumber}</p></div><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold">{result.status}</span></div><div className="grid gap-4 sm:grid-cols-2"><Info label="Applicant" value={result.applicantName} /><Info label="Application" value={result.jobTitle} /><Info label="Destination" value={result.location || result.employerCountry || "—"} />{result.startDate && <Info label="Travel Date" value={result.startDate} />}</div><p className="mt-5 border-t pt-4 text-xs text-slate-500">Only limited public application information is displayed. Passport, contact, payment and internal administrative information are not displayed.</p></div>}</div></div></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-900">{value || "—"}</p></div>; }
