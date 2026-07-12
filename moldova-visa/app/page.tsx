"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, Shield, Users, Briefcase } from "lucide-react";

export default function Home() {
  const features = [
    { icon: <CheckCircle2 className="h-7 w-7" style={{color: 'hsl(45 93% 47%)'}} />, title: "Verified Employers", desc: "All our partner companies are verified and trusted" },
    { icon: <Shield className="h-7 w-7" style={{color: 'hsl(45 93% 47%)'}} />, title: "Visa Support", desc: "Full legal assistance for your work visa process" },
    { icon: <Globe className="h-7 w-7" style={{color: 'hsl(45 93% 47%)'}} />, title: "Europe Wide", desc: "Jobs in Germany, Italy, France, Netherlands & more" },
    { icon: <Users className="h-7 w-7" style={{color: 'hsl(45 93% 47%)'}} />, title: "24/7 Support", desc: "Our team helps you before and after relocation" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative pt-24 pb-32 overflow-hidden" style={{backgroundColor: 'hsl(217 91% 60%)'}}>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight mb-6">
              Work in Europe{" "}
              <span style={{color: 'hsl(45 93% 47%)'}}>with Confidence</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl">
              Moldova Visa Assist connects Moldovan professionals with verified European employers. Full visa support and guaranteed job placements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/jobs" className="font-semibold px-8 py-3 rounded-lg inline-flex items-center justify-center hover:opacity-90" style={{backgroundColor: 'hsl(45 93% 47%)', color: 'hsl(222.2 84% 4.9%)'}}>
                Browse Jobs <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/services" className="font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 px-8 py-3 rounded-lg inline-flex items-center justify-center">
                Learn About Visa
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b" style={{backgroundColor: 'hsl(0 0% 100%)', borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="500+" label="Active Jobs" />
            <StatCard value="2000+" label="Placed Candidates" />
            <StatCard value="15+" label="Partner Countries" />
            <StatCard value="98%" label="Success Rate" />
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Why Choose Moldova Visa Assist
            </h2>
            <p className="max-w-2xl mx-auto" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>
              We handle everything from job matching to visa paperwork, so you can focus on your career.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white border rounded-2xl p-6 hover:shadow-md transition-shadow" style={{borderColor: 'hsl(214.3 31.8% 91.4%)'}}>
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-serif font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/10" style={{backgroundColor: 'hsl(217 91% 60%)'}}>
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
            Ready to Start Your European Career?
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Apply today and get matched with top employers in 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply" className="font-semibold px-8 py-3 rounded-lg" style={{backgroundColor: 'hsl(45 93% 47%)', color: 'hsl(222.2 84% 4.9%)'}}>
              General Apply
            </Link>
            <Link href="/contact" className="font-semibold bg-transparent text-white border border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg">
              Contact Advisors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <span className="text-4xl font-serif font-bold mb-2" style={{color: 'hsl(217 91% 60%)'}}>{value}</span>
      <span className="text-sm font-medium uppercase tracking-wider" style={{color: 'hsl(215.4 16.3% 46.9%)'}}>{label}</span>
    </div>
  );
}            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
