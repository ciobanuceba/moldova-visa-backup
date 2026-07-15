import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Shield, User, Briefcase, FileCheck, Loader2, Upload, File, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Moldova added at the top of the country list
const EU_COUNTRIES = [
  "Moldova", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium",
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

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

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

  // States to hold the 4 uploaded files locally
  const [passportCopyFile, setPassportCopyFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [medicalCertFile, setMedicalCertFile] = useState<File | null>(null);
  const [criminalRecordFile, setCriminalRecordFile] = useState<File | null>(null);

  // Checkbox states
  const [declaredAccurate, setDeclaredAccurate] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passportInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const medicalInputRef = useRef<HTMLInputElement>(null);
  const criminalInputRef = useRef<HTMLInputElement>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: {
    firstName: "", lastName: "", email: "", phone: "", nationality: "",
    dateOfBirth: "", passportNumber: "", passportExpiry: "", currentAddress: "",
  }});

  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: {
    permitType: "", employerName: "", employerCountry: "", jobTitle: "",
    jobSalary: "", startDate: "", contractDuration: "",
  }});

  const handleStep1 = (data: Step1Data) => { setStep1Data(data); setStep(1); window.scrollTo(0, 0); };
  const handleStep2 = (data: Step2Data) => { setStep2Data(data); setStep(2); window.scrollTo(0, 0); };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Data || !step2Data || !declaredAccurate || !agreedToTerms) return;
    setSubmitting(true);

    // Fake success delay
    setTimeout(() => {
      const mockRef = `WP-${Date.now().toString().slice(-8)}`;
      setReferenceNumber(mockRef);
      setStep(3);
      setSubmitting(false);
      window.scrollTo(0, 0);
      toast({ 
        title: "Success!", 
        description: `Application & Documents submitted. Reference: ${mockRef}` 
      });
    }, 2500);
  };

  // Human readable file sizes helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
            Save this reference number. Our immigration specialists will review your application along with the uploaded documents and contact you within <strong>3–5 business days</strong>.
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
    <div className="min-h-screen bg-muted/20 pb-32 overflow-y-auto [scrollbar-width:thin] touch-pan-y">
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
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {PERMIT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
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
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {EU_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
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
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {CONTRACT_DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
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
                <p className="text-xs text-muted-foreground mt-0.5">Please upload the required files below</p>
              </div>

              <form onSubmit={handleStep3} className="px-6 py-5 space-y-6">

                {/* 4 Files Upload Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* File Upload 1: Passport Copy */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Passport Copy (Biodata page)</span>
                      <span className="text-xs text-red-500 font-normal">Required</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-tight">High resolution scan of your passport's bio-data page</p>

                    <input 
                      type="file" 
                      ref={passportInputRef}
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPassportCopyFile(e.target.files[0]);
                        }
                      }}
                    />

                    {!passportCopyFile ? (
                      <div 
                        onClick={() => passportInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter") passportInputRef.current?.click(); }}
                        tabIndex={0}
                        className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition duration-200 flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Upload Passport Scan</p>
                        <p className="text-[10px] text-muted-foreground">PDF, JPG (max. 5MB)</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-primary/30 bg-primary/5 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{passportCopyFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(passportCopyFile.size)}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setPassportCopyFile(null);
                            if (passportInputRef.current) passportInputRef.current.value = "";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* File Upload 2: Passport Size Photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Passport Size Photo</span>
                      <span className="text-xs text-red-500 font-normal">Required</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-tight">Recent passport photo with white background</p>

                    <input 
                      type="file" 
                      ref={photoInputRef}
                      className="hidden" 
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPhotoFile(e.target.files[0]);
                        }
                      }}
                    />

                    {!photoFile ? (
                      <div 
                        onClick={() => photoInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter") photoInputRef.current?.click(); }}
                        tabIndex={0}
                        className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition duration-200 flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Upload Photo</p>
                        <p className="text-[10px] text-muted-foreground">JPG, PNG (max. 3MB)</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-primary/30 bg-primary/5 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{photoFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(photoFile.size)}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setPhotoFile(null);
                            if (photoInputRef.current) photoInputRef.current.value = "";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* File Upload 3: Medical Certificate */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Medical Certificate</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-tight">Health examination certificate from an approved clinic</p>

                    <input 
                      type="file" 
                      ref={medicalInputRef}
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setMedicalCertFile(e.target.files[0]);
                        }
                      }}
                    />

                    {!medicalCertFile ? (
                      <div 
                        onClick={() => medicalInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter") medicalInputRef.current?.click(); }}
                        tabIndex={0}
                        className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition duration-200 flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Upload Medical Cert</p>
                        <p className="text-[10px] text-muted-foreground">PDF, JPG (max. 5MB)</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-primary/30 bg-primary/5 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{medicalCertFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(medicalCertFile.size)}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setMedicalCertFile(null);
                            if (medicalInputRef.current) medicalInputRef.current.value = "";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* File Upload 4: Criminal Record Clearance */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Criminal Record Clearance</span>
                      <span className="text-xs text-muted-foreground font-normal">Optional</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-tight">Police clearance certificate from your home country</p>

                    <input 
                      type="file" 
                      ref={criminalInputRef}
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCriminalRecordFile(e.target.files[0]);
                        }
                      }}
                    />

                    {!criminalRecordFile ? (
                      <div 
                        onClick={() => criminalInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter") criminalInputRef.current?.click(); }}
                        tabIndex={0}
                        className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition duration-200 flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Upload Police Clearance</p>
                        <p className="text-[10px] text-muted-foreground">PDF, JPG (max. 5MB)</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-primary/30 bg-primary/5 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{criminalRecordFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(criminalRecordFile.size)}</p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => {
                            setCriminalRecordFile(null);
                            if (criminalInputRef.current) criminalInputRef.current.value = "";
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> Missing optional documents will not prevent submission, but your case handler will contact you to complete the file before processing begins.
                </div>

                {/* 2 Declaration Checkboxes */}
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="declare-accurate"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={declaredAccurate}
                      onChange={(e) => setDeclaredAccurate(e.target.checked)}
                    />
                    <label htmlFor="declare-accurate" className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed">
                      I declare that all the information and documents provided in this application are true, accurate, and complete. I understand that providing false information can lead to rejection. *
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="agree-terms"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <label htmlFor="agree-terms" className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed">
                      I agree to the terms of service and authorize the immigration specialist team to process my personal data for the purpose of my Moldovan visa/work permit application. *
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || !declaredAccurate || !agreedToTerms || !passportCopyFile || !photoFile}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" />Submit Application</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}