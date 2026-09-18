import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, FileText, CheckCircle2, XCircle, Clock, LogOut, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, authHeaders } from "@/lib/auth";

interface Application {
  id: number;
  reference_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  job_title: string;
  location: string;
  salary: string;
  category: string;
  status: string;
  created_at: string;
  admin_notes?: string | null;
  employer_name?: string | null;
  employer_country?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  years_experience?: number | null;
  skills?: string | null;
  languages?: string | null;
  available_from?: string | null;
  cover_letter?: string | null;
}

interface WorkPermit {
  id: number;
  reference_number: string;
  permit_type: string;
  employer_name: string;
  company_name?: string | null;
  employer_country: string;
  job_title: string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Under Review", className: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  approved: { label: "Approved", className: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Unsuccessful", className: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800", icon: <Clock className="w-3 h-3" /> },
  payment_confirmed: { label: "Payment Confirmed", className: "bg-green-100 text-green-800", icon: <CheckCircle2 className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusBadge[status] ?? { label: status, className: "bg-gray-100 text-gray-700", icon: null };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>{s.icon}{s.label}</span>;
}

export default function ApplicantDashboard() {
  const [, navigate] = useLocation();
  const { user, logout, isApplicant } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openApplication, setOpenApplication] = useState<number | null>(null);
  const [openPermit, setOpenPermit] = useState<number | null>(null);

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

  function handleLogout() { logout(); navigate("/"); }

  if (!isApplicant) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="bg-primary text-white py-10">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
            <div><h1 className="text-2xl font-bold">My Dashboard</h1><p className="text-primary-foreground/70 text-sm">{user?.email}</p></div>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8 space-y-10">
        <section>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5" /> Job Applications</h2>
          {loading ? <div className="text-muted-foreground text-sm">Loading…</div> : applications.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center"><p className="text-muted-foreground mb-4">You haven't applied for any jobs yet.</p><Button asChild><Link href="/jobs">Browse Jobs</Link></Button></div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const isOpen = openApplication === app.id;
                return <div key={app.id} className="bg-card border rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div><h3 className="font-semibold text-primary">{app.job_title ?? "Position"}</h3>{app.reference_number && <p className="text-xs font-mono text-muted-foreground mt-0.5">{app.reference_number}</p>}</div>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{app.location || "Location not specified"} · {app.salary || "Salary not specified"}</p>
                      {app.employer_name && <p className="text-sm text-muted-foreground mt-1">Employer: {app.employer_name}{app.employer_country ? ", " + app.employer_country : ""}</p>}
                      {app.admin_notes && app.status !== "pending" && <p className="text-sm mt-2 p-2 bg-muted rounded-lg"><span className="font-medium">Note: </span>{app.admin_notes}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => setOpenApplication(isOpen ? null : app.id)}>{isOpen ? "Hide Details" : "View Details"}</Button></div>
                  {isOpen && <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Applicant:</span> {app.first_name || ""} {app.last_name || ""}</p>
                    <p><span className="font-medium">Nationality:</span> {app.nationality || "—"}</p>
                    <p><span className="font-medium">Date of Birth:</span> {app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString("en-GB") : "—"}</p>
                    <p><span className="font-medium">Experience:</span> {app.years_experience ?? "—"} years</p>
                    <p><span className="font-medium">Skills:</span> {app.skills || "—"}</p>
                    <p><span className="font-medium">Languages:</span> {app.languages || "—"}</p>
                    <p><span className="font-medium">Available From:</span> {app.available_from || "—"}</p>
                    {app.cover_letter && <p className="md:col-span-2"><span className="font-medium">Cover Letter:</span> {app.cover_letter}</p>}
                    {app.admin_notes && <p className="md:col-span-2 p-3 bg-muted rounded-lg"><span className="font-medium">Admin Update:</span> {app.admin_notes}</p>}
                  </div>}
                </div>;
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Work Permit Applications</h2>
          {loading ? <div className="text-muted-foreground text-sm">Loading…</div> : workPermits.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center"><p className="text-muted-foreground mb-4">No work permit applications yet.</p><Button asChild variant="outline"><Link href="/work-permit">Apply for Work Permit</Link></Button></div>
          ) : (
            <div className="space-y-4">
              {workPermits.map((wp) => {
                const isOpen = openPermit === wp.id;
                return <div key={wp.id} className="bg-card border rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-primary">{wp.reference_number}</span><StatusBadge status={wp.status} />
                        {wp.payment_status === "unpaid" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><CreditCard className="w-3 h-3" /> Payment Required</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{wp.job_title || "Job not specified"} · {wp.employer_name || "Employer not specified"}{wp.employer_country ? ", " + wp.employer_country : ""}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(wp.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    {(wp.payment_status === "unpaid" || wp.payment_status === "rejected") && <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-primary font-semibold" asChild><Link href={`/work-permit/${wp.id}/pay`}><CreditCard className="w-4 h-4 mr-2" />{wp.payment_status === "rejected" ? "Resubmit Payment" : "Pay Fee (€120)"}</Link></Button>}
                    {wp.payment_status === "pending_review" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Payment Under Review</span>}
                    <Button variant="outline" size="sm" onClick={() => setOpenPermit(isOpen ? null : wp.id)}>{isOpen ? "Hide Details" : "View Details"}</Button>
                  </div>
                  {isOpen && <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Permit Type:</span> {wp.permit_type || "—"}</p>
                    <p><span className="font-medium">Employer Name:</span> {wp.employer_name || "—"}</p>
                    <p><span className="font-medium">Company Name:</span> {wp.company_name || "—"}</p>
                    <p><span className="font-medium">Employer Country:</span> {wp.employer_country || "—"}</p>
                    <p><span className="font-medium">Payment:</span> {wp.payment_status || "—"}{wp.payment_method ? " · " + wp.payment_method : ""}</p>
                    {wp.admin_notes && <p className="md:col-span-2 p-3 bg-muted rounded-lg"><span className="font-medium">Admin Update:</span> {wp.admin_notes}</p>}
                  </div>}
                </div>;
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
