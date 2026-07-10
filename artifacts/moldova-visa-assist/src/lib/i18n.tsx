import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "en" | "bn";

export const translations = {
  en: {
    // Nav
    nav: {
      home: "Home",
      jobs: "Jobs",
      services: "Services",
      about: "About",
      contact: "Contact",
      faq: "FAQ",
      findOpportunities: "Find Opportunities",
    },
    // Hero / Home
    home: {
      heroTitle1: "Your Trusted Bridge to",
      heroTitle2: "European Opportunity",
      heroSubtitle:
        "We connect Moldovan talent with verified employers across Europe. Comprehensive visa support, legal guidance, and guaranteed job placements for a secure future.",
      browseJobs: "Browse Opportunities",
      learnVisa: "Learn About Our Visa Support",
      statsJobs: "Active Job Listings",
      statsPlaced: "Workers Placed",
      statsPartners: "European Partners",
      statsSuccess: "Success Rate",
      featuredJobs: "Featured Opportunities",
      featuredDesc: "Explore our latest verified job openings across Europe",
      viewAll: "View All Jobs",
      readyTitle: "Ready to Take the Next Step?",
      readyDesc:
        "Our expert advisors are here to guide you every step of the way — from finding the right job to settling into your new home in Europe.",
      generalApply: "General Application",
      contactAdvisors: "Contact Our Advisors",
      whyChoose: "Why Choose Moldova Visa Assist?",
      whyDesc: "We provide end-to-end support for Moldovan professionals seeking opportunities in Europe",
      feature1Title: "Verified Employers",
      feature1Desc: "Every job listing is screened and verified. We partner only with reputable, licensed European employers.",
      feature2Title: "Full Visa Support",
      feature2Desc: "Our legal team handles all visa documentation, work permits, and government paperwork on your behalf.",
      feature3Title: "Guaranteed Placements",
      feature3Desc: "We stand behind every placement. If your employment doesn't start as agreed, we find you an alternative.",
      feature4Title: "Ongoing Support",
      feature4Desc: "From pre-departure orientation to settling in abroad, our team is with you before, during, and after.",
    },
    // Jobs
    jobs: {
      title: "Find Your Opportunity",
      subtitle: "Browse verified job listings across Europe — all with full visa and relocation support",
      search: "Search jobs...",
      category: "Category",
      location: "Location",
      allCategories: "All Categories",
      allLocations: "All Locations",
      noResults: "No jobs match your search. Try adjusting your filters.",
      type: "Type",
      salary: "Salary",
      applyNow: "Apply Now",
      viewDetails: "View Details",
      posted: "Posted",
    },
    // Apply
    apply: {
      title: "Job Application",
      subtitle: "Complete the form below. Our team reviews every application personally.",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      experience: "Relevant Experience",
      coverLetter: "Cover Letter",
      coverPlaceholder: "Tell us why you're a great fit for this role...",
      submit: "Submit Application",
      submitting: "Submitting...",
      successTitle: "Application Submitted!",
      successDesc: "We've received your application and will be in touch within 2–3 business days.",
    },
    // About
    about: {
      title: "About Moldova Visa Assist",
      mission: "Our Mission",
      missionText:
        "We believe every Moldovan professional deserves access to the opportunities Europe has to offer. Our mission is to remove barriers — legal, administrative, and financial — so that talent can move freely.",
    },
    // Contact
    contact: {
      title: "Get in Touch",
      subtitle: "Our advisors are available Monday–Friday, 9:00–18:00 (Chisinau time)",
      name: "Full Name",
      email: "Email",
      phone: "Phone (optional)",
      subject: "Subject",
      message: "Message",
      send: "Send Message",
      sending: "Sending...",
      successTitle: "Message Sent!",
      successDesc: "We'll get back to you within one business day.",
    },
    // FAQ
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about working in Europe with Moldova Visa Assist",
    },
    // Footer
    footer: {
      tagline:
        "The trusted bridge between Moldovan talent and international opportunity. Professional recruitment and comprehensive visa support.",
      navigation: "Navigation",
      services: "Services",
      legal: "Legal",
      contactInfo: "Contact Info",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      faq: "FAQ",
      rights: "All rights reserved.",
      visaAssistance: "Visa Assistance",
      jobMatching: "Job Matching",
      relocation: "Relocation Support",
      legal2: "Legal Guidance",
    },
    // Common
    common: {
      learnMore: "Learn More",
      backToJobs: "Back to Jobs",
      loading: "Loading...",
      notFound: "Page Not Found",
      notFoundDesc: "The page you're looking for doesn't exist.",
      goHome: "Go Home",
      darkMode: "Dark mode",
      lightMode: "Light mode",
    },
  },
  bn: {
    // Nav
    nav: {
      home: "হোম",
      jobs: "চাকরি",
      services: "সেবাসমূহ",
      about: "আমাদের সম্পর্কে",
      contact: "যোগাযোগ",
      faq: "সাধারণ প্রশ্ন",
      findOpportunities: "সুযোগ খুঁজুন",
    },
    // Hero / Home
    home: {
      heroTitle1: "ইউরোপীয় সুযোগের",
      heroTitle2: "আপনার বিশ্বস্ত সেতু",
      heroSubtitle:
        "আমরা মলদোভান প্রতিভাবানদের সাথে ইউরোপের যাচাইকৃত নিয়োগকর্তাদের সংযুক্ত করি। ব্যাপক ভিসা সহায়তা, আইনি নির্দেশনা এবং নিশ্চিত চাকরির প্লেসমেন্ট।",
      browseJobs: "সুযোগ দেখুন",
      learnVisa: "ভিসা সহায়তা সম্পর্কে জানুন",
      statsJobs: "সক্রিয় চাকরির তালিকা",
      statsPlaced: "নিয়োগপ্রাপ্ত কর্মী",
      statsPartners: "ইউরোপীয় অংশীদার",
      statsSuccess: "সাফল্যের হার",
      featuredJobs: "বিশেষ সুযোগসমূহ",
      featuredDesc: "ইউরোপ জুড়ে সর্বশেষ যাচাইকৃত চাকরির সুযোগ দেখুন",
      viewAll: "সব চাকরি দেখুন",
      readyTitle: "পরবর্তী পদক্ষেপ নিতে প্রস্তুত?",
      readyDesc:
        "আমাদের বিশেষজ্ঞ উপদেষ্টারা প্রতিটি ধাপে আপনাকে গাইড করতে প্রস্তুত — সঠিক চাকরি খোঁজা থেকে ইউরোপে নতুন জীবন শুরু পর্যন্ত।",
      generalApply: "সাধারণ আবেদন",
      contactAdvisors: "উপদেষ্টাদের সাথে যোগাযোগ করুন",
      whyChoose: "কেন মলদোভা ভিসা অ্যাসিস্ট বেছে নেবেন?",
      whyDesc: "আমরা ইউরোপে সুযোগ সন্ধানকারী মলদোভান পেশাদারদের জন্য সম্পূর্ণ সহায়তা প্রদান করি",
      feature1Title: "যাচাইকৃত নিয়োগকর্তা",
      feature1Desc: "প্রতিটি চাকরির তালিকা যাচাই করা হয়। আমরা শুধুমাত্র নামকরা লাইসেন্সধারী ইউরোপীয় নিয়োগকর্তাদের সাথে কাজ করি।",
      feature2Title: "সম্পূর্ণ ভিসা সহায়তা",
      feature2Desc: "আমাদের আইনি দল সকল ভিসা ডকুমেন্টেশন, ওয়ার্ক পারমিট এবং সরকারি কাগজপত্র পরিচালনা করে।",
      feature3Title: "নিশ্চিত নিয়োগ",
      feature3Desc: "আমরা প্রতিটি নিয়োগের নিশ্চয়তা দিই। যদি কর্মসংস্থান শুরু না হয়, আমরা বিকল্প খুঁজে দেই।",
      feature4Title: "চলমান সহায়তা",
      feature4Desc: "প্রস্থানের আগে থেকে বিদেশে বসতি স্থাপন পর্যন্ত আমাদের দল সর্বদা আপনার পাশে।",
    },
    // Jobs
    jobs: {
      title: "আপনার সুযোগ খুঁজুন",
      subtitle: "ইউরোপ জুড়ে যাচাইকৃত চাকরির তালিকা দেখুন — সম্পূর্ণ ভিসা ও স্থানান্তর সহায়তাসহ",
      search: "চাকরি খুঁজুন...",
      category: "ক্যাটাগরি",
      location: "অবস্থান",
      allCategories: "সব ক্যাটাগরি",
      allLocations: "সব অবস্থান",
      noResults: "কোনো চাকরি পাওয়া যায়নি। ফিল্টার পরিবর্তন করে চেষ্টা করুন।",
      type: "ধরন",
      salary: "বেতন",
      applyNow: "এখনই আবেদন করুন",
      viewDetails: "বিস্তারিত দেখুন",
      posted: "প্রকাশিত",
    },
    // Apply
    apply: {
      title: "চাকরির আবেদন",
      subtitle: "নিচের ফর্মটি পূরণ করুন। আমাদের দল প্রতিটি আবেদন ব্যক্তিগতভাবে পর্যালোচনা করে।",
      firstName: "প্রথম নাম",
      lastName: "শেষ নাম",
      email: "ইমেইল ঠিকানা",
      phone: "ফোন নম্বর",
      experience: "প্রাসঙ্গিক অভিজ্ঞতা",
      coverLetter: "কভার লেটার",
      coverPlaceholder: "এই পদের জন্য আপনি কেন উপযুক্ত তা জানান...",
      submit: "আবেদন জমা দিন",
      submitting: "জমা দেওয়া হচ্ছে...",
      successTitle: "আবেদন জমা হয়েছে!",
      successDesc: "আমরা আপনার আবেদন পেয়েছি এবং ২–৩ কার্যদিবসের মধ্যে যোগাযোগ করব।",
    },
    // About
    about: {
      title: "মলদোভা ভিসা অ্যাসিস্ট সম্পর্কে",
      mission: "আমাদের লক্ষ্য",
      missionText:
        "আমরা বিশ্বাস করি প্রতিটি মলদোভান পেশাদার ইউরোপের সুযোগ পাওয়ার যোগ্য। আমাদের লক্ষ্য হলো আইনি, প্রশাসনিক এবং আর্থিক বাধা দূর করে প্রতিভাবানদের মুক্তভাবে এগিয়ে যাওয়ার সুযোগ করে দেওয়া।",
    },
    // Contact
    contact: {
      title: "যোগাযোগ করুন",
      subtitle: "আমাদের উপদেষ্টারা সোমবার–শুক্রবার, সকাল ৯টা–সন্ধ্যা ৬টা (চিসিনাউ সময়) উপলব্ধ",
      name: "পূর্ণ নাম",
      email: "ইমেইল",
      phone: "ফোন (ঐচ্ছিক)",
      subject: "বিষয়",
      message: "বার্তা",
      send: "বার্তা পাঠান",
      sending: "পাঠানো হচ্ছে...",
      successTitle: "বার্তা পাঠানো হয়েছে!",
      successDesc: "আমরা এক কার্যদিবসের মধ্যে আপনাকে জানাব।",
    },
    // FAQ
    faq: {
      title: "সাধারণ জিজ্ঞাসা",
      subtitle: "মলদোভা ভিসা অ্যাসিস্টের মাধ্যমে ইউরোপে কাজ করা সম্পর্কে সব কিছু জানুন",
    },
    // Footer
    footer: {
      tagline:
        "মলদোভান প্রতিভা ও আন্তর্জাতিক সুযোগের মধ্যে বিশ্বস্ত সেতু। পেশাদার নিয়োগ ও ব্যাপক ভিসা সহায়তা।",
      navigation: "নেভিগেশন",
      services: "সেবাসমূহ",
      legal: "আইনি",
      contactInfo: "যোগাযোগের তথ্য",
      privacy: "গোপনীয়তা নীতি",
      terms: "শর্তাবলী",
      faq: "সাধারণ প্রশ্ন",
      rights: "সর্বস্বত্ব সংরক্ষিত।",
      visaAssistance: "ভিসা সহায়তা",
      jobMatching: "চাকরির মিলান",
      relocation: "স্থানান্তর সহায়তা",
      legal2: "আইনি নির্দেশনা",
    },
    // Common
    common: {
      learnMore: "আরও জানুন",
      backToJobs: "চাকরির তালিকায় ফিরুন",
      loading: "লোড হচ্ছে...",
      notFound: "পৃষ্ঠা পাওয়া যায়নি",
      notFoundDesc: "আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই।",
      goHome: "হোমে যান",
      darkMode: "ডার্ক মোড",
      lightMode: "লাইট মোড",
    },
  },
} as const;

export type TranslationKey = typeof translations.en;

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TranslationKey;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem("mva-locale");
      return saved === "bn" ? "bn" : "en";
    } catch {
      return "en";
    }
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("mva-locale", l);
    } catch {}
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] as TranslationKey }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
