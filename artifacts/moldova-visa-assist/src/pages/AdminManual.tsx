import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, FilePlus2, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authHeaders, useAuth } from "@/lib/auth";

const blankOffer = {
  applicantName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "",
  jobTitle: "", location: "", salary: "", employerName: "MOLDOVA VISA ASSIST SRL", startDate: "",
  yearsExperience: "", skills: "", languages: "", experience: "", coverLetter: "", resumeUrl: "", adminNotes: "",
};

const blankPermit = {
  firstName: "", lastName: "", email: "", phone: "", nationality: "", dateOfBirth: "", passportNumber: "",
  passportExpiry: "", currentAddress: "", permitType: "Work Permit", employerName: "", employerCountry: "Moldova",
  jobTitle: "", jobSalary: "", startDate: "", contractDuration: "", adminNotes: "",
  hasPassport: true, hasJobOffer: false, hasMedicalCert: false, hasCriminalRecord: false, hasPhotos: false, hasEducationCert: false,
};

type OfferKey = keyof typeof blankOffer;
type PermitTextKey = {
  [K in keyof typeof blankPermit]: typeof blankPermit[K] extends string ? K : never
}[keyof typeof blankPermit];
type PermitBoolKey = {
  [K in keyof typeof blankPermit]: typeof blankPermit[K] extends boolean ? K : never
}[keyof typeof blankPermit];

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1 block"><span className="text-sm font-medium">{label}</span><Input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></label>;
}

export default function AdminManual() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [offer, setOffer] = useState({ ...blankOffer });
  const [permit, setPermit] = useState({ ...blankPermit });
  const [offerLoading, setOfferLoading] = useState(false);
  const [permitLoading, setPermitLoading] = useState(false);

  if (!isAdmin || !user) return <div className="min-h-screen flex items-center justify-center"><p>Admin access required.</p></div>;

  const setO = (key: OfferKey) => (value: string) => setOffer(prev => ({ ...prev, [key]: value }));
  const setP = (key: PermitTextKey) => (value: string) => setPermit(prev => ({ ...prev, [key]: value }));
  const setPermitBool = (key: PermitBoolKey, value: boolean) => setPermit(prev => ({ ...prev, [key]: value }));

  async function createOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setOfferLoading(true);
    try {
      const res = await fetch("/api/admin/manual/job-offer", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(user.token) }, body: JSON.stringify(offer) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed to generate Job Offer"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Manual_Job_Offer_${Date.now()}.pdf`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast({ title: "Manual Job Offer created", description: "The existing Job Offer PDF format was used; no application was changed." });
    } catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }); }
    finally { setOfferLoading(false); }
  }

  async function createPermit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPermitLoading(true);
    try {
      const res = await fetch("/api/admin/manual/work-permit", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(user.token) }, body: JSON.stringify(permit) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Failed to create Work Permit application");
      toast({ title: "Manual Work Permit added", description: `${d.permit?.referenceNumber || "Application"} is now in the normal Admin Work Permit list.` });
      setPermit({ ...blankPermit });
    } catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }); }
    finally { setPermitLoading(false); }
  }

  return <div className="min-h-screen bg-muted/20 py-8 px-4">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4"><div><Button variant="outline" asChild><Link href="/admin"><ArrowLeft /> Back to Admin</Link></Button><h1 className="text-3xl font-bold mt-4">Manual Admin Tools</h1><p className="text-muted-foreground mt-1">Add manual records without changing existing applications or the existing Work Permit PDF.</p></div></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={createOffer} className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3"><FilePlus2 className="w-6 h-6" /><div><h2 className="text-xl font-semibold">Manual Job Offer</h2><p className="text-sm text-muted-foreground">Generates the existing Job Offer PDF only.</p></div></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Applicant name *" value={offer.applicantName} onChange={setO("applicantName")} /><Field label="Email" value={offer.email} onChange={setO("email")} type="email" /><Field label="Phone" value={offer.phone} onChange={setO("phone")} /><Field label="Nationality" value={offer.nationality} onChange={setO("nationality")} /><Field label="Date of birth" value={offer.dateOfBirth} onChange={setO("dateOfBirth")} /><Field label="Passport number" value={offer.passportNumber} onChange={setO("passportNumber")} /><Field label="Position *" value={offer.jobTitle} onChange={setO("jobTitle")} /><Field label="Location *" value={offer.location} onChange={setO("location")} /><Field label="Salary *" value={offer.salary} onChange={setO("salary")} /><Field label="Start date" value={offer.startDate} onChange={setO("startDate")} /><Field label="Experience" value={offer.yearsExperience} onChange={setO("yearsExperience")} /><Field label="Languages" value={offer.languages} onChange={setO("languages")} /><Field label="Skills" value={offer.skills} onChange={setO("skills")} /><Field label="Resume URL" value={offer.resumeUrl} onChange={setO("resumeUrl")} />
          </div>
          <label className="space-y-1 block"><span className="text-sm font-medium">Experience details</span><Textarea value={offer.experience} onChange={e => setO("experience")(e.target.value)} /></label>
          <label className="space-y-1 block"><span className="text-sm font-medium">Cover letter / statement</span><Textarea value={offer.coverLetter} onChange={e => setO("coverLetter")(e.target.value)} /></label>
          <label className="space-y-1 block"><span className="text-sm font-medium">Admin notes</span><Textarea value={offer.adminNotes} onChange={e => setO("adminNotes")(e.target.value)} /></label>
          <Button type="submit" disabled={offerLoading || !offer.applicantName || !offer.jobTitle || !offer.location || !offer.salary} className="w-full"><Download /> {offerLoading ? "Generating…" : "Create & Download Job Offer"}</Button>
        </form>
        <form onSubmit={createPermit} className="bg-card border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3"><ShieldPlus className="w-6 h-6" /><div><h2 className="text-xl font-semibold">Manual Work Permit</h2><p className="text-sm text-muted-foreground">Adds a normal Work Permit application. Existing PDF and Approve/Reject actions stay unchanged.</p></div></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="First name *" value={permit.firstName} onChange={setP("firstName")} /><Field label="Last name *" value={permit.lastName} onChange={setP("lastName")} /><Field label="Email *" value={permit.email} onChange={setP("email")} type="email" /><Field label="Phone *" value={permit.phone} onChange={setP("phone")} /><Field label="Nationality *" value={permit.nationality} onChange={setP("nationality")} /><Field label="Date of birth *" value={permit.dateOfBirth} onChange={setP("dateOfBirth")} /><Field label="Passport number *" value={permit.passportNumber} onChange={setP("passportNumber")} /><Field label="Passport expiry *" value={permit.passportExpiry} onChange={setP("passportExpiry")} /><Field label="Current address *" value={permit.currentAddress} onChange={setP("currentAddress")} /><Field label="Permit type *" value={permit.permitType} onChange={setP("permitType")} /><Field label="Employer *" value={permit.employerName} onChange={setP("employerName")} /><Field label="Employer country *" value={permit.employerCountry} onChange={setP("employerCountry")} /><Field label="Job title *" value={permit.jobTitle} onChange={setP("jobTitle")} /><Field label="Salary *" value={permit.jobSalary} onChange={setP("jobSalary")} /><Field label="Start date *" value={permit.startDate} onChange={setP("startDate")} /><Field label="Contract duration *" value={permit.contractDuration} onChange={setP("contractDuration")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {([['hasPassport','Passport'],['hasJobOffer','Job Offer'],['hasMedicalCert','Medical certificate'],['hasCriminalRecord','Criminal record'],['hasPhotos','Photos'],['hasEducationCert','Education certificate']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={permit[key]} onChange={e => setPermitBool(key, e.target.checked)} />{label}</label>)}
          </div>
          <label className="space-y-1 block"><span className="text-sm font-medium">Admin notes</span><Textarea value={permit.adminNotes} onChange={e => setP("adminNotes")(e.target.value)} /></label>
          <Button type="submit" disabled={permitLoading} className="w-full"><ShieldPlus /> {permitLoading ? "Adding…" : "Add Manual Work Permit"}</Button>
        </form>
      </div>
    </div>
  </div>;
}
