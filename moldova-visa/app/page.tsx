import Link from "next/link";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <span className="text-4xl font-bold text-blue-600">{value}</span>
      <span className="mt-2 text-sm font-medium uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="bg-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h1 className="text-5xl font-bold">
            Moldova Visa Assist
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-blue-100">
            Professional visa and work permit assistance for applicants
            seeking opportunities in Moldova.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/apply"
              className="rounded-lg bg-yellow-400 px-8 py-3 font-semibold text-gray-900"
            >
              General Apply
            </Link>

            <Link
              href="/contact"
              className="rounded-lg border border-white px-8 py-3 font-semibold text-white"
            >
              Contact Advisors
            </Link>
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
