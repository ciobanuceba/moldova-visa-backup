import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Button } from "@/components/ui/button";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Apply from "./pages/Apply";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Admin from "./pages/Admin";
import AdminManual from "./pages/AdminManual";
import AdminLogin from "./pages/AdminLogin";
import ApplicantLogin from "./pages/ApplicantLogin";
import ApplicantRegister from "./pages/ApplicantRegister";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import LetterBuilder from "./pages/LetterBuilder";
import WorkPermit from "./pages/WorkPermit";
import WorkPermitPayment from "./pages/WorkPermitPayment";
import ApplicationLookup from "./pages/ApplicationLookup";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();
const NO_CHROME_ROUTES = ["/admin/login", "/login", "/register", "/dashboard", "/work-permit/payment-success", "/work-permit/payment-cancel", "/work-permit/pay"];

function Layout({ children, path }: { children: React.ReactNode; path?: string }) {
  const noChrome = path && NO_CHROME_ROUTES.some(r => path.startsWith(r));
  if (noChrome) return <>{children}</>;
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {path === "/admin" && <AdminToolsBar />}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminToolsBar() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-end gap-3 text-sm"><span>Admin:</span><Button asChild variant="secondary" size="sm"><Link href="/admin/manual">Manual Job Offer / Work Permit</Link></Button></div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login">{() => <Layout path="/admin/login"><AdminLogin /></Layout>}</Route>
      <Route path="/login">{() => <Layout path="/login"><ApplicantLogin /></Layout>}</Route>
      <Route path="/register">{() => <Layout path="/register"><ApplicantRegister /></Layout>}</Route>
      <Route path="/dashboard">{() => <Layout path="/dashboard"><ApplicantDashboard /></Layout>}</Route>
      <Route path="/work-permit/payment-success">{() => <Layout path="/work-permit/payment-success"><PaymentSuccess /></Layout>}</Route>
      <Route path="/work-permit/payment-cancel">{() => <Layout path="/work-permit/payment-cancel"><PaymentCancel /></Layout>}</Route>
      <Route path="/work-permit/:id/pay">{() => <Layout path="/work-permit/pay"><WorkPermitPayment /></Layout>}</Route>
      <Route path="/check-application" component={() => <Layout><ApplicationLookup /></Layout>} />
      <Route path="/" component={() => <Layout><Home /></Layout>} />
      <Route path="/jobs" component={() => <Layout><Jobs /></Layout>} />
      <Route path="/jobs/:id" component={() => <Layout><JobDetail /></Layout>} />
      <Route path="/apply/:jobId" component={() => <Layout><Apply /></Layout>} />
      <Route path="/letter-builder" component={() => <Layout><LetterBuilder /></Layout>} />
      <Route path="/work-permit" component={() => <Layout><WorkPermit /></Layout>} />
      <Route path="/about" component={() => <Layout><About /></Layout>} />
      <Route path="/contact" component={() => <Layout><Contact /></Layout>} />
      <Route path="/services" component={() => <Layout><Services /></Layout>} />
      <Route path="/faq" component={() => <Layout><FAQ /></Layout>} />
      <Route path="/privacy" component={() => <Layout><Privacy /></Layout>} />
      <Route path="/terms" component={() => <Layout><Terms /></Layout>} />
      <Route path="/admin/manual" component={() => <Layout path="/admin/manual"><AdminManual /></Layout>} />
      <Route path="/admin" component={() => <Layout path="/admin"><Admin /></Layout>} />
      <Route component={() => <Layout><NotFound /></Layout>} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <ErrorBoundary><Router /></ErrorBoundary>
              </WouterRouter>
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
