import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Shield, User, Briefcase, FileCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const PERMIT_TYPES = [
  "Seasonal Work Permit (< 6 months)",
  "Short-Stay Work Visa (Type D)",
  "Long-Term Residence Work Permit",
  "EU Blue Card (Highly Skilled)",
  "Posted Worker Permit",
  "Trainee / Internship Permit",
];

const CONTRACT_DURATIONS = [
  "Less than 3 months", "3–6 months", "6–12 months",
  "1–2 years", "2–3 years", "Indefinite",
];

const EU_COUNTRIES = [
  "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium",
  "Austria", "Czech Republic", "Poland", "Portugal", "Sweden", "Denmark",
  "Finland", "Ireland", "Luxembourg", "Romania", "Hungary", "Croatia",
  "Slovenia", "Slovakia", "Bulgaria", "Latvia", "Lithuania", "Estonia",
  "Cyprus", "Malta", "Greece", "United Kingdom", "Switzerland", "Norway",
];

// Step schemas
const step1Schema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(8, "Required"),
  nationality: z.string().min(2, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  passportNumber: z.string().min(3, "Required"),
  passportExpiry: z.string().min(1, "Required"),
  currentAddress: z.string().min(5, "Required"),
});

const step2Schema = z.object({
  permitType: z.string().min(1, "Please select a permit type"),
  employerName: z.string().min(2, "Required"),
  employerCountry: z.string().min(2, "Required"),
  jobTitle: z.string().min(2, "Required"),
  jobSalary: z.string().min(1, "Required"),
  startDate: z.string().min(1, "Required"),
  contractDuration: z.string().min(1, "Required"),
});

const step3Schema = z.object({
  hasPassport: z.boolean(),
  hasJobOffer: z.boolean(),
  hasMedicalCert: z.boolean(),
  hasCriminalRecord: z.boolean(),
  hasPhotos: z.boolean(),
  hasEducationCert: z.boolean(),
}).refine(d => d.hasPassport && d.hasJobOffer, {
  message: "A valid passport and job offer letter are required to proceed",
  path: ["hasPassport"],
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const STEPS = [
  { label: "Personal & Travel Docs", icon: User },
  { label: "Job Offer & Permit Type", icon: Briefcase },
  { label: "Document Checklist", icon: FileCheck },
];

export default function WorkPermit() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: {
    firstName: "", lastName: "", email: "", phone: "", nationality: "",
    dateOfBirth: "", passportNumber: "", passportExpiry: "", currentAddress: "",
  }});

  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: {
    permitType: "", employerName: "", employerCountry: "", jobTitle: "",
    jobSalary: "", startDate: "", contractDuration: "",
  }});

  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: {
    hasPassport: false, hasJobOffer: false, hasMedicalCert: false,
    hasCriminalRecord: false, hasPhotos: false, hasEducationCert: false,
  }});

  const handleStep1 = (data: Step1Data) => { setStep1Data(data); setStep(1); window.scrollTo(0, 0); };
  const handleStep2 = (data: Step2Data) => { setStep2Data(data); setStep(2); window.scrollTo(0, 0); };

  const handleStep3 = async (data: Step3Data) => {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/work-permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...step1Data, ...step2Data, ...data }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const result = await res.json();
      setReferenceNumber(result.referenceNumber);
      setStep(3);
      window.scrollTo(0, 0);
    } catch {
      toast({ title: "Submission failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (step === 3 && referenceNumber) {
    return (
      <div className="min-h-screen bg-muted/20 py-24 flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-3">Application Submitted!</h1>
          <p className="text-sm text-muted-foreground mb-2">Your work permit reference number</p>
          <div className="inline-block bg-primary/10 text-primary font-mono font-bold text-lg px-6 py-3 rounded-xl mb-6 border border-primary/20">
            {referenceNumber}
          </div>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Save this reference number. Our immigration specialists will review your application and contact you within <strong>3–5 business days</strong> with next steps and any additional document requirements.
          </p>
          <div className="space-y-3">
            <Button className="w-full" asChild><Link href="/jobs">Browse Job Opportunities</Link></Button>
            <Button variant="outline" className="w-full" asChild><Link href="/contact">Contact Our Team</Link></Button>
            <Button variant="ghost" className="w-full" asChild><Link href="/">Return to Home</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <div className="bg-primary text-white py-14">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/20 mb-4">
            <Shield className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Work Permit Application</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Apply for your European work permit in three steps. Our specialists review every application personally.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10">
        <div className="max-w-2xl mx-auto">

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-primary z-0 transition-all duration-500"
                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              />
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      done ? "bg-primary border-primary text-white" :
                      active ? "bg-white border-primary text-primary" :
                      "bg-background border-border text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`text-xs mt-2 text-center leading-tight max-w-[80px] ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">Step {step + 1} of {STEPS.length}</p>
          </div>

          {/* Step 1 */}
          {step === 0 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <h2 className="font-serif font-bold text-foreground">Personal & Travel Documents</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your identity and passport information</p>
              </div>
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(handleStep1)} className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form1.control} name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>First Name *</FormLabel>
                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Last Name *</FormLabel>
                        <FormControl><Input placeholder="Smith" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email *</FormLabel>
                        <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone *</FormLabel>
                        <FormControl><Input placeholder="+40 700 000 000" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="nationality" render={({ field }) => (
                      <FormItem><FormLabel>Nationality *</FormLabel>
                        <FormControl><Input placeholder="e.g. Moldovan" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="dateOfBirth" render={({ field }) => (
                      <FormItem><FormLabel>Date of Birth *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="passportNumber" render={({ field }) => (
                      <FormItem><FormLabel>Passport Number *</FormLabel>
                        <FormControl><Input placeholder="A12345678" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="passportExpiry" render={({ field }) => (
                      <FormItem><FormLabel>Passport Expiry Date *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form1.control} name="currentAddress" render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormLabel>Current Home Address *</FormLabel>
                        <FormControl><Input placeholder="Street, City, Country" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit">Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <h2 className="font-serif font-bold text-foreground">Job Offer & Permit Type</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Details about your European job offer</p>
              </div>
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(handleStep2)} className="px-6 py-5 space-y-4">
                  <FormField control={form2.control} name="permitType" render={({ field }) => (
                    <FormItem><FormLabel>Permit Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select permit type" /></SelectTrigger></FormControl>
                        <SelectContent>{PERMIT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form2.control} name="employerName" render={({ field }) => (
                      <FormItem><FormLabel>Employer Name *</FormLabel>
                        <FormControl><Input placeholder="e.g. Bayer GmbH" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form2.control} name="employerCountry" render={({ field }) => (
                      <FormItem><FormLabel>Employer Country *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                          <SelectContent>{EU_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form2.control} name="jobTitle" render={({ field }) => (
                      <FormItem><FormLabel>Job Title *</FormLabel>
                        <FormControl><Input placeholder="e.g. Construction Worker" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form2.control} name="jobSalary" render={({ field }) => (
                      <FormItem><FormLabel>Offered Salary *</FormLabel>
                        <FormControl><Input placeholder="e.g. €2,000/month" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form2.control} name="startDate" render={({ field }) => (
                      <FormItem><FormLabel>Expected Start Date *</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form2.control} name="contractDuration" render={({ field }) => (
                      <FormItem><FormLabel>Contract Duration *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger></FormControl>
                          <SelectContent>{CONTRACT_DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(0)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit">Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <h2 className="font-serif font-bold text-foreground">Document Checklist</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Confirm which documents you currently have</p>
              </div>
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(handleStep3)} className="px-6 py-5">
                  <div className="space-y-4">
                    {[
                      { name: "hasPassport" as const, label: "Valid passport (expiry > 6 months)", desc: "Your passport must be valid for at least 6 months beyond your intended stay", required: true },
                      { name: "hasJobOffer" as const, label: "Signed job offer or employment contract", desc: "Formal written offer from your European employer", required: true },
                      { name: "hasMedicalCert" as const, label: "Medical fitness certificate", desc: "Health examination certificate from an approved clinic" },
                      { name: "hasCriminalRecord" as const, label: "Criminal record clearance", desc: "Police clearance certificate from your home country" },
                      { name: "hasPhotos" as const, label: "Passport-size photographs (×2)", desc: "Recent photos meeting embassy requirements" },
                      { name: "hasEducationCert" as const, label: "Education or qualification certificates", desc: "Diplomas, vocational certificates, or training records" },
                    ].map(doc => (
                      <FormField
                        key={doc.name}
                        control={form3.control}
                        name={doc.name}
                        render={({ field }) => (
                          <FormItem className={`flex gap-4 items-start p-4 rounded-xl border transition-colors ${field.value ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-0.5"
                              />
                            </FormControl>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <FormLabel className="cursor-pointer font-medium">{doc.label}</FormLabel>
                                {doc.required && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">Required</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormMessage>{form3.formState.errors.hasPassport?.message}</FormMessage>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                    <strong>Note:</strong> Missing documents will not prevent submission, but your case handler will contact you to complete the file before processing begins.
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                      ) : (
                        <><CheckCircle2 className="mr-2 h-4 w-4" />Submit Application</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
