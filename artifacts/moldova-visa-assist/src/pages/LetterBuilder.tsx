import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Download, FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const schema = z.object({
  applicantName: z.string().min(2, "Required"),
  applicantPhone: z.string().min(5, "Required"),
  applicantEmail: z.string().email("Valid email required"),
  jobTitle: z.string().min(2, "Required"),
  employerName: z.string().min(2, "Required"),
  employerLocation: z.string().min(2, "Required"),
  strength1: z.string().min(3, "Required"),
  strength2: z.string().min(3, "Required"),
  strength3: z.string().min(3, "Required"),
  yearsExperience: z.string().min(1, "Required"),
  personalStatement: z.string().min(20, "Please write at least 20 characters"),
});

type FormData = z.infer<typeof schema>;

function buildLetterEN(data: FormData): string {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return `${data.applicantName}
${data.applicantPhone} | ${data.applicantEmail}
${today}

Hiring Manager
${data.employerName}
${data.employerLocation}

Dear Hiring Manager,

I am writing to express my sincere interest in the position of ${data.jobTitle} at ${data.employerName}. With ${data.yearsExperience} of relevant experience, I am confident in my ability to make a meaningful contribution to your team.

Throughout my career, I have developed three core strengths that I believe align well with this role:

  • ${data.strength1}
  • ${data.strength2}
  • ${data.strength3}

${data.personalStatement}

I am highly motivated to work with ${data.employerName} and am fully committed to meeting the demands of this position. I welcome the opportunity to discuss how my background and skills can benefit your organisation.

Thank you sincerely for considering my application. I look forward to hearing from you.

Yours faithfully,
${data.applicantName}`;
}

function buildLetterBN(data: FormData): string {
  const today = new Date().toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
  return `${data.applicantName}
${data.applicantPhone} | ${data.applicantEmail}
${today}

নিয়োগ ব্যবস্থাপক
${data.employerName}
${data.employerLocation}

প্রিয় নিয়োগ ব্যবস্থাপক,

আমি অত্যন্ত আগ্রহের সাথে ${data.employerName}-এ ${data.jobTitle} পদের জন্য আবেদন করছি। ${data.yearsExperience} প্রাসঙ্গিক অভিজ্ঞতার সাথে, আমি বিশ্বাস করি যে আমি আপনার দলে গুরুত্বপূর্ণ অবদান রাখতে সক্ষম।

আমার কর্মজীবনে আমি তিনটি মূল দক্ষতা অর্জন করেছি যা এই পদের জন্য উপযুক্ত:

  • ${data.strength1}
  • ${data.strength2}
  • ${data.strength3}

${data.personalStatement}

আমি ${data.employerName}-এর সাথে কাজ করতে অত্যন্ত আগ্রহী এবং এই পদের সকল দায়িত্ব পালনে সম্পূর্ণ প্রতিশ্রুতিবদ্ধ। আমার পটভূমি এবং দক্ষতা কীভাবে আপনার প্রতিষ্ঠানের উপকারে আসতে পারে তা নিয়ে আলোচনার সুযোগের জন্য আমি অপেক্ষা করছি।

আমার আবেদন বিবেচনা করার জন্য আন্তরিক ধন্যবাদ।

শ্রদ্ধার সাথে,
${data.applicantName}`;
}

export default function LetterBuilder() {
  const { locale } = useI18n();
  const { toast } = useToast();
  const [letter, setLetter] = useState<string | null>(null);
  const [letterLang, setLetterLang] = useState<"en" | "bn">("en");
  const [copied, setCopied] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantName: "", applicantPhone: "", applicantEmail: "",
      jobTitle: "", employerName: "", employerLocation: "",
      strength1: "", strength2: "", strength3: "",
      yearsExperience: "", personalStatement: "",
    },
  });

  function onGenerate(values: FormData) {
    const lang = locale === "bn" ? "bn" : "en";
    setLetterLang(lang);
    setLetter(lang === "bn" ? buildLetterBN(values) : buildLetterEN(values));
    setTimeout(() => document.getElementById("letter-output")?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  function handleCopy() {
    if (!letter) return;
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    });
  }

  function handleDownload() {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const switchLang = (lang: "en" | "bn") => {
    const values = form.getValues();
    if (form.formState.isValid || letter) {
      setLetterLang(lang);
      setLetter(lang === "bn" ? buildLetterBN(values) : buildLetterEN(values));
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/20 mb-4">
            <FileText className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Application Letter Builder</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Fill in the details below to instantly generate a professional cover letter — available in English and Bengali.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border bg-muted/30">
              <h2 className="font-serif font-bold text-foreground">Your Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All fields are used to personalise the letter</p>
            </div>
            <div className="px-6 py-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About You</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={form.control} name="applicantName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name *</FormLabel>
                        <FormControl><Input placeholder="John Smith" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="applicantEmail" render={({ field }) => (
                      <FormItem><FormLabel>Email *</FormLabel>
                        <FormControl><Input type="email" placeholder="john@email.com" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="applicantPhone" render={({ field }) => (
                      <FormItem><FormLabel>Phone *</FormLabel>
                        <FormControl><Input placeholder="+40 700 000 000" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                      <FormItem><FormLabel>Years of Experience *</FormLabel>
                        <FormControl><Input placeholder="e.g. 5" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">Job & Employer</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={form.control} name="jobTitle" render={({ field }) => (
                      <FormItem><FormLabel>Job Title *</FormLabel>
                        <FormControl><Input placeholder="e.g. Construction Worker" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="employerName" render={({ field }) => (
                      <FormItem><FormLabel>Employer Name *</FormLabel>
                        <FormControl><Input placeholder="e.g. Bayer GmbH" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="employerLocation" render={({ field }) => (
                      <FormItem className="sm:col-span-2"><FormLabel>Employer Location *</FormLabel>
                        <FormControl><Input placeholder="e.g. Munich, Germany" {...field} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">Your Strengths</p>
                  <FormField control={form.control} name="strength1" render={({ field }) => (
                    <FormItem><FormLabel>Strength 1 *</FormLabel>
                      <FormControl><Input placeholder="e.g. Strong team player with 5 years in construction" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="strength2" render={({ field }) => (
                    <FormItem><FormLabel>Strength 2 *</FormLabel>
                      <FormControl><Input placeholder="e.g. Certified forklift operator" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="strength3" render={({ field }) => (
                    <FormItem><FormLabel>Strength 3 *</FormLabel>
                      <FormControl><Input placeholder="e.g. Fluent in English and Romanian" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1">Personal Statement</p>
                  <FormField control={form.control} name="personalStatement" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Statement *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what makes you the right person for this role, your motivation, and what you bring..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>2–4 sentences about your motivation and fit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full mt-2">
                    <FileText className="mr-2 h-4 w-4" /> Generate Cover Letter
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Output */}
          <div id="letter-output" className="flex flex-col">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-foreground">Generated Letter</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Ready to copy or download</p>
                </div>
                {letter && (
                  <div className="flex items-center gap-1 bg-background border border-border rounded-full p-1">
                    <button onClick={() => switchLang("en")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${letterLang === "en" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                      EN
                    </button>
                    <button onClick={() => switchLang("bn")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${letterLang === "bn" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>
                      বাং
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 p-6">
                {!letter ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground min-h-[300px]">
                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">Your letter will appear here</p>
                    <p className="text-sm mt-1">Fill in the form and click Generate</p>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                    {letter}
                  </pre>
                )}
              </div>

              {letter && (
                <div className="px-6 py-4 border-t border-border flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleCopy}>
                    {copied ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy</>}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" /> Download .txt
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => form.handleSubmit(onGenerate)()} title="Regenerate">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
