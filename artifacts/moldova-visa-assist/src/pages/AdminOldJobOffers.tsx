import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, authHeaders } from "@/lib/auth";

type OldOffer = {
  id: number; reference_number: string; applicant_name: string; job_title: string;
  location: string; salary: string; employer_name: string | null; employer_country: string | null;
  start_date: string | null; contract_duration: string | null; admin_notes: string | null; created_at: string;
};
const initialForm = {
  referenceNumber: "", applicantName: "", jobTitle: "", location: "", salary: "",
  employerName: "", employerCountry: "Moldova", startDate: "", contractDuration: "", adminNotes: "",
};

export default function AdminOldJobOffers() {
  const { user, isAdmin } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [records, setRecords] = useState<OldOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manual/old-job-offers", { headers: authHeaders(user.token) });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || "Could not load records");
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load records");
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (isAdmin) void loadRecords(); }, [isAdmin, loadRecords]);

  function startEdit(record: OldOffer) {
    setEditingId(record.id);
    setForm({
      referenceNumber: record.reference_number,
      applicantName: record.applicant_name,
      jobTitle: record.job_title,
      location: record.location,
      salary: record.salary,
      employerName: record.employer_name || "",
      employerCountry: record.employer_country || "",
      startDate: record.start_date || "",
      contractDuration: record.contract_duration || "",
      adminNotes: record.admin_notes || "",
    });
    setMessage(`Editing ${record.reference_number}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage("Edit cancelled.");
  }

  function update(key: keyof typeof form, value: string) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function downloadOldOffer(record: OldOffer) {
    if (!user) return;
    setDownloadingId(record.id); setMessage("");
    try {
      const response = await fetch(`/api/admin/manual/old-job-offers/${record.id}/download`, {
        method: "POST", headers: authHeaders(user.token),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not create/email Job Offer PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Job_Offer_${record.reference_number}.pdf`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`Job Offer PDF created, downloaded, and sent to Admin email for ${record.applicant_name}. Admin can forward it to the applicant.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Job Offer PDF email failed");
    } finally { setDownloadingId(null); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/admin/manual/old-job-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save old Job Offer");
      setMessage(`Old Job Offer saved. Reference: ${data.record.reference_number}`);
      setForm(initialForm);
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center"><p>Admin access required.</p></div>;

  const fields: [keyof typeof form, string, boolean?][] = [
    ["referenceNumber", "Old Job Offer Reference Number", true],
    ["applicantName", "Applicant full name", true],
    ["jobTitle", "Position / Job Title", true],
    ["location", "Job Location", true],
    ["salary", "Salary", true],
    ["employerName", "Employer Company Name"],
    ["employerCountry", "Employer Country"],
    ["startDate", "Start Date"],
    ["contractDuration", "Contract Duration"],
  ];

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold sm:text-3xl">Old Job Offer Records</h1><p className="text-sm text-muted-foreground">Save historical reference numbers and Job Offer details without changing existing records.</p></div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/admin">Back to Admin</Link></Button>
            <Button asChild><Link href="/admin/manual">Create New Job Offer</Link></Button>
          </div>
        </div>
        {message && <div role="status" className="rounded-lg border bg-card p-3 text-sm">{message}</div>}
        <section className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold">{editingId ? "Edit Previous Job Offer" : "Add Previous Job Offer"}</h2>
          <p className="mb-4 text-sm text-muted-foreground">Enter the old reference number and details. PDF upload is not required.</p>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {fields.map(([key, label, required]) => <Input key={key} required={Boolean(required)} placeholder={label} value={form[key]} onChange={e => update(key, e.target.value)} />)}
            <Textarea className="sm:col-span-2" placeholder="Admin notes (optional)" value={form.adminNotes} onChange={e => update("adminNotes", e.target.value)} />
            <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update Old Job Offer" : "Save Old Job Offer Record"}</Button>{editingId !== null && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel Edit</Button>}</div>
          </form>
        </section>
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-5"><h2 className="font-semibold">Saved Old Job Offers</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b text-left"><th className="p-3">Reference Number</th><th className="p-3">Applicant</th><th className="p-3">Position</th><th className="p-3">Location</th><th className="p-3">Salary</th><th className="p-3">Employer</th><th className="p-3">Action</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading records…</td></tr> :
                  records.length ? records.map(record => <tr key={record.id} className="border-b last:border-0"><td className="p-3 font-mono text-xs">{record.reference_number}</td><td className="p-3">{record.applicant_name}</td><td className="p-3">{record.job_title}</td><td className="p-3">{record.location}</td><td className="p-3">{record.salary}</td><td className="p-3">{[record.employer_name, record.employer_country].filter(Boolean).join(", ") || "—"}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => startEdit(record)}>Edit</Button><Button size="sm" disabled={downloadingId !== null} onClick={() => void downloadOldOffer(record)}>{downloadingId === record.id ? "Creating & Emailing…" : "Download"}</Button><Button asChild size="sm" variant="outline"><Link href={`/admin/manual?oldOfferId=${record.id}`}>Use in Manual Job Offer</Link></Button></div></td></tr>) :
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No old Job Offer records saved yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
