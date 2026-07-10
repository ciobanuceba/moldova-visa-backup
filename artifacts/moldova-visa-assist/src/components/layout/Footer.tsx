import { Link } from "wouter";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-primary text-primary-foreground border-t border-primary-foreground/10">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Moldova Visa Assist
              </span>
            </Link>
            <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">{t.footer.navigation}</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.home}</Link></li>
              <li><Link href="/jobs" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.jobs}</Link></li>
              <li><Link href="/services" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.services}</Link></li>
              <li><Link href="/about" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.about}</Link></li>
              <li><Link href="/contact" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.contact}</Link></li>
              <li><Link href="/faq" className="text-sm text-primary-foreground/80 hover:text-secondary transition-colors">{t.nav.faq}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">{t.footer.services}</h3>
            <ul className="space-y-3">
              <li className="text-sm text-primary-foreground/80">{t.footer.visaAssistance}</li>
              <li className="text-sm text-primary-foreground/80">{t.footer.jobMatching}</li>
              <li className="text-sm text-primary-foreground/80">{t.footer.relocation}</li>
              <li className="text-sm text-primary-foreground/80">{t.footer.legal2}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4 text-white">{t.footer.contactInfo}</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-primary-foreground/80">
                <MapPin className="h-5 w-5 text-secondary shrink-0" />
                <span>Stefan cel Mare si Sfant Boulevard 65,<br />Chisinau, Moldova</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-primary-foreground/80">
                <Phone className="h-4 w-4 text-secondary shrink-0" />
                <span>+373 22 123 456</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-primary-foreground/80">
                <Mail className="h-4 w-4 text-secondary shrink-0" />
                <span>contact@moldova-visa-assist.replit.app</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-primary-foreground/60">
            &copy; {new Date().getFullYear()} Moldova Visa Assist. {t.footer.rights}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/60 justify-center">
            <Link href="/privacy" className="hover:text-secondary transition-colors">{t.footer.privacy}</Link>
            <Link href="/terms" className="hover:text-secondary transition-colors">{t.footer.terms}</Link>
            <Link href="/faq" className="hover:text-secondary transition-colors">{t.footer.faq}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
