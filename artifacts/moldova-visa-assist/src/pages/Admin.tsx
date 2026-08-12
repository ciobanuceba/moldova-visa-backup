import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListApplications, getListApplicationsQueryKey, useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, LogOut, FileText, Lock, BarChart2,
  Users, Briefcase, TrendingUp, Euro, ClipboardList, Activity, CreditCard
} from "lucide-react";
import { useAuth, authHeaders } from "@/lib/auth";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

// ── Types ────────────────────────────────────────────────────────────────────

const jobSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  location: z.string().min(2),
  type: z.string().min(2),
  description: z.string().min(10),
  requirements: z.string().min(10),
  salary: z.string().min(2),
  benefits: z.string().optional(),
});

interface WorkPermit {
  id: number; reference_number: string; first_name: string; last_name: string;
  email: string; permit_type: string; employer_name: string; employer_country: string;
  job_title: string; status: string; payment_status: string; created_at: string;
}

interface PaymentReceipt {
  id: number; reference_number: string; first_name: string; last_name: string; email: string;
  job_title: string; employer_name: string; employer_country: string; status: string;
  payment_status: string; payment_method: string | null; receipt_url: string | null;
  receipt_filename: string | null; receipt_uploaded_at: string | null;
  payment_reviewed_at: string | null; payment_rejection_reason: string | null; created_at: string;
}

interface AdminStats {
  applications: { total: number; pending: number; approved: number; rejected: number; approvalRate: number };
  workPermits: { total: number; submitted: number; paymentConfirmed: number; approved: number; rejected: number; paidCount: number; revenue: number };
  charts: {
    applicationsByDay: { day: string; applications: number }[];
    byCategory: { category: string; count: number }[];
    byCountry: { country: string; count: number }[];
    registrationsByDay: { day: string; signups: number }[];
  };
  recentActivity: { type: string; name: string; status: string; createdAt: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#1a2744", "#d4a029", "#16a34a", "#dc2626", "#6366f1", "#0ea5e9"];

const statusVariant = (s: string) => {
  if (s === "approved") return "default";
  if (s === "rejected") return "destructive";
  return "outline";
};

function StatCard({ icon, label, value, sub, color = "primary" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        color === "green" ? "bg-green-100 text-green-600" :
        color === "yellow" ? "bg-yellow-100 text-yellow-700" :
        color === "red" ? "bg-red-100 text-red-600" :
        color === "blue" ? "bg-blue-100 text-blue-600" :
        "bg-primary/10 text-primary"
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("statistics");

  // applications
  const [actionApp, setActionApp] = useState<{ id: number; name: string; action: "approve" | "reject"; jobTitle: string } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // work permits
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([]);
  const [wpLoading, setWpLoading] = useState(false);
  const [wpLoaded, setWpLoaded] = useState(false);
  const [wpActionLoading, setWpActionLoading] = useState<number | null>(null);

  // payment receipts
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [rejectPayment, setRejectPayment] = useState<PaymentReceipt | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  // statistics
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Keep hooks unconditional so logging in/out does not change the hook order.
  const { data: applications, isLoading: appsLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey(), enabled: isAdmin }
  });
  const { data: jobs, isLoading: jobsLoading } = useListJobs(undefined, {
    query: { queryKey: getListJobsQueryKey(), enabled: isAdmin }
  });
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: "", category: "", location: "", type: "Full-time", description: "", requirements: "", salary: "", benefits: "" },
  });

  // ── Load stats on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isAdmin) return;
    loadStats();
  }, [user, isAdmin]);

  async function loadStats() {
    if (!user) return;
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeaders(user.token) });
      if (res.ok) setStats(await res.json());
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadWorkPermits() {
    if (!user) return;
    setWpLoading(true);
    try {
      const res = await fetch("/api/admin/work-permits", { headers: authHeaders(user.token) });
      if (res.ok) { setWorkPermits(await res.json()); setWpLoaded(true); }
    } finally { setWpLoading(false); }
  }

  async function onSubmit(values: z.infer<typeof jobSchema>) {
    if (!user) return;
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to create job listing.", variant: "destructive" });
        return;
      }
      toast({ title: "Job Created", description: "Published successfully." });
      form.reset();
      await queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      setActiveTab("jobs");
      loadStats();
    } catch {
      toast({ title: "Error", description: "Could not connect to the server.", variant: "destructive" });
    }
  }

  async function handleApproveReject() {
    if (!actionApp || !user) return;
    setActionLoading(true);
    const isApprove = actionApp.action === "approve";
    try {
      const res = await fetch(`/api/admin/applications/${actionApp.id}/${actionApp.action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify(isApprove ? { notes: actionNotes } : { reason: actionNotes }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      toast({
        title: isApprove ? "Application Approved" : "Application Rejected",
        description: isApprove ? "Offer letter sent via email." : "Rejection email sent.",
      });
      queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      setActionApp(null);
      setActionNotes("");
      loadStats();
    } finally { setActionLoading(false); }
  }

  async function loadPayments() {
    if (paymentsLoaded || !user) return;
    setPaymentsLoading(true);
    try {
      const res = await fetch("/api/admin/payments", { headers: authHeaders(user.token) });
      if (res.ok) { setPayments(await res.json()); setPaymentsLoaded(true); }
    } finally { setPaymentsLoading(false); }
  }

  async function handlePaymentApprove(id: number) {
    if (!user) return;
    setPaymentActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
      });
      if (res.ok) {
        toast({ title: "Payment Approved", description: "Applicant has been notified by email." });
        setPayments(prev => prev.map(p => p.id === id ? { ...p, payment_status: "paid", payment_reviewed_at: new Date().toISOString() } : p));
        loadWorkPermits();
        loadStats();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to approve payment", variant: "destructive" });
      }
    } finally { setPaymentActionLoading(false); }
  }

  async function handlePaymentReject() {
    if (!rejectPayment || !user) return;
    setPaymentActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${rejectPayment.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        toast({ title: "Payment Rejected", description: "Applicant has been notified by email." });
        setPayments(prev => prev.map(p => p.id === rejectPayment.id ? { ...p, payment_status: "rejected", payment_rejection_reason: rejectReason } : p));
        setRejectPayment(null);
        setRejectReason("");
        loadWorkPermits();
        loadStats();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to reject payment", variant: "destructive" });
      }
    } finally { setPaymentActionLoading(false); }
  }

  // Custom function to handle "Accept Payment" from Work Permit list directly
  async function handleApprovePaymentDirect(permitId: number) {
    if (!user) return;
    setWpActionLoading(permitId);
    try {
      const res = await fetch(`/api/work-permits/${permitId}/approve-payment`, {
        method: "PATCH",
        headers: { ...authHeaders(user.token) },
      });
      
      if (res.ok) {
        toast({ title: "Payment Accepted", description: "Payment status updated and confirmation email sent successfully!" });
        // Refresh work permit list
        const refreshedPermits = await fetch("/api/admin/work-permits", { headers: authHeaders(user.token) });
        if (refreshedPermits.ok) setWorkPermits(await refreshedPermits.json());
        loadStats();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to accept payment", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setWpActionLoading(null);
    }
  }

  async function handleWpAction(id: number, action: "approve" | "reject") {
    if (!user) return;
    const res = await fetch(`/api/admin/work-permits/${id}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast({ title: action === "approve" ? "Work Permit Approved" : "Work Permit Rejected" });
      setWorkPermits(prev => prev.map(wp => wp.id === id ? { ...wp, status: action === "approve" ? "approved" : "rejected" } : wp));
      loadStats();
    }
  }

  // ── Not logged in guard ───────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
        <div className="bg-card border rounded-xl shadow-md p-10 max-w-md w-full text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in with your admin credentials.</p>
          <Button asChild className="w-full"><Link href="/admin/login">Go to Admin Login</Link></Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 md:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === "work-permits") loadWorkPermits();
        if (v === "payments") loadPayments();
        if (v === "statistics") loadStats();
      }}>
        <TabsList className="mb-8 flex-wrap h-auto">
          <TabsTrigger value="statistics"><BarChart2 className="w-4 h-4 mr-1.5" />Statistics</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="work-permits">Work Permits</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="jobs">Manage Jobs</TabsTrigger>
          <TabsTrigger value="create">Post New Job</TabsTrigger>
        </TabsList>

        {/* ── Statistics Tab ────────────────────────────────────────────── */}
        <TabsContent value="statistics">
          {statsLoading || !stats ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Activity className="w-5 h-5 mr-2 animate-pulse" /> Loading statistics…
            </div>
          ) : (
            <div className="space-y-8">

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Total Applications" value={stats.applications.total} sub={`${stats.applications.pending} pending`} />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Approval Rate" value={`${stats.applications.approvalRate}%`} sub={`${stats.applications.approved} approved`} color="green" />
                <StatCard icon={<FileText className="w-5 h-5" />} label="Work Permits" value={stats.workPermits.total} sub={`${stats.workPermits.paidCount} paid`} color="blue" />
                <StatCard icon={<Euro className="w-5 h-5" />} label="Permit Revenue" value={`€${stats.workPermits.revenue}`} sub={`${stats.workPermits.paidCount} × €120`} color="yellow" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved" value={stats.applications.approved} color="green" />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={stats.applications.rejected} color="red" />
                <StatCard icon={<Users className="w-5 h-5" />} label="Permits Approved" value={stats.workPermits.approved} color="green" />
                <StatCard icon={<Briefcase className="w-5 h-5" />} label="Pending Payment" value={stats.workPermits.submitted} color="yellow" />
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Application status pie */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold text-primary mb-4">Application Status</h3>
                  {stats.applications.total === 0 ? (
                    <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Pending",  value: stats.applications.pending },
                            { name: "Approved", value: stats.applications.approved },
                            { name: "Rejected", value: stats.applications.rejected },
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" nameKey="name"
                        >
                          {["#d4a029", "#16a34a", "#dc2626"].map((c, i) => (
                            <Cell key={i} fill={c} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Applications by category */}
                <div className="bg-card border rounded-xl p-6 lg:col-span-2">
                  <h3 className="font-semibold text-primary mb-4">Applications by Category</h3>
                  {!Array.isArray(stats.charts.byCategory) || stats.charts.byCategory.length === 0 ? (
                    <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.charts.byCategory} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Applications" fill="#1a2744" radius={[4, 4, 0, 0]}>
                          {stats.charts.byCategory.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Applications over time */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold text-primary mb-1">Applications — Last 30 Days</h3>
                  <p className="text-xs text-muted-foreground mb-4">Daily application volume</p>
                  {stats.charts.applicationsByDay.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No recent applications</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={stats.charts.applicationsByDay} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="applications" stroke="#d4a029" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Work permits by country */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold text-primary mb-1">Work Permits by Country</h3>
                  <p className="text-xs text-muted-foreground mb-4">Employer country distribution</p>
                  {!Array.isArray(stats.charts.byCountry) || stats.charts.byCountry.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No work permits yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.charts.byCountry} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis dataKey="country" type="category" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="count" name="Permits" fill="#1a2744" radius={[0, 4, 4, 0]}>
                          {stats.charts.byCountry.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Recent Activity
                </h3>
                {!Array.isArray(stats.recentActivity) || stats.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentActivity.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.status === "approved" ? "bg-green-500" :
                          item.status === "rejected" ? "bg-red-500" :
                          item.status === "payment_confirmed" ? "bg-blue-500" : "bg-yellow-500"
                        }`} />
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs capitalize h-5 px-1.5">
                          {item.type === "work_permit" ? "Work Permit" : "Application"}
                        </Badge>
                        <Badge variant={statusVariant(item.status)} className="text-xs capitalize h-5 px-1.5">
                          {item.status.replace("_", " ")}
                        </Badge>
                        <span className="ml-auto text-muted-foreground text-xs whitespace-nowrap">
                          {format(new Date(item.createdAt), "MMM d, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </TabsContent>

        {/* ── Applications Tab ──────────────────────────────────────────── */}
        <TabsContent value="applications">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : applications && applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.firstName} {app.lastName}</TableCell>
                      <TableCell>{app.jobId === 0 ? <Badge variant="secondary">General</Badge> : `Job #${app.jobId}`}</TableCell>
                      <TableCell>
                        <div className="text-sm">{app.email}</div>
                        <div className="text-xs text-muted-foreground">{app.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(app.status)} className="capitalize">{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(app.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => { setActionApp({ id: app.id, name: `${app.firstName} ${app.lastName}`, action: "approve", jobTitle: `Job #${app.jobId}` }); setActionNotes(""); }}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => { setActionApp({ id: app.id, name: `${app.firstName} ${app.lastName}`, action: "reject", jobTitle: `Job #${app.jobId}` }); setActionNotes(""); }}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No applications found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Work Permits Tab ──────────────────────────────────────────── */}
        <TabsContent value="work-permits">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job / Employer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wpLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : workPermits.length > 0 ? (
                  workPermits.map((wp) => (
                    <TableRow key={wp.id}>
                      <TableCell className="font-mono text-xs">{wp.reference_number}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{wp.first_name} {wp.last_name}</div>
                        <div className="text-xs text-muted-foreground">{wp.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{wp.job_title}</div>
                        <div className="text-xs text-muted-foreground">{wp.employer_name}, {wp.employer_country}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wp.payment_status === "paid" ? "default" : "outline"} className="text-xs capitalize">
                          {wp.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(wp.status)} className="capitalize text-xs">{wp.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(wp.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {/* Accept Payment button dynamically shows up if status is pending_payment */}
                          {wp.status === "pending_payment" && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white font-bold"
                              disabled={wpActionLoading === wp.id}
                              onClick={() => handleApprovePaymentDirect(wp.id)}
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Accept Payment
                            </Button>
                          )}
                          
                          {(wp.status === "submitted" || wp.status === "payment_confirmed") && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleWpAction(wp.id, "approve")}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleWpAction(wp.id, "reject")}>
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {wpLoaded ? "No work permit applications." : "Loading…"}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Payments Tab ─────────────────────────────────────────────── */}
        <TabsContent value="payments">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Job / Employer</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading payment receipts…</TableCell></TableRow>
                ) : payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.reference_number}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{payment.first_name} {payment.last_name}</div>
                        <div className="text-xs text-muted-foreground">{payment.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{payment.job_title}</div>
                        <div className="text-xs text-muted-foreground">{payment.employer_name}, {payment.employer_country}</div>
                      </TableCell>
                      <TableCell>
                        {payment.receipt_url ? (
                          <a
                            href={payment.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                          >
                            View receipt
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not available</span>
                        )}
                        {payment.payment_method && (
                          <div className="text-xs text-muted-foreground capitalize">{payment.payment_method}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={payment.payment_status === "paid" ? "default" : payment.payment_status === "rejected" ? "destructive" : "outline"}
                          className="capitalize text-xs"
                        >
                          {payment.payment_status?.replace("_", " ") || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {payment.receipt_uploaded_at
                          ? format(new Date(payment.receipt_uploaded_at), "MMM d, yyyy")
                          : format(new Date(payment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {payment.payment_status !== "paid" && payment.payment_status !== "rejected" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              disabled={paymentActionLoading}
                              onClick={() => handlePaymentApprove(payment.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={paymentActionLoading}
                              onClick={() => { setRejectPayment(payment); setRejectReason(""); }}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No payment receipts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Jobs Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="jobs">
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category & Location</TableHead>
                  <TableHead>Type & Salary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading…</TableCell></TableRow>
                ) : jobs && jobs.length > 0 ? (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        <div className="text-sm">{job.category}</div>
                        <div className="text-xs text-muted-foreground">{job.location}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{job.type}</div>
                        <div className="text-xs text-muted-foreground">{job.salary}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.isActive ? "default" : "secondary"}>{job.isActive ? "Active" : "Closed"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No jobs found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Create Job Tab ────────────────────────────────────────────── */}
        <TabsContent value="create">
          <div className="bg-card border rounded-xl shadow-sm p-6 max-w-4xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-primary">Post a New Job</h2>
              <p className="text-sm text-muted-foreground mt-1">Create a verified opportunity for applicants.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g. Senior Electrician" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Construction" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Berlin, Germany" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Seasonal">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="salary" render={({ field }) => (
                    <FormItem><FormLabel>Salary</FormLabel><FormControl><Input placeholder="e.g. €2,500–€3,000/month" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="benefits" render={({ field }) => (
                    <FormItem><FormLabel>Benefits <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel><FormControl><Input placeholder="e.g. Accommodation, meals" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={5} placeholder="Describe the role and responsibilities..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="requirements" render={({ field }) => (
                  <FormItem><FormLabel>Requirements</FormLabel><FormControl><Textarea rows={4} placeholder="List the skills, experience, and documents required..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>Clear</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Publishing…" : "Publish Job"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Application Dialog */}
      <Dialog open={actionApp !== null} onOpenChange={(o) => !o && setActionApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionApp?.action} Application</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to {actionApp?.action} the application from <strong>{actionApp?.name}</strong> for {actionApp?.jobTitle}?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">{actionApp?.action === "approve" ? "Internal Notes (Optional)" : "Reason for Rejection"}</label>
              <Textarea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder={actionApp?.action === "approve" ? "Add notes about the offer..." : "Explain why the application was rejected..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionApp(null)}>Cancel</Button>
            <Button variant={actionApp?.action === "reject" ? "destructive" : "default"} disabled={actionLoading} onClick={handleApproveReject}>
              {actionLoading ? "Processing..." : actionApp?.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectPayment !== null} onOpenChange={(o) => !o && setRejectPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Rejecting payment for <strong>{rejectPayment?.first_name} {rejectPayment?.last_name}</strong> (Ref: {rejectPayment?.reference_number}).
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Screenshot is blurry, transaction ID not found, incorrect amount..." required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectPayment(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={paymentActionLoading || !rejectReason.trim()} onClick={handlePaymentReject}>
              {paymentActionLoading ? "Processing..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}