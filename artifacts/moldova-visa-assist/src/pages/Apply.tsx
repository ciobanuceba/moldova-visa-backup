import React, { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft, Briefcase, CheckCircle2, Upload, X, FileText, Loader2, User, Globe, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGetJob, getGetJobQueryKey, useSubmitApplication } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

const LANGUAGES = ["English", "Romanian", "Russian", "Bengali", "German", "French", "Italian", "Spanish", "Dutch", "Polish", "Czech", "Portuguese"];
const EXPERIENCE_LEVELS = ["0–1 years", "1–3 years", "3–5 years", "5–10 years", "10+ years"];

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(8, "Please enter a valid phone number"),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  passportNumber: z.string().optional(),
  yearsExperience: z.string().optional(),
  skills: z.string().optional(),
  availableFrom: z.string().optional(),
  coverLetter: z.string().optional(),
  experience: z.string().optional(),
});

export default function Apply() {
  const { jobId } = useParams<{ jobId: string }>();
  const id = parseInt(jobId || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isSuccess, setIsSuccess] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGeneralApplication = id === 0;

  const { data: job, isLoading: jobLoading } = useGetJob(id, {
    query: {
      enabled: !isGeneralApplication && !isNaN(id) && id > 0,
      queryKey: getGetJobQueryKey(id),
    },
  });

  const submitApplication = useSubmitApplication();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      nationality: "", dateOfBirth: "", passportNumber: "",
      yearsExperience: "", skills: "", availableFrom: "",
      coverLetter: "", experience: "",
    },
  });

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Resume must be under 5 MB", variant: "destructive" });
      return;
    }

    setResumeFile(file);
    setUploading(true);

    try {
      // Convert to base64 for JSON upload
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, data: base64 }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      setResumeUrl(result.url);
      toast({ title: "Resume uploaded", description: file.name });
    } catch {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
      setResumeFile(null);
    } finally {
      setUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    submitApplication.mutate(
      {
        data: {
          jobId: id,
          ...values,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          languages: selectedLanguages.join(", ") || undefined,
          resumeUrl: resumeUrl ?? undefined,
        } as any,
      },
      {
        onSuccess: (data) => {
          setRefNumber(`APP-${String(data.id).padStart(5, "0")}`);
          setIsSuccess(true);
          window.scrollTo(0, 0);
        },
        onError: () => {
          toast({ title: "Submission failed", description: "Please try again", variant: "destructive" });
        },
      }
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted/20 py-24 flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-10 max-w-lg w-full text-center mx-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary mb-3">Application Submitted!</h1>
          <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary font-mono font-semibold px-4 py-2 rounded-full mb-5 text-sm">
            Reference: {refNumber}
          </div>
          <p className="text-muted-foreground mb-8">
            Thank you for applying{job ? ` for ${job.title}` : ""}. Our team will review your profile and contact you within 2–3 business days.
          </p>
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline mb-6"
            >
              <FileText className="h-4 w-4" /> View uploaded resume
            </a>
          )}
          <div className="space-y-3">
            <Button className="w-full" asChild><Link href="/jobs">Browse More Jobs</Link></Button>
            <Button variant="outline" className="w-full" asChild><Link href="/">Return to Home</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <div className="bg-primary text-white pt-12 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          <Link href={isGeneralApplication ? "/jobs" : `/jobs/${id}`}
            className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {jobLoading && !isGeneralApplication ? (
            <div className="space-y-3"><Skeleton className="h-8 w-72 bg-white/20" /><Skeleton className="h-5 w-48 bg-white/20" /></div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-secondary" />
                <span className="text-secondary text-sm font-medium">
                  {isGeneralApplication ? "General Application" : job?.category ?? "Job Application"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-1">
                {isGeneralApplication ? "Apply Now" : (job?.title ?? "Apply for Position")}
              </h1>
              {job?.location && <p className="text-primary-foreground/70">{job.location} · {job.salary}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Form Card */}
      <div className="container mx-auto px-4 md:px-8 -mt-20">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

              {/* Section 1 — Personal Information */}
              <div className="px-6 md:px-10 pt-8 pb-6 border-b border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-foreground">Personal Information</h2>
                    <p className="text-xs text-muted-foreground">Your identity and contact details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl><Input placeholder="John" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl><Input placeholder="Smith" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl><Input placeholder="+40 700 000 000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nationality" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl><Input placeholder="e.g. Moldovan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="passportNumber" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl><Input placeholder="e.g. A12345678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section 2 — Professional Background */}
              <div className="px-6 md:px-10 py-6 border-b border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-foreground">Professional Background</h2>
                    <p className="text-xs text-muted-foreground">Your experience, skills, and availability</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="skills" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Forklift operation, masonry, customer service" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated list of your main skills</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Languages Spoken</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selectedLanguages.includes(lang)
                              ? "bg-primary text-white border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    {selectedLanguages.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">Selected: {selectedLanguages.join(", ")}</p>
                    )}
                  </div>

                  <FormField control={form.control} name="availableFrom" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available From</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormDescription>Earliest date you can start</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="experience" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Experience Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe your most relevant work history..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Section 3 — Resume Upload */}
              <div className="px-6 md:px-10 py-6 border-b border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-foreground">Resume / CV</h2>
                    <p className="text-xs text-muted-foreground">PDF or DOCX, max 5 MB</p>
                  </div>
                </div>

                {!resumeFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">Click to upload your resume</p>
                    <p className="text-sm text-muted-foreground">PDF or DOCX · Max 5 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {uploading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <FileText className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploading ? "Uploading..." : resumeUrl ? "✓ Uploaded successfully" : "Ready"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {resumeUrl && (
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline">View</a>
                      )}
                      <button
                        type="button"
                        onClick={() => { setResumeFile(null); setResumeUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4 — Cover Letter */}
              <div className="px-6 md:px-10 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-foreground">Cover Letter</h2>
                    <p className="text-xs text-muted-foreground">
                      Optional · <Link href="/letter-builder" className="text-primary underline">Use the Letter Builder</Link> to generate one
                    </p>
                  </div>
                </div>
                <FormField control={form.control} name="coverLetter" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Dear Hiring Manager, I am writing to express my interest in..."
                        className="min-h-[160px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Submit */}
              <div className="px-6 md:px-10 pb-8 pt-2 border-t border-border flex flex-col sm:flex-row gap-3 justify-end">
                <Button type="button" variant="outline" asChild>
                  <Link href={isGeneralApplication ? "/jobs" : `/jobs/${id}`}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={submitApplication.isPending || uploading}
                  className="px-8"
                >
                  {submitApplication.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                  ) : "Submit Application"}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
