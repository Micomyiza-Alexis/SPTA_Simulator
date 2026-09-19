import Link from "next/link";
import { getSummary } from "../lib/api";
import { LogoutButton } from "../components/LogoutButton";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Simulator", href: "/simulator" },
  { label: "Households", href: "/households" },
  { label: "Scenarios", href: "/scenarios" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function Home() {
  const summary = await getSummary();
  const metrics = [
    { label: "Households analyzed", value: formatNumber(summary.totalHouseholds), note: "Records in current dataset", tone: "navy" },
    { label: "Predicted high risk", value: formatNumber(summary.highRiskHouseholds), note: "Model classification", tone: "teal" },
    { label: "Estimated coverage", value: formatPercent(summary.estimatedCoverage), note: "At current operating point", tone: "amber" },
    { label: "Exclusion error", value: formatPercent(summary.exclusionError), note: "Eligible households missed", tone: "red" },
    { label: "Inclusion error", value: formatPercent(summary.inclusionError), note: "Non-eligible households included", tone: "slate" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#182321]">
      <header className="border-b border-[#d9e0dc] bg-[#fbfcfb]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="SPTA Simulator overview"><span className="flex h-10 w-10 items-center justify-center bg-[#183f4a] text-sm font-semibold tracking-wide text-white">NISR</span><span><span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#087f76]">Research prototype</span><span className="block text-base font-semibold tracking-[-0.01em]">SPTA Simulator</span></span></Link>
        <div className="hidden items-center gap-6 text-right sm:flex"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">Model status</p><p className="mt-1 flex items-center justify-end gap-2 text-xs font-semibold text-[#087f76]"><span className="h-2 w-2 rounded-full bg-[#2d9b83]" />Available</p></div><div className="h-8 w-px bg-[#d9e0dc]" /><p className="font-mono text-[11px] text-[#63716d]">{summary.modelVersion}</p></div>
      </div></header>

      <nav className="border-b border-[#d9e0dc] bg-[#f4f6f5]" aria-label="Primary navigation"><div className="mx-auto flex max-w-[1440px] items-center gap-7 overflow-x-auto px-6 lg:px-10">{navigation.map((item, index) => <Link key={item.label} href={item.href} className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap ${index === 0 ? "border-[#087f76] text-[#183f4a]" : "border-transparent text-[#63716d] hover:text-[#183f4a]"}`}>{item.label}</Link>)}<span className="ml-auto"><LogoutButton /></span></div></nav>

      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087f76]">Decision support / Overview</p><h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#183f4a] sm:text-5xl">Targeting accuracy at a glance.</h1><p className="mt-4 max-w-xl text-base leading-7 text-[#63716d]">Review the model&apos;s current operating point, then explore how coverage and targeting errors change under different thresholds.</p></div><div className="border-l-2 border-[#c8862c] pl-4 text-sm text-[#63716d]"><p className="font-mono text-[10px] uppercase tracking-[0.16em]">Latest data refresh</p><p className="mt-1 font-semibold text-[#183f4a]">{summary.lastUpdated}</p></div></div>

        <section aria-labelledby="headline-metrics"><div className="mb-4 flex items-center justify-between"><h2 id="headline-metrics" className="text-sm font-semibold text-[#183f4a]">Headline metrics</h2><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">Current model output</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map((metric) => <article key={metric.label} className="border border-[#d9e0dc] bg-[#fbfcfb] p-5 shadow-[0_2px_8px_rgba(24,35,33,0.03)]"><div className={`mb-7 h-1 w-10 ${metric.tone === "navy" ? "bg-[#183f4a]" : metric.tone === "teal" ? "bg-[#087f76]" : metric.tone === "amber" ? "bg-[#c8862c]" : metric.tone === "red" ? "bg-[#b8544c]" : "bg-[#63716d]"}`} /><p className="text-sm font-medium text-[#63716d]">{metric.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#183f4a]">{metric.value}</p><p className="mt-2 text-xs leading-5 text-[#63716d]">{metric.note}</p></article>)}</div></section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]" aria-label="Overview guidance"><div className="border border-[#d9e0dc] bg-[#183f4a] p-7 text-white sm:p-9"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a6d9d0]">Next analysis</p><h2 className="mt-4 max-w-lg text-2xl font-semibold tracking-[-0.025em]">Test the policy tradeoff, not just the score.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#d2e1de]">Move the risk threshold in the Simulator to see how many households are reached and which errors change with that decision.</p><Link href="/simulator" className="mt-7 inline-flex border border-[#a6d9d0] px-4 py-2.5 text-sm font-semibold text-[#e3f2ef] hover:bg-[#28606a]">Open simulator <span className="ml-5" aria-hidden="true">-&gt;</span></Link></div><div className="border border-[#d9e0dc] bg-[#fbfcfb] p-7 sm:p-9"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">Interpretation note</p><h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[#183f4a]">A model estimate is not an eligibility decision.</h2><p className="mt-3 text-sm leading-6 text-[#63716d]">This research/demo decision-support prototype is not an official government targeting system. Predictions carry uncertainty and should be reviewed alongside policy context.</p></div></section>
      </main>
      <footer className="border-t border-[#d9e0dc] px-6 py-6 lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 text-xs text-[#63716d] sm:flex-row"><span>NISR 2026 Big Data Hackathon · Track 2</span><span>Prototype data boundary: mock summary API</span></div></footer>
    </div>
  );
}
