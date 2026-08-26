import { useEffect, useState } from "react";
import { authHeaders, useAuth } from "@/lib/auth";

type VisaStatus = "pending" | "review" | "processing" | "decision_ready" | "approved" | "rejected";
type VisaApplication = { id: number; applicantName: string; email: string; referenceNumber: string; visaType: string; destination: string; travelDate: string; status: VisaStatus; createdAt: string };

const STATUS_OPTIONS: Array<{ value: VisaStatus; label: string }> = [
  { value: "pending", label: "Received" },
  { value: "review", label: "Under Review" },
  { value: "processing", label: "Processing" },
  { value: "decision_ready", label: "Decision Ready" },
  { value: "approved", label: "Completed / Approved" },
  { value: "rejected", label: "Rejected" },
];
const STATUS_STEPS: VisaStatus[] = ["pending", "review", "processing", "decision_ready", "approved"];

export default function AdminVisaStatus() {
  const { user, isAdmin } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/admin/visa/visa-applications", { headers: authHeaders(user.token) });
      if (!response.ok) throw new Error("Unable to load visa applications");
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid applications response");
      setApplications(data as VisaApplication[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load visa applications");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin && user) void loadApplications(); }, [isAdmin, user]);

  const changeStatus = async (id: number, status: VisaStatus) => {
    if (!user) return;
    setSavingId(id); setError(null);
    try {
      const response = await fetch(`/api/admin/visa/visa-applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Unable to update visa status");
      setApplications((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update visa status");
    } finally { setSavingId(null); }
  };

  if (!isAdmin) return <div className="p-10 text-center">Admin access required.</div>;

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div><h1 className="text-3xl font-serif font-bold text-primary">Visa Application Status</h1><p className="mt-1 text-muted-foreground">Update the processing status shown to applicants.</p></div>
          <button type="button" onClick={() => void loadApplications()} disabled={loading} className="rounded-md border bg-background px-4 py-2 text-sm font-medium disabled:opacity-50">{loading ? "Refreshing..." : "Refresh"}</button>
        </div>
        {error && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
        {loading && applications.length === 0 ? <div className="rounded-xl border bg-card p-8 text-center">Loading visa applications...</div> : applications.length === 0 ? <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No visa applications yet.</div> : <div className="space-y-4">
          {applications.map((application) => {
            const currentIndex = application.status === "rejected" ? -1 : STATUS_STEPS.indexOf(application.status);
            return <div key={application.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div><p className="font-mono text-sm font-bold text-primary">{application.referenceNumber}</p><h2 className="mt-1 font-semibold">{application.applicantName}</h2><p className="text-sm text-muted-foreground">{application.visaType} · {application.destination} · {application.travelDate}</p><p className="text-xs text-muted-foreground">{application.email}</p></div>
                <select value={application.status} disabled={savingId === application.id} onChange={(event) => void changeStatus(application.id, event.target.value as VisaStatus)} className="h-10 w-full rounded-md border bg-background px-3 text-sm lg:w-64 disabled:opacity-50">
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {STATUS_STEPS.map((step, index) => <span key={step} className={`rounded-full px-3 py-1 text-xs font-medium ${application.status !== "rejected" && currentIndex >= index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{STATUS_OPTIONS.find((option) => option.value === step)?.label}</span>)}
                {application.status === "rejected" && <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">Rejected</span>}
              </div>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
}
