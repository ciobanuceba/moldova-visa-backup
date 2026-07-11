import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  ShieldCheck, Copy, Check, UploadCloud, Clock, CheckCircle2, XCircle,
  Loader2, ArrowLeft, QrCode, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, authHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface PaymentInfo {
  referenceNumber: string;
  amount: string;
  paymentStatus: string;
  paymentMethod: string | null;
  receiptUrl: string | null;
  receiptFilename: string | null;
  receiptUploadedAt: string | null;
  rejectionReason: string | null;
  methods: Array<{ type: string; label: string; email?: string; number?: string; qrUrl?: string }>;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WorkPermitPayment() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isApplicant } = useAuth();
  const { toast } = useToast();

  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isApplicant) { navigate("/login"); return; }
    loadInfo();
  }, [isApplicant, id]);

  async function loadInfo() {
    if (!user || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/work-permit/${id}/info`, { headers: authHeaders(user.token) });
      if (!res.ok) {
        toast({ title: "Unable to load payment details", variant: "destructive" });
        return;
      }
      const data: PaymentInfo = await res.json();
      setInfo(data);
      if (!selectedMethod && data.methods.length > 0) setSelectedMethod(data.methods[0].type);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast({ title: "Unsupported file type", description: "Please upload a JPG, PNG, WEBP, or PDF file.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 5 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!user || !id || !file || !selectedMethod) return;
    setSubmitting(true);
    try {
      const data = await fileToBase64(file);
      const res = await fetch(`/api/payments/work-permit/${id}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(user.token) },
        body: JSON.stringify({ filename: file.name, contentType: file.type, data, method: selectedMethod }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Upload failed", description: result.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      toast({ title: "Payment slip submitted", description: "Our team will verify your payment shortly." });
      setFile(null);
      setConfirmed(false);
      loadInfo();
    } finally {
      setSubmitting(false);
    }
  }

  if (!isApplicant) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
        <div className="bg-card border rounded-2xl p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">We couldn't find this application.</p>
          <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  const skrill = info.methods.find(m => m.type === "skrill");
  const nagad = info.methods.find(m => m.type === "nagad");
  const status = info.paymentStatus;
  const canSubmit = status !== "paid";

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-primary text-white py-10">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <h1 className="text-2xl font-serif font-bold">Complete Your Payment</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            Reference <span className="font-mono font-semibold text-white">{info.referenceNumber}</span> · Fee <span className="font-semibold text-white">{info.amount}</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-2xl space-y-6">

        {/* Status banner */}
        {status === "paid" && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Payment verified. Thank you — your application is moving forward.</p>
          </div>
        )}
        {status === "pending_review" && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
            <Clock className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Your payment slip is under review. We'll notify you by email once verified.</p>
          </div>
        )}
        {status === "rejected" && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Your last submission couldn't be verified.</p>
              {info.rejectionReason && <p className="mt-1">{info.rejectionReason}</p>}
              <p className="mt-1">Please double-check your payment and resubmit below.</p>
            </div>
          </div>
        )}

        {canSubmit && (
          <>
            {/* Payment methods */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <h2 className="font-serif font-bold text-foreground">1. Send Payment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a method below and complete the transfer</p>
              </div>
              <div className="p-6 grid gap-4 sm:grid-cols-2">
                {skrill && (
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("skrill")}
                    className={`text-left rounded-xl border-2 p-5 transition-all ${
                      selectedMethod === "skrill" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#642e88]/10 flex items-center justify-center">
                        <Mail className="w-4.5 h-4.5 text-[#642e88]" />
                      </div>
                      <span className="font-semibold text-foreground">Skrill</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">Send to this Skrill email</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-medium bg-muted px-2 py-1 rounded break-all">{skrill.email}</code>
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(skrill.email!); }}
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Copy email"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </span>
                    </div>
                  </button>
                )}

                {nagad ? (
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("nagad")}
                    className={`text-left rounded-xl border-2 p-5 transition-all ${
                      selectedMethod === "nagad" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                        <QrCode className="w-4.5 h-4.5 text-orange-600" />
                      </div>
                      <span className="font-semibold text-foreground">Nagad</span>
                    </div>
                    {nagad.number && (
                      <>
                        <p className="text-xs text-muted-foreground mb-1.5">Send to this Nagad number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-medium bg-muted px-2 py-1 rounded">{nagad.number}</code>
                          <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); handleCopy(nagad.number!); }}
                            className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="Copy number"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </span>
                        </div>
                      </>
                    )}
                    {nagad.qrUrl && (
                      <>
                        <p className="text-xs text-muted-foreground mt-3 mb-2">Or scan the QR code in your Nagad app</p>
                        <img src={nagad.qrUrl} alt="Nagad payment QR code" className="w-32 h-32 object-contain rounded-lg border border-border bg-white" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center text-center opacity-60">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mb-3">
                      <QrCode className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <span className="font-semibold text-foreground">Nagad</span>
                    <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                  </div>
                )}
              </div>
            </section>

            {/* Upload & confirm */}
            <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <h2 className="font-serif font-bold text-foreground">2. Confirm Your Payment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Upload proof of payment so our team can verify it</p>
              </div>
              <div className="p-6 space-y-5">
                <label
                  htmlFor="payment-slip"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-10 px-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <UploadCloud className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {file ? file.name : "Click to upload your payment slip / screenshot"}
                  </span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, or PDF · Max 5 MB</span>
                  <input id="payment-slip" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleFileChange} />
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} className="mt-0.5" />
                  <span className="text-sm text-muted-foreground">
                    I confirm I have sent <strong className="text-foreground">{info.amount}</strong> using the{" "}
                    {selectedMethod === "nagad" ? "Nagad" : "Skrill"} details above, and this slip is proof of that payment.
                  </span>
                </label>

                <Button
                  className="w-full"
                  disabled={!file || !confirmed || !selectedMethod || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                  ) : (
                    <>Submit Payment Confirmation</>
                  )}
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
