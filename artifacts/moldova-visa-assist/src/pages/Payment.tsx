import { useState } from "react";
import { CreditCard, FileText, User, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [fileNumber, setFileNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

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
