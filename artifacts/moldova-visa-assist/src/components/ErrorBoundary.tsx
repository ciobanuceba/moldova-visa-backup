import React from "react";
import { Button } from "@/components/ui/button";

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-card border rounded-xl p-10">
            <h2 className="text-2xl font-bold text-primary mb-3">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <Button onClick={() => window.location.href = "/"}>Go to Home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
