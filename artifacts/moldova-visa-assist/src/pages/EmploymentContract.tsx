import { useState } from "react";

const NAGAD_NUMBER = "9856 0012 3459 2073";
type Order = { id: number; status: "pending" | "approved" | "rejected"; amount_bdt: number; admin_note?: string | null; reference_number?: string | null };

export default function EmploymentContract() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/contract-pdf/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, referenceNumber, transactionId }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not submit your payment.");
      const check = await fetch(`/api/contract-pdf/orders/${data.order.id}?email=${encodeURIComponent(email)}`);
      setOrder(await check.json());
    } catch (e: any) { setError(e.message || "Connection error. Please try again."); }
    finally { setBusy(false); }
  }

  async function checkStatus() {
    if (!order) return; setBusy(true); setError("");
    try {
      const r = await fetch(`/api/contract-pdf/orders/${order.id}?email=${encodeURIComponent(email)}`);
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Could not check order.");
      setOrder(data);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function download() {
    if (!order) return; setBusy(true); setError("");
    try {
      const r = await fetch(`/api/contract-pdf/orders/${order.id}/download-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await r.json(); if (!r.ok) throw new Error(data.error || "Download is not available.");
      window.location.href = data.downloadUrl;
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-muted/20 py-10 px-4"><div className="mx-auto max-w-xl overflow-hidden rounded-2xl border bg-card shadow-sm">
    <div className="bg-primary px-6 py-7 text-primary-foreground"><h1 className="text-2xl font-bold">Employment Contract PDF</h1><p className="mt-2 text-sm text-primary-foreground/80">Digital document • PDF format</p></div>
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-semibold">Employment Contract</p><p className="text-sm text-muted-foreground">Secure download after payment approval</p></div><p className="text-xl font-bold">৳3,000</p></div>
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-slate-900"><h2 className="font-semibold">Pay with Nagad</h2><p className="mt-2 text-sm">Send ৳3,000 to the following number:</p><p className="my-2 text-xl font-bold tracking-wide">{NAGAD_NUMBER}</p><p className="text-xs text-slate-600">Please verify the recipient details in your Nagad app before sending. Keep your Transaction ID.</p></div>
      {!order ? <form onSubmit={submit} className="space-y-4">
        <div><label className="mb-1 block text-sm font-medium" htmlFor="contract-name">Full Name</label><input id="contract-name" required maxLength={160} value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="contract-email">Email Address</label><input id="contract-email" type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="contract-reference">Work Permit Reference Number</label><input id="contract-reference" required maxLength={40} value={referenceNumber} onChange={e=>setReferenceNumber(e.target.value.toUpperCase())} placeholder="MVA-2026-XXXXXX" className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="contract-txn">Nagad Transaction ID</label><input id="contract-txn" required maxLength={80} value={transactionId} onChange={e=>setTransactionId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" /></div>
        <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Submitting..." : "Submit Payment for Review"}</button>
      </form> : <div className="space-y-3 rounded-xl border p-4"><p className="font-semibold">Order #{order.id}</p><p className="text-sm">Reference Number: <strong>{order.reference_number || "Not linked"}</strong></p><p className="text-sm">Payment status: <strong className="capitalize">{order.status.replace("_"," ")}</strong></p>
        {order.status === "approved" ? <button disabled={busy} onClick={download} className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">Download Employment Contract PDF</button> : <button disabled={busy} onClick={checkStatus} className="w-full rounded-md border px-4 py-3 font-semibold disabled:opacity-60">{busy ? "Checking..." : "Check Payment Status"}</button>}
        {order.status === "pending" && <p className="text-sm text-muted-foreground">Your payment is awaiting admin verification. Please check again later.</p>}
        {order.status === "rejected" && <p className="text-sm text-destructive">Payment could not be approved. {order.admin_note || "Please contact support."}</p>}
      </div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">The document download is enabled only after an administrator approves your payment. The reference number and email must match your work permit record.</p>
    </div></div></div>;
}
