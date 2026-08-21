import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, authHeaders } from "@/lib/auth";

interface Job { id: number; title: string; location: string; salary: string; }

const initialPermit = {
  firstName: "", lastName: "", email: "", phone: "", nationality: "",
  dateOfBirth: "", passportNumber: "", passportExpiry: "", currentAddress: "",
  permitType: "Work Permit", employerName: "", employerCountry: "Moldova",
  jobTitle: "", jobSalary: "", startDate: "", contractDuration: "12 months",
};

export default function AdminManual() {
  const { user, isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [offer, setOffer] = useState({ firstName: "", lastName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "", availableFrom: "", notes: "" });
  const [permit, setPermit] = useState(initialPermit);
  const [offerBusy, setOfferBusy] = useState(false);
  const [permitBusy, setPermitBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/jobs").then(r => r.ok ? r.json() : []).then(data => setJobs(Array.isArray(data) ? data : []));
  }, [isAdmin]);

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><p>Admin access required.</p></div>;

  const setOfferField = (key: keyof typeof offer, value: string) => setOffer(v => ({ ...v, [key]: value }));
  const setPermitField = (key: keyof typeof permit, value: string) => setPermit(v => ({ ...v, [key]: value }));

  async function createManualOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !jobId) { setMessage("Select a job first."); return; }
    setOfferBusy(true); setMessage("");
    try {
      const job = jobs.find(j => String(j.id) === jobId);
      const create = await fetch("/api/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(jobId), ...offer,
          jobTitle: job?.title, location: job?.location, salary: job?.salary,
          experience: "Manual admin entry",
        }),
      });
      const data = await create.json().catch(() => ({}));
      if (!create.ok) throw new Error(data.error || "Could not create application");
      const approve = await fetch(`/api/admin/applications/${data.id}/approve`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ notes: offer.notes || "Manual Job Offer created by admin." }),
      });
      const approved = await approve.json().catch(() => ({}));
      if (!approve.ok) throw new Error(approved.error || "Application saved but offer could not be approved");
      setMessage(`Manual Job Offer created and sent. Reference: ${data.referenceNumber}`);
      setOffer({ firstName: "", lastName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "", availableFrom: "", notes: "" });
    } catch (err) { setMessage(err instanceof Error ? err.message : "Manual Job Offer failed"); }
    finally { setOfferBusy(false); }
  }

  async function createManualPermit(e: React.FormEvent) {
    e.preventDefault();
    setPermitBusy(true); setMessage("");
    try {
      const create = await fetch("/api/work-permits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...permit, hasPassport: true, hasJobOffer: true }),
      });
      const data = await create.json().catch(() => ({}));
      if (!create.ok) throw new Error(data.error || "Could not create work permit");
      // Manual entries should appear in the normal Work Permit admin list immediately.
      await fetch(`/api/work-permits/${data.id}/approve-payment`, { method: "PATCH" });
      setMessage(`Manual Work Permit created: ${data.referenceNumber}. Open Admin → Work Permits to Approve or Reject it.`);
      setPermit(initialPermit);
    } catch (err) { setMessage(err instanceof Error ? err.message : "Manual Work Permit failed"); }
    finally { setPermitBusy(false); }
  }

  const offerFields: [keyof typeof offer, string][] = [["firstName","First name"],["lastName","Last name"],["email","Email"],["phone","Phone"],["nationality","Nationality"],["dateOfBirth","Date of birth"],["passportNumber","Passport number"],["availableFrom","Start date"]];
  const permitFields: [keyof typeof permit, string][] = Object.keys(initialPermit).map(k => [k as keyof typeof permit, k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())]);

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-3xl font-bold">Manual Admin Tools</h1><p className="text-muted-foreground">Create a manual Job Offer or Work Permit without changing the existing approval workflow.</p></div>
          <Button asChild variant="outline"><Link href="/admin">Back to Admin</Link></Button>
        </div>
        {message && <div className="rounded-lg border bg-card p-4 font-medium">{message}</div>}

        <section className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-bold">Manual Job Offer</h2>
          <p className="text-sm text-muted-foreground mb-4">Creates an application and immediately uses the existing Approve → PDF → email workflow.</p>
          <form onSubmit={createManualOffer} className="grid gap-4 sm:grid-cols-2">
            <select value={jobId} onChange={e => setJobId(e.target.value)} className="h-10 rounded-md border bg-background px-3 sm:col-span-2"><option value="">Select job</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.location} — {j.salary}</option>)}</select>
            {offerFields.map(([key, label]) => <Input key={key} required={key !== "passportNumber" && key !== "nationality"} placeholder={label} value={offer[key]} onChange={e => setOfferField(key, e.target.value)} />)}
            <Textarea className="sm:col-span-2" placeholder="Admin notes (optional)" value={offer.notes} onChange={e => setOfferField("notes", e.target.value)} />
            <Button disabled={offerBusy} type="submit" className="sm:col-span-2">{offerBusy ? "Creating…" : "Create & Send Manual Job Offer"}</Button>
          </form>
        </section>

        <section className="bg-card border rounded-xl p-6">
          <h2 className="text-xl font-bold">Manual Work Permit</h2>
          <p className="text-sm text-muted-foreground mb-4">Creates a permit in the normal Work Permit list. Use the existing Approve / Reject buttons there.</p>
          <form onSubmit={createManualPermit} className="grid gap-4 sm:grid-cols-2">
            {permitFields.map(([key, label]) => <Input key={key} required placeholder={label} value={permit[key]} onChange={e => setPermitField(key, e.target.value)} />)}
            <Button disabled={permitBusy} type="submit" className="sm:col-span-2">{permitBusy ? "Creating…" : "Create Manual Work Permit"}</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
