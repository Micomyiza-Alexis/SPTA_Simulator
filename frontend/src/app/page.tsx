import Link from "next/link";
import { DashboardShell, PageIntro } from "../components/DashboardShell";
import { getSummary } from "../lib/api";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function Home() {
  const summary = await getSummary();
  const metrics = [
    { label: "Households analyzed", value: formatNumber(summary.totalHouseholds), note: "Records in current dataset", tone: "bg-[#0f3a42]" },
    { label: "Predicted high risk", value: formatNumber(summary.highRiskHouseholds), note: "Model classification", tone: "bg-[#0b8a80]" },
    { label: "Estimated coverage", value: formatPercent(summary.estimatedCoverage), note: "At current operating point", tone: "bg-[#c8862c]" },
    { label: "Exclusion error", value: formatPercent(summary.exclusionError), note: "Eligible households missed", tone: "bg-[#b8544c]" },
    { label: "Inclusion error", value: formatPercent(summary.inclusionError), note: "Non-eligible households included", tone: "bg-[#5c6c68]" },
  ];

  return (
    <DashboardShell active="Overview">
      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
        <PageIntro
          eyebrow="Decision support / Overview"
          title="Targeting accuracy at a glance."
          description="Review the model's current operating point, then explore how coverage and targeting errors change under different thresholds."
        />

        <section className="mb-7 grid gap-4 lg:grid-cols-[1fr_320px]" aria-label="Model summary">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f3a42] via-[#14545c] to-[#0b8a80] p-7 text-white shadow-[0_24px_50px_-28px_rgba(15,58,66,0.7)] sm:p-8">
            <div className="relative z-10 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8e0d5]">Current operating point</p>
              <p className="mt-4 text-5xl font-semibold tracking-tight">{formatPercent(summary.estimatedCoverage)}</p>
              <p className="mt-2 text-sm text-[#d2e1de]">estimated coverage across the analyzed population</p>
              <Link
                href="/simulator"
                className="mt-7 inline-flex items-center rounded-full bg-[#e7c46a] px-5 py-2.5 text-sm font-semibold text-[#0f3a42] transition hover:bg-[#f1d98f]"
              >
                Explore threshold tradeoffs
                <span className="ml-3" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[28px] border-white/10" aria-hidden="true" />
            <div className="absolute -bottom-24 right-16 h-56 w-56 rounded-full bg-[#e7c46a]/15 blur-2xl" aria-hidden="true" />
          </div>
          <div className="panel rounded-[28px] p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c6c68]">Model snapshot</p>
            <dl className="mt-6 space-y-5">
              <div className="flex items-end justify-between gap-4 border-b border-[#e6eeea] pb-4">
                <dt className="text-sm text-[#5c6c68]">Model version</dt>
                <dd className="font-mono text-sm font-semibold text-[#0f3a42]">{summary.modelVersion}</dd>
              </div>
              <div className="flex items-end justify-between gap-4 border-b border-[#e6eeea] pb-4">
                <dt className="text-sm text-[#5c6c68]">Data refresh</dt>
                <dd className="font-mono text-sm font-semibold text-[#0f3a42]">{summary.lastUpdated}</dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-sm text-[#5c6c68]">Status</dt>
                <dd className="flex items-center gap-2 rounded-full bg-[#e8f6f3] px-2.5 py-1 text-sm font-semibold text-[#0b8a80]">
                  <span className="h-2 w-2 rounded-full bg-[#2d9b83]" />
                  Available
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="headline-metrics">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="headline-metrics" className="text-sm font-semibold text-[#0f3a42]">
              Headline metrics
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5c6c68]">Current model output</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <article key={metric.label} className="panel rounded-3xl p-5">
                <div className={`mb-6 h-1.5 w-10 rounded-full ${metric.tone}`} />
                <p className="text-sm font-medium text-[#5c6c68]">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0f3a42]">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#5c6c68]">{metric.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-label="Analysis tools">
          <ToolLink href="/simulator" eyebrow="01 / Explore" title="Test a threshold" description="See how projected coverage and targeting errors move as the risk threshold changes." />
          <ToolLink href="/households" eyebrow="02 / Review" title="Inspect records" description="Search anonymized household risk records by identifier, district, and category." />
          <ToolLink href="/scenarios" eyebrow="03 / Compare" title="Compare scenarios" description="Place named operating points side by side before discussing a policy choice." />
        </section>

        <p className="mt-8 max-w-3xl rounded-2xl border border-[#eed39f] bg-[#fffaf0] px-4 py-3 text-sm leading-6 text-[#93631e]">
          A model estimate is not an eligibility decision. Predictions carry uncertainty and should be reviewed alongside policy context.
        </p>
      </main>
    </DashboardShell>
  );
}

function ToolLink({ href, eyebrow, title, description }: { href: string; eyebrow: string; title: string; description: string }) {
  return (
    <Link href={href} className="panel group rounded-3xl p-6 transition hover:-translate-y-0.5 hover:border-[#0b8a80]/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0b8a80]">{eyebrow}</p>
      <h2 className="mt-4 text-xl font-semibold text-[#0f3a42]">
        {title}
        <span className="ml-2 inline-block text-[#0b8a80] transition-transform group-hover:translate-x-1" aria-hidden="true">
          →
        </span>
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#5c6c68]">{description}</p>
    </Link>
  );
}
