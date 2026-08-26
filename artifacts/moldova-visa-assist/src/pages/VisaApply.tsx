import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const VISA_TYPES = [
  ["short-stay", "Short-Stay / Visitor Visa"],
  ["business", "Business Visa"],
  ["family", "Family Visit Visa"],
  ["transit", "Transit Visa"],
  ["long-stay", "Long-Stay Visa"],
] as const;

const COUNTRIES = ["Moldova", "Romania", "Germany", "France", "Italy", "Poland", "Czechia", "Hungary", "Austria", "Other"];

export default function VisaApply() {
  const { toast } = useToast();
  const [visaType, setVisaType] = useState("");
  const [destination, setDestination] = useState("Moldova");
  const [submitted, setSubmitted] = useState<{ referenceNumber: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();

    if (!visaType) {
      toast({ title: "Visa type required", description: "Please select a visa type.", variant: "destructive" });
      return;
    }
    if (!value("firstName") || !value("lastName") || !value("email") || !value("phone") || !value("nationality") || !value("dateOfBirth") || !value("passportNumber") || !value("travelDate") || !value("purpose")) {
      toast({ title: "Missing information", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/visa-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: value("firstName"),
          lastName: value("lastName"),
          email: value("email"),
          phone: value("phone"),
          nationality: value("nationality"),
          dateOfBirth: value("dateOfBirth"),
          passportNumber: value("passportNumber"),
          visaType,
          destination,
          travelDate: value("travelDate"),
          returnDate: value("returnDate"),
          accommodation: value("accommodation"),
          purpose: value("purpose"),
          notes: value("notes"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit visa application");
      setSubmitted({ referenceNumber: data.referenceNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast({ title: "Submission failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[75vh] bg-muted/20 px-4 py-16 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border bg-card p-8 text-center shadow-lg sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-primary">Visa Application Submitted</h1>
          <p className="mt-3 text-muted-foreground">Your application has been received for review. Keep this reference number safe.</p>
          <div className="my-7 rounded-xl bg-primary/5 px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Application Reference</p>
            <p className="mt-1 font-mono text-xl font-bold text-primary">{submitted.referenceNumber}</p>
          </div>
          <p className="mb-7 text-xs leading-5 text-muted-foreground">This is an application-management service and is not an official government visa decision. Submission does not guarantee visa approval.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild><Link href="/check-application">Check Status</Link></Button>
            <Button asChild variant="outline"><Link href="/">Return Home</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-primary px-4 pb-28 pt-12 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-2 text-secondary"><Globe2 className="h-5 w-5" /><span className="text-sm font-medium">Moldova Visa Assist</span></div>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Visa Application</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/75">Complete the application form with your travel and passport information. Required documents can be provided during the verification process.</p>
        </div>
      </div>

      <div className="container mx-auto -mt-16 max-w-4xl px-4">
        <form onSubmit={submit} className="overflow-hidden rounded-2xl border bg-card shadow-lg">
          <section className="border-b p-6 md:p-9">
            <h2 className="mb-1 font-serif text-xl font-bold">1. Applicant Information</h2>
            <p className="mb-6 text-sm text-muted-foreground">Use the same details as shown on your passport.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name *" name="firstName" placeholder="First name" />
              <Field label="Last Name *" name="lastName" placeholder="Last name" />
              <Field label="Email *" name="email" type="email" placeholder="you@example.com" />
              <Field label="Phone *" name="phone" placeholder="+880..." />
              <Field label="Nationality *" name="nationality" placeholder="Bangladeshi" />
              <Field label="Date of Birth *" name="dateOfBirth" type="date" />
              <Field label="Passport Number *" name="passportNumber" placeholder="Passport number" />
            </div>
          </section>

          <section className="border-b p-6 md:p-9">
            <h2 className="mb-1 font-serif text-xl font-bold">2. Visa & Travel Details</h2>
            <p className="mb-6 text-sm text-muted-foreground">Provide your intended travel information.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Visa Type *</label>
                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger><SelectValue placeholder="Select visa type" /></SelectTrigger>
                  <SelectContent>{VISA_TYPES.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination *</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(country => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Field label="Planned Travel Date *" name="travelDate" type="date" />
              <Field label="Expected Return Date" name="returnDate" type="date" />
              <Field label="Accommodation" name="accommodation" placeholder="Hotel / host / address" />
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Purpose of Travel *</label>
                <Textarea name="purpose" placeholder="Briefly explain the purpose of your trip" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea name="notes" placeholder="Anything else we should know?" />
              </div>
            </div>
          </section>

          <section className="p-6 md:p-9">
            <div className="flex gap-3 rounded-xl border bg-muted/30 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-muted-foreground">Your application is submitted for review. Do not upload or send passwords, card PINs, or other unnecessary secrets. Visa approval is determined by the relevant immigration/consular authority.</p>
            </div>
            <Button type="submit" disabled={loading} className="mt-6 w-full rounded-full py-6 text-base">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : "Submit Visa Application"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">By submitting, you confirm that the information provided is accurate.</p>
          </section>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder?: string; type?: string }) {
  return <div className="space-y-2"><label className="text-sm font-medium" htmlFor={name}>{label}</label><Input id={name} name={name} type={type} placeholder={placeholder} required={label.includes("*")} /></div>;
}
