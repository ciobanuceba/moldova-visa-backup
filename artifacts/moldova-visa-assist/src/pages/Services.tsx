import { Link } from "wouter";
import { ArrowRight, Briefcase, Building2, CheckCircle2, FileText, Globe, GraduationCap, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import servicesImage from "../assets/services-passport.png";

export default function Services() {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-primary text-white pt-20 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Comprehensive Support</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
              We manage the entire process from job matching to legal compliance, ensuring your transition to working in Europe is seamless and secure.
            </p>
          </div>
        </div>
      </section>

      {/* Main Overview */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl font-serif font-bold text-primary">Why Choose Professional Assistance?</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Immigration and employment laws in the EU change frequently and are strictly enforced. Attempting to navigate the system alone often results in rejected applications, wasted money, or worse—illegal employment situations.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Our agency assumes full responsibility for the legality of your employment. We guarantee that every job contract meets European labor standards and that your visa permits you to work and reside legally in your destination country.
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-center text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5 text-secondary mr-3" /> Guaranteed Legal Compliance
                </li>
                <li className="flex items-center text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5 text-secondary mr-3" /> Direct Employer Contacts
                </li>
                <li className="flex items-center text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5 text-secondary mr-3" /> Transparent Fee Structure
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={servicesImage} 
                  alt="Travel documents" 
                  className="w-full h-[450px] object-cover"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Our End-to-End Solutions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to build your career abroad, managed by experts.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Job Matching */}
            <div className="bg-card border p-8 rounded-xl flex gap-6 hover:shadow-md transition-shadow group">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Briefcase className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">Targeted Job Matching</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We don't just send out CVs. We analyze your skills, experience, and goals to match you with vetted employers across Europe who are actively seeking your specific profile.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> CV preparation & translation</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Interview coaching</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Contract negotiation</li>
                </ul>
              </div>
            </div>

            {/* Visa Assistance */}
            <div className="bg-card border p-8 rounded-xl flex gap-6 hover:shadow-md transition-shadow group">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <FileText className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">Visa & Work Permits</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The most complex part of working abroad handled by our legal experts. We prepare, verify, and submit all necessary documentation for your work visa and residency permits.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Application preparation</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Embassy appointment scheduling</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Document legalization & apostille</li>
                </ul>
              </div>
            </div>

            {/* Relocation */}
            <div className="bg-card border p-8 rounded-xl flex gap-6 hover:shadow-md transition-shadow group">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Plane className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">Relocation Support</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Arriving in a new country can be overwhelming. We arrange the logistics so you have a clear plan from the moment you leave Moldova to your first day on the job.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Travel coordination</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Initial accommodation setup</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Pre-departure orientation</li>
                </ul>
              </div>
            </div>

            {/* Legal Guidance */}
            <div className="bg-card border p-8 rounded-xl flex gap-6 hover:shadow-md transition-shadow group">
              <div className="shrink-0">
                <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Building2 className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">Ongoing Legal Guidance</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our relationship doesn't end when you start working. We provide ongoing support to ensure your continued legal status and integration.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Social security registration</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Tax number assistance</li>
                  <li className="flex items-start"><span className="text-secondary mr-2">•</span> Visa extension support</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="bg-muted/40 border rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-2/3 mb-8 md:mb-0">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Ready to start the process?</h2>
            <p className="text-muted-foreground text-lg">
              Submit a general application today. Our advisors will review your profile and contact you for a free consultation.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-end w-full">
            <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg font-bold" asChild>
              <Link href="/apply/0">Start Free Assessment <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
