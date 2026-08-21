import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function AdminManual() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><p>Admin access required.</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-card border rounded-xl p-8 space-y-4">
        <h1 className="text-2xl font-bold">Manual Admin Tools</h1>
        <p className="text-muted-foreground">Manual Job Offer and Work Permit tools are temporarily disabled while the frontend build is restored. Existing Admin, PDF, email, database, and approval workflows are unchanged.</p>
        <Button asChild><Link href="/admin">Back to Admin</Link></Button>
      </div>
    </div>
  );
}
