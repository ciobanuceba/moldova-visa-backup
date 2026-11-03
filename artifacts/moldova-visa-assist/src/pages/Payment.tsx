import { useState } from "react";
import { CreditCard, FileText, User, Loader2, ShieldCheck, Copy, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const NAGAD_PAYMENT_NUMBER = "9856 0012 3459 2073";

export default function Payment() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyNagadNumber() {
    try {
      await navigator.clipboard.writeText(NAGAD_PAYMENT_NUMBER.replace(/\s/g, ""));
      setCopied(true);
      toast({ title: "Nagad number copied" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Could not copy number", description: "Please copy the number manually.", variant: "destructive" });
    }
  }

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanRef = fileNumber.trim();
    const value = Number(amount);

    if (!cleanName || !cleanRef || !Number.isFinite(value) || value <= 0) {
      toast({ title: "Please complete all fields", description: "Enter your name, file number and the payment amount.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/general/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, fileNumber: cleanRef, amount: value }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.url) {
        toast({ title: "Payment could not be started", description: result.error || "Payment service is temporarily unavailable. Please try again.", variant: "destructive" });
        return;
      }
      window.location.href = String(result.url);
    } catch {
      toast({ title: "Connection error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-primary text-primary-foreground rounded-t-2xl px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary/20 flex items-center justify-center"><CreditCard className="w-5 h-5" /></div>
            <div><h1 className="text-2xl font-serif font-bold">Payment</h1><p className="text-sm text-primary-foreground/70">Secure online card payment</p></div>
          </div>
        </div>
        <form onSubmit={startPayment} className="bg-card border border-t-0 rounded-b-2xl shadow-sm p-6 md:p-8 space-y-6">
          <section className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <Smartphone className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold">Nagad Payment</h2>
            </div>
            <p className="text-sm text-muted-foreground">Nagad payment number</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <code className="text-lg font-bold tracking-wide text-foreground">{NAGAD_PAYMENT_NUMBER}</code>
              <Button type="button" variant="outline" size="sm" onClick={copyNagadNumber} className="shrink-0">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied" : "Copy Number"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Before sending, verify the recipient details shown in your Nagad app.</p>
          </section>

          <div className="grid gap-2"><Label htmlFor="payment-name"><User className="w-4 h-4 inline mr-1" /> Name</Label><Input id="payment-name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" autoComplete="name" /></div>
          <div className="grid gap-2"><Label htmlFor="payment-file"><FileText className="w-4 h-4 inline mr-1" /> File Number</Label><Input id="payment-file" value={fileNumber} onChange={e => setFileNumber(e.target.value)} placeholder="e.g. MVA-2026-601212" /></div>
          <div className="grid gap-2"><Label htmlFor="payment-amount">Payment Amount (EUR)</Label><Input id="payment-amount" type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter the amount" inputMode="decimal" /></div>
          <div className="rounded-xl border bg-muted/30 p-4 flex gap-3 text-sm text-muted-foreground"><ShieldCheck className="w-5 h-5 text-primary shrink-0" /><p>Your file number and name are used only to associate this payment with the correct application. There is no application search/list for the user.</p></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening secure checkout…</> : <><CreditCard className="w-4 h-4 mr-2" /> Pay by Card</>}</Button>
        </form>
      </div>
    </div>
  );
}
