import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Privacy() {
  const { locale } = useI18n();
  const isBn = locale === "bn";

  const updated = "1 June 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-secondary/20 rounded-full">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {isBn ? "গোপনীয়তা নীতি" : "Privacy Policy"}
          </h1>
          <p className="text-primary-foreground/60 text-sm">
            {isBn ? `সর্বশেষ আপডেট: ${updated}` : `Last updated: ${updated}`}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl prose prose-neutral dark:prose-invert max-w-none">
          {isBn ? (
            <>
              <p className="text-muted-foreground lead">
                মলদোভা ভিসা অ্যাসিস্ট ("আমরা", "আমাদের") আপনার গোপনীয়তাকে সম্মান করে। এই নীতি ব্যাখ্যা করে যে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা করি।
              </p>
              <h2>১. আমরা কোন তথ্য সংগ্রহ করি</h2>
              <p>আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি: নাম, ইমেইল ঠিকানা, ফোন নম্বর, পেশাদার যোগ্যতা এবং কর্মসংস্থানের ইতিহাস, পাসপোর্ট ও পরিচয়পত্রের তথ্য (আবেদন প্রক্রিয়ার জন্য), এবং আমাদের ওয়েবসাইট ব্যবহারের ডেটা।</p>
              <h2>২. আমরা কীভাবে তথ্য ব্যবহার করি</h2>
              <p>আপনার তথ্য ব্যবহার করা হয়: চাকরির প্লেসমেন্ট ও নিয়োগ সেবা প্রদানের জন্য, ভিসা ও ওয়ার্ক পারমিট আবেদন প্রক্রিয়া করার জন্য, আপনার সাথে যোগাযোগ রক্ষার জন্য এবং আইনি বাধ্যবাধকতা পালনের জন্য।</p>
              <h2>৩. তথ্য শেয়ারিং</h2>
              <p>আমরা আপনার পূর্ব সম্মতি ছাড়া তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য বিক্রি করি না। প্লেসমেন্ট প্রক্রিয়ার অংশ হিসেবে আমরা আপনার প্রোফাইল প্রাসঙ্গিক ইউরোপীয় নিয়োগকর্তাদের সাথে শেয়ার করতে পারি।</p>
              <h2>৪. ডেটা সুরক্ষা</h2>
              <p>আমরা EU GDPR এবং মলদোভার ডেটা সুরক্ষা আইন অনুযায়ী আপনার ডেটা সুরক্ষিত রাখি। আমরা শিল্প-মানের এনক্রিপশন ও অ্যাক্সেস নিয়ন্ত্রণ ব্যবহার করি।</p>
              <h2>৫. ডেটা ধারণ</h2>
              <p>আমরা আপনার ডেটা প্লেসমেন্টের তারিখ থেকে ৫ বছর ধরে রাখি, অথবা আইনগত প্রয়োজনীয়তার ক্ষেত্রে দীর্ঘতর।</p>
              <h2>৬. আপনার অধিকার</h2>
              <p>আপনার অধিকার রয়েছে: আপনার ডেটা অ্যাক্সেস করার, ডেটা সংশোধন করার, ডেটা মুছে ফেলার ("ভুলে যাওয়ার অধিকার"), ডেটা পোর্টেবিলিটি এবং প্রক্রিয়াকরণে আপত্তি করার।</p>
              <h2>৭. যোগাযোগ করুন</h2>
              <p>গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নের জন্য: <a href="mailto:privacy@moldova-visa-assist.replit.app">privacy@moldova-visa-assist.replit.app</a></p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Moldova Visa Assist ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
              </p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground">We may collect the following categories of personal information:</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-5">
                <li>Identity data: name, date of birth, nationality, passport details</li>
                <li>Contact data: email address, phone number, postal address</li>
                <li>Professional data: qualifications, certifications, work history, CV/resume</li>
                <li>Application data: cover letters, references, responses to screening questions</li>
                <li>Technical data: IP address, browser type, pages visited, session duration</li>
              </ul>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use your personal information to:</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-5">
                <li>Match you with suitable European employment opportunities</li>
                <li>Process visa and work permit applications on your behalf</li>
                <li>Communicate with you about your application status</li>
                <li>Provide pre-departure and post-arrival support services</li>
                <li>Comply with legal and regulatory obligations in Moldova and destination countries</li>
                <li>Improve our website and service quality</li>
              </ul>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">3. Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell your personal data to third parties. We may share your information with:
              </p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-5">
                <li>Prospective employers (with your explicit consent for each application)</li>
                <li>Immigration authorities and embassies (as required for visa processing)</li>
                <li>Our trusted legal and translation service partners (under confidentiality agreements)</li>
                <li>IT and cloud hosting providers (under GDPR-compliant data processing agreements)</li>
              </ul>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. This includes TLS encryption for data in transit, encrypted storage, and role-based access controls. We are compliant with EU GDPR as applied to non-EU processors handling EU residents' data.
              </p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal data for 5 years from the date of your last interaction with us or the date of your placement (whichever is later), unless a longer retention period is required by law. Inactive candidate profiles are anonymised after 2 years of inactivity.
              </p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground">Under applicable data protection law, you have the right to:</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-5">
                <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                <li><strong>Rectification</strong> — ask us to correct inaccurate or incomplete data</li>
                <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten") where applicable</li>
                <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
                <li><strong>Objection</strong> — object to processing for direct marketing or on legitimate interest grounds</li>
                <li><strong>Restriction</strong> — request that we restrict processing under certain circumstances</li>
              </ul>
              <p className="text-muted-foreground mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@moldova-visa-assist.replit.app" className="text-secondary hover:underline">privacy@moldova-visa-assist.replit.app</a>.</p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies to maintain your session and remember your language preference. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though this may affect site functionality.
              </p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy periodically. Material changes will be communicated via email or a prominent notice on our website at least 14 days before they take effect.
              </p>

              <h2 className="text-2xl font-serif font-bold text-foreground mt-10 mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground">
                For any privacy-related questions or to exercise your rights, contact our Data Protection Officer at:{" "}
                <a href="mailto:privacy@moldova-visa-assist.replit.app" className="text-secondary hover:underline">
                  privacy@moldova-visa-assist.replit.app
                </a>
              </p>
              <address className="text-muted-foreground not-italic mt-2">
                Moldova Visa Assist SRL<br />
                Stefan cel Mare si Sfant Boulevard 65<br />
                Chisinau, MD-2001, Republic of Moldova
              </address>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
