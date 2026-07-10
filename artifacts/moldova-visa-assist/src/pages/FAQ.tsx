import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const faqs = [
  {
    category: "Getting Started",
    categoryBn: "শুরু করা",
    items: [
      {
        q: "How does Moldova Visa Assist work?",
        qBn: "মলদোভা ভিসা অ্যাসিস্ট কীভাবে কাজ করে?",
        a: "We act as a full-service recruitment and visa support agency. You browse our verified job listings, submit an application, and our team handles everything from employer matching to visa documentation and pre-departure preparation. We stay with you throughout the entire process.",
        aBn: "আমরা একটি সম্পূর্ণ সেবা নিয়োগ ও ভিসা সহায়তা সংস্থা হিসেবে কাজ করি। আপনি আমাদের যাচাইকৃত চাকরির তালিকা দেখুন, আবেদন করুন এবং আমাদের দল নিয়োগকর্তার সাথে মেলানো থেকে ভিসা ডকুমেন্টেশন ও যাত্রার প্রস্তুতি পর্যন্ত সব কিছু পরিচালনা করে।",
      },
      {
        q: "Is Moldova Visa Assist a licensed recruitment agency?",
        qBn: "মলদোভা ভিসা অ্যাসিস্ট কি একটি লাইসেন্সধারী নিয়োগ সংস্থা?",
        a: "Yes. We are fully licensed and registered in the Republic of Moldova, compliant with both Moldovan labor law and the recruitment regulations of every European country we operate in. All our partner employers hold valid employment licenses in their respective countries.",
        aBn: "হ্যাঁ। আমরা মলদোভা প্রজাতন্ত্রে সম্পূর্ণ লাইসেন্সপ্রাপ্ত এবং নিবন্ধিত। আমাদের সকল অংশীদার নিয়োগকর্তারা তাদের নিজ নিজ দেশে বৈধ নিয়োগ লাইসেন্স রাখেন।",
      },
      {
        q: "Do I need to pay any fees to use your services?",
        qBn: "আপনাদের সেবা ব্যবহার করতে আমাকে কি কোনো ফি দিতে হবে?",
        a: "Job seekers never pay recruitment fees — our service is completely free for candidates. We are compensated by the European employers we partner with. This means you pay nothing to apply, nothing for visa support, and nothing for our placement service.",
        aBn: "চাকরিপ্রার্থীরা কখনও নিয়োগ ফি দেন না — প্রার্থীদের জন্য আমাদের সেবা সম্পূর্ণ বিনামূল্যে। আমরা আমাদের ইউরোপীয় নিয়োগকর্তা অংশীদারদের কাছ থেকে পারিশ্রমিক পাই।",
      },
    ],
  },
  {
    category: "Visa & Documentation",
    categoryBn: "ভিসা ও ডকুমেন্টেশন",
    items: [
      {
        q: "What types of work visas do you assist with?",
        qBn: "আপনারা কোন ধরনের ওয়ার্ক ভিসায় সহায়তা করেন?",
        a: "We assist with a wide range of European work visas depending on the destination country: German work visa (§18a/18b AufenthG), Italian work visa (Nulla Osta), French work permit (Autorisation de travail), Dutch TWV (Tewerkstellingsvergunning), and more. Our legal team identifies the correct visa category for your specific job offer.",
        aBn: "গন্তব্য দেশের উপর নির্ভর করে আমরা বিভিন্ন ইউরোপীয় ওয়ার্ক ভিসায় সহায়তা করি: জার্মান ওয়ার্ক ভিসা, ইতালিয়ান ওয়ার্ক ভিসা, ফ্রেঞ্চ ওয়ার্ক পারমিট এবং আরও অনেক। আমাদের আইনি দল আপনার নির্দিষ্ট চাকরির অফারের জন্য সঠিক ভিসা ক্যাটাগরি নির্ধারণ করে।",
      },
      {
        q: "How long does the visa process take?",
        qBn: "ভিসা প্রক্রিয়া কতদিন সময় নেয়?",
        a: "Processing times vary by country and visa type. On average: Germany 6–10 weeks, Italy 8–14 weeks, France 4–8 weeks, Netherlands 4–6 weeks, Belgium 6–10 weeks. We submit your application as early as possible and track it proactively to flag any delays.",
        aBn: "প্রক্রিয়াকরণের সময় দেশ ও ভিসার ধরন অনুযায়ী পরিবর্তিত হয়। গড়ে: জার্মানি ৬–১০ সপ্তাহ, ইতালি ৮–১৪ সপ্তাহ, ফ্রান্স ৪–৮ সপ্তাহ, নেদারল্যান্ডস ৪–৬ সপ্তাহ।",
      },
      {
        q: "What documents will I need to prepare?",
        qBn: "আমাকে কোন কোন ডকুমেন্ট প্রস্তুত করতে হবে?",
        a: "Standard documents include: valid passport (min. 6 months validity), professional qualifications/diplomas, employment history record, clean criminal background check, medical certificate, and recent passport photos. Our team provides a personalised document checklist for your specific destination and role.",
        aBn: "মানক ডকুমেন্টগুলির মধ্যে রয়েছে: বৈধ পাসপোর্ট (কমপক্ষে ৬ মাসের মেয়াদ), পেশাদার যোগ্যতা/ডিপ্লোমা, কর্মসংস্থানের ইতিহাস, পুলিশ ক্লিয়ারেন্স সার্টিফিকেট, মেডিকেল সার্টিফিকেট এবং সাম্প্রতিক পাসপোর্ট ছবি।",
      },
    ],
  },
  {
    category: "Jobs & Placement",
    categoryBn: "চাকরি ও নিয়োগ",
    items: [
      {
        q: "What sectors do you recruit for?",
        qBn: "আপনারা কোন কোন সেক্টরে নিয়োগ করেন?",
        a: "We recruit across a broad range of sectors including construction, hospitality & tourism, healthcare & caregiving, agriculture & food processing, logistics & warehousing, manufacturing, transportation, cleaning & facilities, and IT & professional services.",
        aBn: "আমরা নির্মাণ, আতিথেয়তা ও পর্যটন, স্বাস্থ্যসেবা ও পরিচর্যা, কৃষি ও খাদ্য প্রক্রিয়াকরণ, লজিস্টিক্স ও গুদামজাতকরণ, উৎপাদন, পরিবহন, পরিষ্কার ও সুবিধা এবং আইটি ও পেশাদার সেবা সহ বিভিন্ন সেক্টরে নিয়োগ করি।",
      },
      {
        q: "Are the jobs permanent or seasonal?",
        qBn: "চাকরিগুলো কি স্থায়ী নাকি মৌসুমী?",
        a: "We offer both. Most of our listings are full-time, permanent positions with employment contracts. We also carry seasonal roles in agriculture (spring/summer harvest) and hospitality (summer & winter resort seasons) for candidates who prefer a trial period before committing long-term.",
        aBn: "আমরা উভয়ই অফার করি। আমাদের বেশিরভাগ তালিকা পূর্ণকালীন, স্থায়ী পদ। আমরা কৃষি ও আতিথেয়তায় মৌসুমী ভূমিকাও রাখি যারা দীর্ঘমেয়াদী প্রতিশ্রুতির আগে একটি পরীক্ষামূলক সময় পছন্দ করেন।",
      },
      {
        q: "What is your placement guarantee?",
        qBn: "আপনাদের প্লেসমেন্ট গ্যারান্টি কী?",
        a: "If your placed employment does not commence within 30 days of the agreed start date due to employer-side issues, we will find you a comparable alternative position at no additional cost and re-process your visa documentation if required. This guarantee is in writing in our service agreement.",
        aBn: "যদি নিয়োগকর্তার পক্ষের সমস্যার কারণে সম্মত শুরুর তারিখের ৩০ দিনের মধ্যে আপনার নিয়োগ শুরু না হয়, আমরা বিনা অতিরিক্ত খরচে একটি তুলনামূলক বিকল্প পদ খুঁজে দেব।",
      },
    ],
  },
  {
    category: "Life in Europe",
    categoryBn: "ইউরোপে জীবন",
    items: [
      {
        q: "Do employers provide accommodation?",
        qBn: "নিয়োগকর্তারা কি আবাসন সুবিধা দেন?",
        a: "Many of our partner employers provide subsidised or free accommodation, particularly in construction, agriculture, and hospitality. This is clearly stated in each job listing. Where accommodation is not provided, our relocation advisors help you find suitable housing before you arrive.",
        aBn: "আমাদের অনেক নিয়োগকর্তা অংশীদার ভর্তুকিযুক্ত বা বিনামূল্যে আবাসন সুবিধা দেন, বিশেষত নির্মাণ, কৃষি ও আতিথেয়তায়। যেখানে আবাসন সুবিধা নেই, আমাদের স্থানান্তর উপদেষ্টারা আপনার আগমনের আগে উপযুক্ত বাড়ি খুঁজতে সাহায্য করেন।",
      },
      {
        q: "Will my Moldovan qualifications be recognised in Europe?",
        qBn: "ইউরোপে কি আমার মলদোভান যোগ্যতা স্বীকৃত হবে?",
        a: "Moldova has ratified the Lisbon Recognition Convention, which facilitates academic and professional recognition. For regulated professions (nursing, engineering, etc.) we guide you through the formal recognition process in the destination country. For most roles, employer recognition through direct assessment is sufficient.",
        aBn: "মলদোভা লিসবন রিকগনিশন কনভেনশন অনুমোদন করেছে, যা একাডেমিক ও পেশাদার স্বীকৃতি সহজ করে। নিয়ন্ত্রিত পেশার জন্য আমরা আপনাকে আনুষ্ঠানিক স্বীকৃতি প্রক্রিয়ায় গাইড করি।",
      },
      {
        q: "What support do you offer after I arrive in Europe?",
        qBn: "ইউরোপে পৌঁছানোর পর আপনারা কী সহায়তা দেন?",
        a: "Our post-arrival support includes: airport pickup coordination, local SIM card and banking setup guidance, registration with local authorities (Anmeldung in Germany, etc.), introductory orientation session, and a dedicated point of contact for the first 90 days. We want your first weeks to be smooth.",
        aBn: "আমাদের আগমন পরবর্তী সহায়তায় রয়েছে: বিমানবন্দর পিকআপ সমন্বয়, স্থানীয় সিম কার্ড ও ব্যাংকিং সেটআপ, স্থানীয় কর্তৃপক্ষের সাথে নিবন্ধন, ওরিয়েন্টেশন সেশন এবং প্রথম ৯০ দিনের জন্য একজন নির্ধারিত যোগাযোগ ব্যক্তি।",
      },
    ],
  },
];

function FAQItem({ q, a, qBn, aBn, locale }: { q: string; a: string; qBn: string; aBn: string; locale: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      <button
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 bg-card hover:bg-accent/30 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-medium text-foreground leading-snug">
          {locale === "bn" ? qBn : q}
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 pt-0 bg-card">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {locale === "bn" ? aBn : a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-secondary/20 rounded-full">
              <HelpCircle className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {t.faq.title}
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            {t.faq.subtitle}
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-xl font-serif font-bold text-foreground mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-secondary rounded-full inline-block" />
                  {locale === "bn" ? section.categoryBn : section.category}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <FAQItem key={item.q} {...item} locale={locale} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-16 text-center bg-primary/5 dark:bg-primary/20 rounded-2xl p-10 border border-primary/10">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
              {locale === "bn" ? "আরও প্রশ্ন আছে?" : "Still have questions?"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {locale === "bn"
                ? "আমাদের উপদেষ্টা দল আপনার সাহায্যের জন্য প্রস্তুত।"
                : "Our advisory team is ready to help you personally."}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              {locale === "bn" ? "আমাদের সাথে কথা বলুন" : "Talk to Our Team"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
