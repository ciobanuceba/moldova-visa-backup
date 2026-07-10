import { FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Terms() {
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
              <FileText className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {isBn ? "শর্তাবলী" : "Terms & Conditions"}
          </h1>
          <p className="text-primary-foreground/60 text-sm">
            {isBn ? `সর্বশেষ আপডেট: ${updated}` : `Last updated: ${updated}`}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {isBn ? (
            <div className="space-y-8 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                এই শর্তাবলী মলদোভা ভিসা অ্যাসিস্টের সেবা ব্যবহারের ক্ষেত্রে প্রযোজ্য। আমাদের সেবা ব্যবহার করে আপনি এই শর্তগুলিতে সম্মত হন।
              </p>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">১. সেবার বিবরণ</h2>
                <p>মলদোভা ভিসা অ্যাসিস্ট একটি নিয়োগ ও ভিসা সহায়তা সংস্থা যা মলদোভান নাগরিকদের ইউরোপে কর্মসংস্থানের সুযোগ সংযুক্ত করে।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">২. যোগ্যতা</h2>
                <p>আমাদের সেবা ব্যবহার করতে আপনাকে কমপক্ষে ১৮ বছর বয়সী হতে হবে এবং মলদোভার নাগরিক বা স্থায়ী বাসিন্দা হতে হবে।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">৩. প্রার্থীর বাধ্যবাধকতা</h2>
                <p>আপনি সম্মত হন যে: আপনার প্রদত্ত সকল তথ্য সঠিক ও সম্পূর্ণ, আপনি কোনো মিথ্যা তথ্য প্রদান করবেন না, এবং আপনি সকল প্রাসঙ্গিক আইন মেনে চলবেন।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">৪. ফি ও পেমেন্ট</h2>
                <p>প্রার্থীদের জন্য নিয়োগ সেবা বিনামূল্যে। নির্দিষ্ট ডকুমেন্টেশন বা অনুবাদ সেবার জন্য আলাদা ফি প্রযোজ্য হতে পারে, যা আগে থেকে জানানো হবে।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">৫. দায় সীমাবদ্ধতা</h2>
                <p>মলদোভা ভিসা অ্যাসিস্ট নিয়োগকর্তার সিদ্ধান্ত, ভিসা কর্তৃপক্ষের রায় বা ব্যক্তিগত পরিস্থিতির কারণে সৃষ্ট যেকোনো ক্ষতির জন্য দায়ী নয়।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">৬. প্রযোজ্য আইন</h2>
                <p>এই শর্তাবলী মলদোভা প্রজাতন্ত্রের আইন অনুযায়ী পরিচালিত হবে। যেকোনো বিরোধ চিসিনাউর উপযুক্ত আদালতে নিষ্পত্তি হবে।</p>
              </section>
              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">৭. যোগাযোগ</h2>
                <p>শর্তাবলী সংক্রান্ত প্রশ্নের জন্য: <a href="mailto:legal@moldova-visa-assist.replit.app" className="text-secondary hover:underline">legal@moldova-visa-assist.replit.app</a></p>
              </section>
            </div>
          ) : (
            <div className="space-y-8 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                Please read these Terms and Conditions carefully before using the services of Moldova Visa Assist SRL ("Company", "we", "us"). By accessing our website or engaging our services, you agree to be bound by these Terms.
              </p>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">1. Services Provided</h2>
                <p>Moldova Visa Assist provides international recruitment and visa assistance services, connecting Moldovan job seekers with licensed European employers. Our services include job matching, visa documentation support, relocation advice, and post-placement support.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">2. Eligibility</h2>
                <p>To use our services you must be: (a) at least 18 years of age, (b) a citizen or permanent legal resident of the Republic of Moldova, and (c) legally entitled to apply for international employment. By submitting an application you represent and warrant that you meet these criteria.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">3. Candidate Obligations</h2>
                <p>You agree to: provide accurate, complete, and truthful information in all applications and communications; promptly notify us of any material change in your circumstances; attend scheduled interviews and orientations unless you provide reasonable advance notice; and comply with all applicable laws of Moldova and the destination country.</p>
                <p className="mt-3">Providing false or misleading information may result in immediate termination of our services and may constitute a criminal offence under Moldovan and European law.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">4. Fees & Charges</h2>
                <p>Recruitment services are provided free of charge to candidates. Fees may be charged for optional supplementary services such as certified document translation, notarisation, or apostille processing. Any applicable fees will be disclosed in writing and require your explicit consent before being incurred.</p>
                <p className="mt-3 font-medium text-foreground">We strictly prohibit any form of upfront fee collection that is not disclosed and consented to in advance.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">5. Employer & Visa Authority Decisions</h2>
                <p>We act as an intermediary and cannot guarantee employer hiring decisions or visa authority approvals, which are made at the sole discretion of those parties. Our placement guarantee (as described in our service agreement) applies to employer-side failures, not to visa refusals based on an applicant's individual circumstances or history.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">6. Limitation of Liability</h2>
                <p>To the fullest extent permitted by law, Moldova Visa Assist shall not be liable for: indirect, incidental, or consequential loss; loss of earnings, opportunity, or goodwill; or any loss arising from reliance on third-party employer or government authority decisions. Our aggregate liability in any circumstances is limited to fees paid by you (if any) in the preceding 12 months.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">7. Intellectual Property</h2>
                <p>All content on this website — including text, graphics, logos, and job listing data — is the property of Moldova Visa Assist SRL or its licensors and is protected under applicable copyright and intellectual property laws. You may not reproduce or redistribute any content without our written consent.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">8. Governing Law & Disputes</h2>
                <p>These Terms are governed by the laws of the Republic of Moldova. Any dispute arising from or in connection with these Terms shall be submitted to the exclusive jurisdiction of the competent courts of Chisinau, Moldova, without prejudice to your rights as a consumer under the law of your country of residence.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">9. Amendments</h2>
                <p>We reserve the right to amend these Terms at any time. Material changes will be communicated at least 14 days in advance via email or website notice. Continued use of our services after that date constitutes acceptance of the revised Terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-3">10. Contact</h2>
                <p>For legal enquiries: <a href="mailto:legal@moldova-visa-assist.replit.app" className="text-secondary hover:underline">legal@moldova-visa-assist.replit.app</a></p>
                <address className="not-italic mt-2">
                  Moldova Visa Assist SRL<br />
                  Stefan cel Mare si Sfant Boulevard 65<br />
                  Chisinau, MD-2001, Republic of Moldova
                </address>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
