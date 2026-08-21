import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, FilePlus2, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authHeaders, useAuth } from "@/lib/auth";

const blankOffer: Record<string, string> = {
  applicantName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "",
  jobTitle: "", location: "", salary: "", employerName: "MOLDOVA VISA ASSIST SRL", startDate: "",
  yearsExperience: "", skills: "", languages: "", experience: "", coverLetter: "", resumeUrl: "", adminNotes: "",
};

const blankPermit: Record<string, string | boolean> = {
  firstName: "", lastName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "",
  passportExpiry: "", currentAddress: "", permitType: "Work Permit", employerName: "", employerCountry: "Moldova",
  jobTitle: "", jobSalary: "", startDate: "", contractDuration: "", adminNotes: "",
  hasPassport: true, hasJobOffer: false, hasMedicalCert: false, hasCriminalRecord: false, hasPhotos: false, hasEducationCert: false,
};

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <label className="space-y-1 block">
      <span className="text-sm font-medium">{label}</span>
      <Input type={type} value={value as string} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function AdminManual() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [offer, setOffer] = useState<Record<string, string>>({ ...blankOffer });
  const [permit, setPermit] = useState<Record<string, string | boolean>>({ ...blankPermit });
  const [offerLoading, setOfferLoading] = useState(false);
  const [permitLoading, setPermitLoading] = useState(false);

  if (!isAdmin || !user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Admin access required.</p></div>;
  }

  const setO = (key: string, value: string) => setOffer((prev) => ({ ...prev, [key]: value }));
  const setP = (key: string, value: string) => setPermit((prev) => ({ ...prev, [key]: value }));
  const setPB = (key: string, value: boolean) => setPermit((prev) => ({ ...prev, [key]: value }));

  async function createOffer(e: any) {
    e.preventDefault();
    setOfferLoading(true);
    try {
      const res = await fetch("/api/admin/manual/job-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify(offer),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate Job Offer");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Manual_Job_Offer_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Manual Job Offer created", description: "The existing Job Offer PDF format was used." });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setOfferLoading(false);
    }
  }

  async function createPermit(e: any) {
    e.preventDefault();
    setPermitLoading(true);
    try {
      const res = await fetch("/api/admin/manual/work-permit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify(permit),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create Work Permit application");
      toast({ title: "Manual Work Permit added", description: `${data.permit?.referenceNumber || "Application"} is now in the normal Admin Work Permit list.` });
      setPermit({ ...blankPermit });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setPermitLoading(false);
    }
  }

  const checks = [
    ["hasPassport", "Passport"],
    ["hasJobOffer", "Job Offer"],
    ["hasMedicalCert", "Medical certificate"],
    ["hasCriminalRecord", "Criminal record"],
    ["hasPhotos", "Photos"],
    ["hasEducationCert", "Education certificate"],
  ];

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Button variant="outline" asChild><Link href="/admin"><ArrowLeft /> Back to Admin</Link></Button>
          <h1 className="text-3xl font-bold mt-4">Manual Admin Tools</h1>
          <p className="text-muted-foreground mt-1">Create manual Job Offers and Work Permit applications without changing existing records.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={createOffer} className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3"><FilePlus2 className="w-6 h-6" /><div><h2 className="text-xl font-semibold">Manual Job Offer</h2><p className="text-sm text-muted-foreground">Uses the existing Job Offer PDF generator.</p></div></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Applicant name *" value={offer.applicantName} onChange={(v: string) => setO("applicantName", v)} />
              <Field label="Email" value={offer.email} onChange={(v: string) => setO("email", v)} type="email" />
              <Field label="Phone" value={offer.phone} onChange={(v: string) => setO("phone", v)} />
              <Field label="Nationality" value={offer.nationality} onChange={(v: string) => setO("nationality", v)} />
              <Field label="Date of birth" value={offer.dateOfBirth} onChange={(v: string) => setO("dateOfBirth", v)} />
              <Field label="Passport number" value={offer.passportNumber} onChange={(v: string) => setO("passportNumber", v)} />
              <Field label="Position *" value={offer.jobTitle} onChange={(v: string) => setO("jobTitle", v)} />
              <Field label="Location *" value={offer.location} onChange={(v: string) => setO("location", v)} />
              <Field label="Salary *" value={offer.salary} onChange={(v: string) => setO("salary", v)} />
              <Field label="Start date" value={offer.startDate} onChange={(v: string) => setO("startDate", v)} />
              <Field label="Experience" value={offer.yearsExperience} onChange={(v: string) => setO("yearsExperience", v)} />
              <Field label="Languages" value={offer.languages} onChange={(v: string) => setO("languages", v)} />
              <Field label="Skills" value={offer.skills} onChange={(v: string) => setO("skills", v)} />
              <Field label="Resume URL" value={offer.resumeUrl} onChange={(v: string) => setO("resumeUrl", v)} />
            </div>
            <label className="space-y-1 block"><span className="text-sm font-medium">Experience details</span><Textarea value={offer.experience} onChange={(e) => setO("experience", e.target.value)} /></label>
            <label className="space-y-1 block"><span className="text-sm font-medium">Cover letter / statement</span><Textarea value={offer.coverLetter} onChange={(e) => setO("coverLetter", e.target.value)} /></label>
            <label className="space-y-1 block"><span className="text-sm font-medium">Admin notes</span><Textarea value={offer.adminNotes} onChange={(e) => setO("adminNotes", e.target.value)} /></label>
            <Button type="submit" disabled={offerLoading || !offer.applicantName || !offer.jobTitle || !offer.location || !offer.salary} className="w-full"><Download /> {offerLoading ? "Generating…" : "Create & Download Job Offer"}</Button>
          </form>

          <form onSubmit={createPermit} className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3"><ShieldPlus className="w-6 h-6" /><div><h2 className="text-xl font-semibold">Manual Work Permit</h2><p className="text-sm text-muted-foreground">Adds a normal Work Permit application. Existing PDF and Approve/Reject actions remain unchanged.</p></div></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="First name *" value={permit.firstName} onChange={(v: string) => setP("firstName", v)} />
              <Field label="Last name *" value={permit.lastName} onChange={(v: string) => setP("lastName", v)} />
              <Field label="Email *" value={permit.email} onChange={(v: string) => setP("email", v)} type="email" />
              <Field label="Phone *" value={permit.phone} onChange={(v: string) => setP("phone", v)} />
              <Field label="Nationality *" value={permit.nationality} onChange={(v: string) => setP("nationality", v)} />
              <Field label="Date of birth *" value={permit.dateOfBirth} onChange={(v: string) => setP("dateOfBirth", v)} />
              <Field label="Passport number *" value={permit.passportNumber} onChange={(v: string) => setP("passportNumber", v)} />
              <Field label="Passport expiry *" value={permit.passportExpiry} onChange={(v: string) => setP("passportExpiry", v)} />
              <Field label="Current address *" value={permit.currentAddress} onChange={(v: string) => setP("currentAddress", v)} />
              <Field label="Permit type *" value={permit.permitType} onChange={(v: string) => setP("permitType", v)} />
              <Field label="Employer *" value={permit.employerName} onChange={(v: string) => setP("employerName", v)} />
              <Field label="Employer country *" value={permit.employerCountry} onChange={(v: string) => setP("employerCountry", v)} />
              <Field label="Job title *" value={permit.jobTitle} onChange={(v: string) => setP("jobTitle", v)} />
              <Field label="Salary *" value={permit.jobSalary} onChange={(v: string) => setP("jobSalary", v)} />
              <Field label="Start date *" value={permit.startDate} onChange={(v: string) => setP("startDate", v)} />
              <Field label="Contract duration *" value={permit.contractDuration} onChange={(v: string) => setP("contractDuration", v)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {checks.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(permit[key])} onChange={(e) => setPB(key, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
            <label className="space-y-1 block"><span className="text-sm font-medium">Admin notes</span><Textarea value={permit.adminNotes as string} onChange={(e) => setP("adminNotes", e.target.value)} /></label>
            <Button type="submit" disabled={permitLoading} className="w-full"><ShieldPlus /> {permitLoading ? "Adding…" : "Add Manual Work Permit"}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
