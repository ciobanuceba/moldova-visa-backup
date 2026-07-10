import { Link } from "wouter";
import { CheckCircle2, Globe, Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import aboutImage from "../assets/about-office.png";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-primary text-white pt-20 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Our Mission</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
              We believe that every talented individual deserves the opportunity to build a prosperous future, regardless of borders. Moldova Visa Assist was founded to make international career mobility safe, transparent, and accessible for Moldovans.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={aboutImage} 
                  alt="Modern European office" 
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
              </div>
            </div>
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl font-serif font-bold text-primary">A Decade of Trust</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                What started as a small consultancy in Chisinau has grown into Moldova's most trusted recruitment and visa assistance agency. We saw too many skilled professionals struggle with complex immigration laws or fall victim to unofficial agencies.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Today, we partner directly with verified European employers, ensuring that every job offer is legitimate and every contract is secure. We don't just find you a job; we handle the legal complexities so you can focus on your new career.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="border-l-4 border-secondary pl-4">
                  <div className="text-3xl font-bold text-primary mb-1">10+</div>
                  <div className="text-sm text-muted-foreground font-medium">Years Experience</div>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <div className="text-3xl font-bold text-primary mb-1">100%</div>
                  <div className="text-sm text-muted-foreground font-medium">Legal Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Our Core Values</h2>
            <p className="text-muted-foreground text-lg">The principles that guide every application we process and every candidate we support.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-card border p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Total Transparency</h3>
              <p className="text-muted-foreground leading-relaxed">
                No hidden fees, no false promises. We provide realistic assessments of your chances and clear timelines for your visa processing.
              </p>
            </div>
            
            <div className="bg-card border p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Human Dignity</h3>
              <p className="text-muted-foreground leading-relaxed">
                We only partner with employers who respect labor laws and treat their international workforce with dignity and fairness.
              </p>
            </div>
            
            <div className="bg-card border p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">End-to-End Support</h3>
              <p className="text-muted-foreground leading-relaxed">
                From interview preparation to your first day of work abroad, our team is there to support you through the transition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 md:px-8">
        <div className="bg-primary rounded-2xl p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-6">Start Your Journey Today</h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join the thousands of professionals who have trusted us to build their careers in Europe.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="secondary" className="font-semibold" asChild>
                <Link href="/jobs">Browse Opportunities</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-primary" asChild>
                <Link href="/contact">Speak with an Advisor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
