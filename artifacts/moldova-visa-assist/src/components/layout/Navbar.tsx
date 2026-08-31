import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Globe, Briefcase, FileText, Info, Mail, HelpCircle, Shield, PenLine, LayoutDashboard, LogIn, Plane, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useI18n();
  const { isApplicant } = useAuth();
  const navItems = [
    { label: t.nav.home, href: "/", icon: <Globe className="w-4 h-4 mr-2" /> },
    { label: t.nav.jobs, href: "/jobs", icon: <Briefcase className="w-4 h-4 mr-2" /> },
    { label: "Visa Apply", href: "/visa-apply", icon: <Plane className="w-4 h-4 mr-2" /> },
    { label: t.nav.services, href: "/services", icon: <FileText className="w-4 h-4 mr-2" /> },
    { label: "Letter Builder", href: "/letter-builder", icon: <PenLine className="w-4 h-4 mr-2" /> },
    { label: "Work Permit", href: "/work-permit", icon: <Shield className="w-4 h-4 mr-2" /> },
    { label: "Payment", href: "/payment", icon: <CreditCard className="w-4 h-4 mr-2" /> },
    { label: t.nav.about, href: "/about", icon: <Info className="w-4 h-4 mr-2" /> },
    { label: t.nav.contact, href: "/contact", icon: <Mail className="w-4 h-4 mr-2" /> },
    { label: t.nav.faq, href: "/faq", icon: <HelpCircle className="w-4 h-4 mr-2" /> },
  ];
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"><div className="container mx-auto px-4 md:px-8"><div className="flex h-16 items-center justify-between"><Link href="/" className="flex items-center shrink-0"><img src="/moldova_logo.png" alt="Moldova Visa Assist" className="h-11 w-auto max-w-[170px] object-contain" /><span className="font-serif text-xl font-bold tracking-tight text-primary hidden sm:block ml-2">Moldova Visa Assist</span></Link><nav className="hidden lg:flex items-center space-x-5">{navItems.map(item => <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${location === item.href ? "text-primary" : "text-muted-foreground"}`}>{item.label}</Link>)}</nav><div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-border shrink-0"><LanguageToggle /><ThemeToggle />{isApplicant ? <Button asChild variant="secondary" className="font-medium rounded-full px-5 ml-1"><Link href="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link></Button> : <><Button asChild variant="ghost" size="sm" className="font-medium ml-1"><Link href="/login"><LogIn className="w-4 h-4 mr-1" />User Login</Link></Button><Button asChild variant="secondary" className="font-medium rounded-full px-5"><Link href="/visa-apply"><Plane className="w-4 h-4 mr-2" />Visa Apply</Link></Button></>}</div><div className="flex lg:hidden items-center gap-1"><LanguageToggle /><ThemeToggle /><button className="p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button></div></div></div>{isOpen && <div className="lg:hidden border-b bg-background"><div className="space-y-1 px-4 pb-4 pt-2">{navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center py-3 text-base font-medium transition-colors hover:text-primary ${location === item.href ? "text-primary" : "text-muted-foreground"}`}>{item.icon}{item.label}</Link>)}<div className="pt-4 border-t border-border mt-2 space-y-2">{isApplicant ? <Button asChild variant="secondary" className="w-full font-medium rounded-full"><Link href="/dashboard" onClick={() => setIsOpen(false)}><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</Link></Button> : <><Button asChild variant="outline" className="w-full font-medium rounded-full"><Link href="/login" onClick={() => setIsOpen(false)}><LogIn className="w-4 h-4 mr-2" /> User Login</Link></Button><Button asChild variant="secondary" className="w-full font-medium rounded-full"><Link href="/visa-apply" onClick={() => setIsOpen(false)}><Plane className="w-4 h-4 mr-2" /> Visa Apply</Link></Button></>}</div></div></div>}</header>;
}
