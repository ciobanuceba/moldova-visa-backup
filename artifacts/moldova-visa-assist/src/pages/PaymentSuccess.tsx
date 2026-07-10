import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ref = params.get("ref");
  const sessionId = params.get("session_id");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/payments/work-permit/verify?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => { if (data.paid) setVerified(true); })
      .catch(() => {});
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card border rounded-2xl shadow-lg p-10">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h1>
          {ref && (
            <p className="text-muted-foreground mb-2">
              Reference: <span className="font-mono font-semibold text-primary">{ref}</span>
            </p>
          )}
          <p className="text-muted-foreground mb-8">
            Your work permit application fee has been received. Our team will review your application and contact you within 5–7 business days.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/dashboard">
                View My Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
