import { Link, useSearch } from "wouter";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancel() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ref = params.get("ref");

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-card border rounded-2xl shadow-lg p-10">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Payment Cancelled</h1>
          {ref && (
            <p className="text-muted-foreground mb-2">
              Reference: <span className="font-mono font-semibold text-primary">{ref}</span>
            </p>
          )}
          <p className="text-muted-foreground mb-8">
            No payment was taken. Your application has been saved — you can complete the payment at any time from your dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/dashboard">
                <CreditCard className="w-4 h-4 mr-2" /> Pay from Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
