"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const heroImages = [
  "/IMG_20260821_120344_640.png",
  "/IMG_20260821_120408_084.png",
  "/IMG_20260821_120429_892.png",
  "/IMG_20260821_120448_798.png",
  "/IMG_20260821_120518_669.png",
  "/IMG_20260821_120629_594.png",
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <span className="text-4xl font-bold text-blue-600">{value}</span>
      <span className="mt-2 text-sm font-medium uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative isolate overflow-hidden bg-blue-950 text-white">
        <div className="absolute inset-0 -z-20">
          {heroImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt="Moldova vineyard and agricultural work"
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover transition-opacity duration-1000 ${
                index === activeImage ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-950/90 via-blue-900/65 to-blue-950/30" />

        <div className="mx-auto flex min-h-[620px] max-w-6xl items-end px-6 py-20 sm:min-h-[680px] sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              Moldova • Agriculture • European Opportunities
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Your Trusted Bridge to European Opportunity
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">
              We connect Moldovan talent with verified employers across Europe.
              Comprehensive visa support, legal guidance, and job placement
              assistance for a secure future.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/apply"
                className="rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-gray-900 shadow-lg transition hover:bg-yellow-300"
              >
                General Apply
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-white/80 bg-white/10 px-8 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Contact Advisors
              </Link>
            </div>

            <div className="mt-8 flex gap-2" aria-label="Hero slideshow controls">
              {heroImages.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === activeImage}
                  onClick={() => setActiveImage(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeImage ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-12 sm:grid-cols-3">
        <StatCard value="24/7" label="Support" />
        <StatCard value="100%" label="Application Guidance" />
        <StatCard value="EU" label="Destination Focus" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-gray-50 p-8">
          <h2 className="text-3xl font-bold">Start Your Application</h2>
          <p className="mt-3 text-gray-600">
            Submit your application and our team can guide you through the
            required process.
          </p>

          <Link
            href="/apply"
            className="mt-6 inline-block rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </main>
  );
}
