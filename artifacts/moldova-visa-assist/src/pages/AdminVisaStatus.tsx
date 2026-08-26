import { useEffect, useState } from "react";
import { authHeaders, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statuses = ["pending", "review", "processing", "decision_ready", "approved", "rejected"] as const;
const labels: Record<string, string> = {
  pending: "Received",
  review: "Under Review",
  processing: "Processing",
  decision_ready: "Decision Ready",
  approved: "Completed / Approved",
  rejected: "Rejected",
};

type Visa = {
  id: number;
  applicantName: string;
  email: string;
  referenceNumber: string;
  visaType: string;
  destination: string;
  travelDate: string;
  status: string;
  createdAt: string;
};

export default function AdminVisaStatus() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/visa/admin/visa-applications", {
        headers: authHeaders(user.token),
      });
      if (!response.ok) throw new Error("Unable to load applications");
      setItems((await response.json()) as Visa[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && user) void load();
  }, [isAdmin, user]);

  async function updateStatus(id: number, status: string) {
    if (!user) return;
    setSaving(id);
    try {
      const response = await fetch(`/api/admin/visa/admin/visa-applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Unable to update status");
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } finally {
      setSaving(null);
    }
  }

  if (!isAdmin) return <div className="p-10 text-center">Admin access required.</div>;

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="text-3xl font-serif font-bold text-primary">Visa Application Status</h1>
          <p className="mt-1 text-muted-foreground">Update the processing status shown to applicants.</p>
        </div>
        {loading ? (
          <div className="rounded-xl border bg-card p-8 text-center">Loading applications...</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No visa applications yet.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-primary">{item.referenceNumber}</p>
                    <h2 className="mt-1 font-semibold">{item.applicantName}</h2>
                    <p className="text-sm text-muted-foreground">{item.visaType} · {item.destination} · {item.travelDate}</p>
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                  </div>
                  <div className="flex w-full gap-3 lg:w-auto">
                    <Select value={item.status} onValueChange={(status) => void updateStatus(item.id, status)} disabled={saving === item.id}>
                      <SelectTrigger className="w-full lg:w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{labels[status]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => void load()}>Refresh</Button>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {statuses.slice(0, 5).map((status) => (
                    <span key={status} className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {labels[status]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
