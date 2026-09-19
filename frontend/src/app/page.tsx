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
    { label: "Households analyzed", value: formatNumber(summary.totalHouseholds), note: "Records in current dataset", tone: "bg-[#123b43]" },
    { label: "Predicted high risk", value: formatNumber(summary.highRiskHouseholds), note: "Model classification", tone: "bg-[#087f76]" },
    { label: "Estimated coverage", value: formatPercent(summary.estimatedCoverage), note: "At current operating point", tone: "bg-[#c8862c]" },
    { label: "Exclusion error", value: formatPercent(summary.exclusionError), note: "Eligible households missed", tone: "bg-[#b8544c]" },
    { label: "Inclusion error", value: formatPercent(summary.inclusionError), note: "Non-eligible households included", tone: "bg-[#63716d]" },
  ];

  return (
    <DashboardShell active="Overview">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro eyebrow="Decision support / Overview" title="Targeting accuracy at a glance." description="Review the model's current operating point, then explore how coverage and targeting errors change under different thresholds." />

        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_320px]" aria-label="Model summary">
          <div className="relative overflow-hidden bg-[#123b43] p-7 text-white sm:p-9">
            <div className="relative z-10 max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a8e0d5]">Current operating point</p>
              <p className="mt-4 text-5xl font-semibold tracking-[-0.05em]">{formatPercent(summary.estimatedCoverage)}</p>
              <p className="mt-2 text-sm text-[#d2e1de]">estimated coverage across the analyzed population</p>
              <Link href="/simulator" className="mt-7 inline-flex items-center bg-[#e7c46a] px-4 py-3 text-sm font-semibold text-[#123b43] transition-colors hover:bg-[#f1d98f]">Explore threshold tradeoffs <span className="ml-6" aria-hidden="true">-&gt;</span></Link>
            </div>
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[28px] border-[#21616a] opacity-70" aria-hidden="true" />
            <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full border-[22px] border-[#087f76] opacity-50" aria-hidden="true" />
          </div>
          <div className="border border-[#d7e0dc] bg-[#f8faf9] p-7 sm:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">Model snapshot</p>
            <dl className="mt-6 space-y-5">
              <div className="flex items-end justify-between gap-4 border-b border-[#d7e0dc] pb-4"><dt className="text-sm text-[#63716d]">Model version</dt><dd className="font-mono text-sm font-semibold text-[#123b43]">{summary.modelVersion}</dd></div>
              <div className="flex items-end justify-between gap-4 border-b border-[#d7e0dc] pb-4"><dt className="text-sm text-[#63716d]">Data refresh</dt><dd className="font-mono text-sm font-semibold text-[#123b43]">{summary.lastUpdated}</dd></div>
              <div className="flex items-end justify-between gap-4"><dt className="text-sm text-[#63716d]">Status</dt><dd className="flex items-center gap-2 text-sm font-semibold text-[#087f76]"><span className="h-2 w-2 rounded-full bg-[#2d9b83]" />Available</dd></div>
            </dl>
          </div>
        </section>

        <section aria-labelledby="headline-metrics">
          <div className="mb-4 flex items-center justify-between"><h2 id="headline-metrics" className="text-sm font-semibold text-[#123b43]">Headline metrics</h2><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">Current model output</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => <article key={metric.label} className="border border-[#d7e0dc] bg-[#f8faf9] p-5 shadow-[0_2px_8px_rgba(18,59,67,0.04)]"><div className={`mb-7 h-1 w-10 ${metric.tone}`} /><p className="text-sm font-medium text-[#63716d]">{metric.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#123b43]">{metric.value}</p><p className="mt-2 text-xs leading-5 text-[#63716d]">{metric.note}</p></article>)}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3" aria-label="Analysis tools">
          <ToolLink href="/simulator" eyebrow="01 / Explore" title="Test a threshold" description="See how projected coverage and targeting errors move as the risk threshold changes." />
          <ToolLink href="/households" eyebrow="02 / Review" title="Inspect records" description="Search anonymized household risk records by identifier, district, and category." />
          <ToolLink href="/scenarios" eyebrow="03 / Compare" title="Compare scenarios" description="Place named operating points side by side before discussing a policy choice." />
        </section>

        <p className="mt-10 max-w-3xl border-l-2 border-[#c8862c] pl-4 text-sm leading-6 text-[#63716d]">A model estimate is not an eligibility decision. Predictions carry uncertainty and should be reviewed alongside policy context.</p>
      </main>
    </DashboardShell>
  );
}

function ToolLink({ href, eyebrow, title, description }: { href: string; eyebrow: string; title: string; description: string }) {
  return <Link href={href} className="group border border-[#d7e0dc] bg-[#f8faf9] p-6 transition-colors hover:border-[#087f76] hover:bg-white"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#087f76]">{eyebrow}</p><h2 className="mt-5 text-xl font-semibold text-[#123b43]">{title}<span className="ml-3 text-[#087f76] transition-transform group-hover:ml-4" aria-hidden="true">-&gt;</span></h2><p className="mt-3 text-sm leading-6 text-[#63716d]">{description}</p></Link>;
}
