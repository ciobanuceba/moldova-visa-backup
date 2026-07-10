import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, FileText, CheckCircle2, XCircle, Clock, LogOut, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, authHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: number;
  job_title: string;
  location: string;
  salary: string;
  category: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface WorkPermit {
  id: number;
  reference_number: string;
  permit_type: string;
  employer_name: string;
  employer_country: string;
  job_title: string;
  status: string;
  payment_status: string;
  created_at: string;
}

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:           { label: "Under Review",     className: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  approved:          { label: "Approved",          className: "bg-green-100 text-green-800",  icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:          { label: "Unsuccessful",      className: "bg-red-100 text-red-800",      icon: <XCircle className="w-3 h-3" /> },
  submitted:         { label: "Submitted",          className: "bg-blue-100 text-blue-800",    icon: <Clock className="w-3 h-3" /> },
  payment_confirmed: { label: "Payment Confirmed", className: "bg-green-100 text-green-800",  icon: <CheckCircle2 className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusBadge[status] ?? { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.icon}{s.label}
    </span>
  );
}

export default function ApplicantDashboard() {
  const [, navigate] = useLocation();
  const { user, logout, isApplicant } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isApplicant) { navigate("/login"); return; }
    loadData();
  }, [isApplicant]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const [appsRes, permitsRes] = await Promise.all([
        fetch("/api/applicant/applications", { headers: authHeaders(user.token) }),
        fetch("/api/applicant/work-permits", { headers: authHeaders(user.token) }),
      ]);
      if (appsRes.ok) setApplications(await appsRes.json());
      if (permitsRes.ok) setWorkPermits(await permitsRes.json());
    } finally {
      setLoading(false);
    }
  }

  async function handlePayWorkPermit(id: number) {
    if (!user) return;
    setPayingId(id);
    try {
      const res = await fetch("/api/payments/work-permit/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ workPermitId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          toast({
            title: "Online payment coming soon",
            description: "We're finalizing our secure payment setup. Please contact us at the details on our Contact page to complete your €99 fee for now.",
          });
        } else {
          toast({ title: "Payment error", description: data.error ?? "Something went wrong. Please try again later.", variant: "destructive" });
        }
        return;
      }
      window.location.href = data.url;
    } finally {
      setPayingId(null);
    }
  }

  function handleLogout() { logout(); navigate("/"); }

  if (!isApplicant) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="bg-primary text-white py-10">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
              <p className="text-primary-foreground/70 text-sm">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8 space-y-10">

        {/* Job Applications */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Job Applications
          </h2>
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : applications.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't applied for any jobs yet.</p>
              <Button asChild><Link href="/jobs">Browse Jobs</Link></Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-card border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-primary">{app.job_title ?? "Position"}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{app.location} · {app.salary}</p>
                    {app.admin_notes && app.status !== "pending" && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded-lg">
                        <span className="font-medium">Note: </span>{app.admin_notes}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Work Permits */}
        <section>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Work Permit Applications
          </h2>
          {loading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : workPermits.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No work permit applications yet.</p>
              <Button asChild variant="outline"><Link href="/work-permit">Apply for Work Permit</Link></Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workPermits.map((wp) => (
                <div key={wp.id} className="bg-card border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-primary">{wp.reference_number}</span>
                      <StatusBadge status={wp.status} />
                      {wp.payment_status === "unpaid" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <CreditCard className="w-3 h-3" /> Payment Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{wp.job_title} · {wp.employer_name}, {wp.employer_country}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {wp.payment_status === "unpaid" && (
                      <Button
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90 text-primary font-semibold"
                        disabled={payingId === wp.id}
                        onClick={() => handlePayWorkPermit(wp.id)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {payingId === wp.id ? "Redirecting…" : "Pay Fee (€99)"}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(wp.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
