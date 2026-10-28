import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth, authHeaders } from "@/lib/auth";
import { ArrowLeft, RefreshCw, Search, ClipboardList, Clock3 } from "lucide-react";

type InterviewRecord = {
  id: number;
  work_permit_id: number;
  reference_number: string;
  candidate_name: string;
  questions: string[];
  answers: string[];
  status: string;
  consent: boolean;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
};

export default function AdminInterviews() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [accessReference, setAccessReference] = useState("MVA-2026-69E95F");
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);

  async function loadAccess() {
    if (!user || !isAdmin) return;
    setAccessLoading(true);
    try {
      const response = await fetch("/api/admin/interviews/access", { headers: authHeaders(user.token) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load interview access settings");
      if (data.referenceNumber) setAccessReference(data.referenceNumber);
      setAccessEnabled(Boolean(data.enabled));
    } catch (err: any) {
      toast({ title: "Unable to load interview settings", description: err.message || "Please try again.", variant: "destructive" });
    } finally { setAccessLoading(false); }
  }

  async function saveAccess(enabled: boolean) {
    if (!user || !isAdmin) return;
    setAccessSaving(true);
    try {
      const response = await fetch("/api/admin/interviews/access", {
        method: "POST",
        headers: { ...authHeaders(user.token), "Content-Type": "application/json" },
        body: JSON.stringify({ referenceNumber: accessReference.trim().toUpperCase(), enabled }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update interview access");
      setAccessReference(data.referenceNumber);
      setAccessEnabled(Boolean(data.enabled));
      toast({ title: enabled ? "Interview enabled" : "Interview disabled", description: enabled ? `Only ${data.referenceNumber} can start the interview now.` : "No candidate can start an interview until you enable it again." });
    } catch (err: any) {
      toast({ title: "Could not save interview settings", description: err.message || "Please try again.", variant: "destructive" });
    } finally { setAccessSaving(false); }
  }

  async function load() {
    if (!user || !isAdmin) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/work-permit-interviews", { headers: authHeaders(user.token) });
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.error || "Could not load interview records");
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Unable to load interviews", description: err.message || "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); void loadAccess(); }, [user, isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(r => [r.reference_number, r.candidate_name, r.status].some(v => String(v || "").toLowerCase().includes(q)));
  }, [records, query]);

  if (!isAdmin) return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="mb-3 text-2xl font-bold">Admin access required</h1><Button asChild><Link href="/admin/login">Go to Admin Login</Link></Button></div>;

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div><Button asChild variant="ghost" className="mb-2 -ml-3"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Admin Dashboard</Link></Button><h1 className="text-3xl font-bold text-primary">Work Permit Interviews</h1><p className="mt-2 text-muted-foreground">Interview records linked to existing Work Permit Reference Numbers.</p></div>
          <Button onClick={() => void load()} variant="outline" disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
        <section className="mb-6 rounded-xl border bg-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-primary">Interview access control</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose which reference number is allowed to start an interview. You can enable or stop access at any time.</p>
            </div>
            <Badge variant={accessEnabled ? "default" : "secondary"}>{accessLoading ? "Loading…" : accessEnabled ? "Interview enabled" : "Interview disabled"}</Badge>
          </div>
          <label htmlFor="interview-access-reference" className="mb-2 block text-sm font-semibold">Allowed Work Permit Reference Number</label>
          <Input id="interview-access-reference" value={accessReference} onChange={e => setAccessReference(e.target.value.toUpperCase())} placeholder="MVA-2026-ABC123" autoCapitalize="characters" disabled={accessLoading || accessSaving} className="mb-4 max-w-xl font-mono" />
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void saveAccess(true)} disabled={accessLoading || accessSaving}>{accessSaving ? "Saving…" : "Save & Enable Interview"}</Button>
            <Button type="button" variant="destructive" onClick={() => void saveAccess(false)} disabled={accessLoading || accessSaving}>{accessSaving ? "Saving…" : "Disable Interview"}</Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">When enabled, only the reference number above can start an interview. Other applicants will see the English “interview time has not started yet” message. Disabling stops all new interview starts.</p>
        </section>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-5"><div className="text-sm text-muted-foreground">Total interview attempts</div><div className="mt-1 text-3xl font-bold">{records.length}</div></div>
          <div className="rounded-xl border bg-card p-5"><div className="text-sm text-muted-foreground">Completed</div><div className="mt-1 text-3xl font-bold">{records.filter(r => r.status === "completed").length}</div></div>
          <div className="rounded-xl border bg-card p-5"><div className="text-sm text-muted-foreground">Timed out / in progress</div><div className="mt-1 text-3xl font-bold">{records.filter(r => r.status !== "completed").length}</div></div>
        </div>
        <div className="mb-4 flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by reference number, candidate, or status" /></div>
        {loading && !records.length ? <div className="py-16 text-center text-muted-foreground">Loading interview records…</div> : !filtered.length ? <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-3 h-8 w-8" />No interview records found.</div> : (
          <div className="space-y-4">
            {filtered.map(record => {
              const expanded = selected === record.id;
              return <section key={record.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <button type="button" onClick={() => setSelected(expanded ? null : record.id)} className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left hover:bg-muted/30">
                  <div className="min-w-[220px]"><div className="font-semibold">{record.candidate_name || "Candidate"}</div><div className="mt-1 break-all font-mono text-sm text-primary">{record.reference_number}</div><div className="mt-1 text-xs text-muted-foreground">Started: {record.started_at ? new Date(record.started_at).toLocaleString() : "—"}</div></div>
                  <div className="flex flex-wrap items-center gap-3"><Badge variant={record.status === "completed" ? "default" : "secondary"}>{record.status.replaceAll("_", " ")}</Badge><span className="text-sm text-muted-foreground">{Array.isArray(record.answers) ? record.answers.filter(a => String(a || "").trim()).length : 0}/10 answers</span><span className="text-sm font-semibold text-primary">{expanded ? "Hide answers −" : "View answers +"}</span></div>
                </button>
                {expanded && <div className="border-t p-5">
                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-muted-foreground">Interview ID:</span> {record.id}</div><div><span className="text-muted-foreground">Consent:</span> {record.consent ? "Confirmed" : "Not recorded"}</div><div><span className="text-muted-foreground">Completed:</span> {record.completed_at ? new Date(record.completed_at).toLocaleString() : "Not completed"}</div></div>
                  <div className="space-y-4">{(Array.isArray(record.questions) ? record.questions : []).map((question, i) => <div key={i} className="rounded-lg bg-muted/40 p-4"><div className="mb-2 font-semibold">{i + 1}. {question}</div><p className="whitespace-pre-wrap text-sm leading-6">{Array.isArray(record.answers) && record.answers[i] ? record.answers[i] : "No answer provided."}</p></div>)}</div>
                </div>}
              </section>;
            })}
          </div>
        )}
        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />Candidate answers are stored against their Work Permit Reference Number. Audio is not recorded or stored.</p>
      </div>
    </div>
  );
}
