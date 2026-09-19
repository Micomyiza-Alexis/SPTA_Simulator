"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { simulate } from "../../lib/api";
import type { SimulationResult } from "../../lib/mockApi";

const CURRENT_THRESHOLD = 50;
const chartAxis = { fill: "#63716d", fontSize: 11 };

export default function SimulatorPage() {
  const [threshold, setThreshold] = useState(CURRENT_THRESHOLD);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      simulate(threshold)
        .then(setResult)
        .catch(() => setError("The simulation could not be updated. Please try again."))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [threshold]);

  const metrics = result ? [
    { label: "Coverage", value: `${result.coverage.toFixed(1)}%`, note: "Population reached", color: "#087f76" },
    { label: "Exclusion error", value: `${result.exclusionError.toFixed(1)}%`, note: "Eligible households missed", color: "#b8544c" },
    { label: "Inclusion error", value: `${result.inclusionError.toFixed(1)}%`, note: "Non-eligible households included", color: "#c8862c" },
  ] : [];

  return <DashboardShell active="Simulator"><main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
    <PageIntro eyebrow="Decision support / Simulator" title="Examine the targeting tradeoff." description="Adjust the risk threshold to see how projected coverage and targeting errors move together. Results update after a short pause while you drag the control." />
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <section className="h-fit border border-[#d9e0dc] bg-[#fbfcfb] p-6" aria-labelledby="controls-title"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">Model control</p><h2 id="controls-title" className="mt-3 text-lg font-semibold text-[#183f4a]">Risk threshold</h2><p className="mt-2 text-sm leading-6 text-[#63716d]">Households at or above this score are classified as higher risk. The available mock/API contract currently supports this parameter only.</p><output className="mt-8 block text-4xl font-semibold tracking-[-0.04em] text-[#183f4a]" htmlFor="risk-threshold">{threshold}<span className="ml-1 text-xl text-[#63716d]">/ 100</span></output><label htmlFor="risk-threshold" className="sr-only">Risk threshold from 0 to 100</label><input id="risk-threshold" aria-label="Risk threshold" type="range" min="0" max="100" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-7 w-full accent-[#087f76]" /><div className="mt-2 flex justify-between font-mono text-[10px] text-[#63716d]"><span>0 lower risk</span><span>100 higher risk</span></div><button type="button" onClick={() => setThreshold(CURRENT_THRESHOLD)} disabled={threshold === CURRENT_THRESHOLD} className="mt-8 w-full border border-[#087f76] px-4 py-2.5 text-sm font-semibold text-[#087f76] hover:bg-[#eff9f6] disabled:cursor-not-allowed disabled:border-[#d9e0dc] disabled:text-[#9aa8a3]">Reset to current operating point</button><div className="mt-8 border-t border-[#d9e0dc] pt-5"><p className="text-xs font-semibold text-[#183f4a]">Current request</p><p className="mt-2 font-mono text-xs text-[#63716d]">POST /api/simulate</p><p className="mt-1 font-mono text-xs text-[#63716d]">threshold: {threshold}</p></div></section>

      <section className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{metrics.map((metric) => <article key={metric.label} className="relative border border-[#d9e0dc] bg-[#fbfcfb] p-5 shadow-[0_2px_8px_rgba(24,35,33,0.03)]"><div className="mb-7 h-1 w-10" style={{ backgroundColor: metric.color }} /><p className="text-sm font-medium text-[#63716d]">{metric.label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#183f4a]">{metric.value}</p><p className="mt-2 text-xs leading-5 text-[#63716d]">{metric.note}</p>{isLoading && <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#087f76]">Updating</span>}</article>)}{!result && <div className="col-span-full border border-[#d9e0dc] bg-[#fbfcfb] p-5 text-sm text-[#63716d]">Loading current model output...</div>}</div>{error && <p role="alert" className="border-l-2 border-[#b8544c] bg-[#fff5f3] px-3 py-2 text-sm text-[#8d3d37]">{error}</p>}

        <div className="grid gap-5 lg:grid-cols-2"><ChartCard title="Coverage vs exclusion error" description="Each point is a threshold operating point."><ResponsiveContainer width="100%" height="100%"><LineChart data={result?.tradeoff ?? []} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}><CartesianGrid stroke="#e3e9e5" vertical={false} /><XAxis type="number" dataKey="coverage" domain={[35, 100]} unit="%" tick={chartAxis} label={{ value: "Coverage", position: "insideBottom", offset: -4, fill: "#63716d", fontSize: 11 }} /><YAxis unit="%" tick={chartAxis} label={{ value: "Exclusion error", angle: -90, position: "insideLeft", fill: "#63716d", fontSize: 11 }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Exclusion error"]} labelFormatter={(value) => `Coverage: ${Number(value).toFixed(1)}%`} /><Line type="monotone" dataKey="exclusionError" stroke="#b8544c" strokeWidth={2.5} dot={{ fill: "#b8544c", r: 3 }} name="Exclusion error" /></LineChart></ResponsiveContainer></ChartCard><ChartCard title="Coverage vs inclusion error" description="The same operating points show the other error tradeoff."><ResponsiveContainer width="100%" height="100%"><LineChart data={result?.tradeoff ?? []} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}><CartesianGrid stroke="#e3e9e5" vertical={false} /><XAxis type="number" dataKey="coverage" domain={[35, 100]} unit="%" tick={chartAxis} label={{ value: "Coverage", position: "insideBottom", offset: -4, fill: "#63716d", fontSize: 11 }} /><YAxis unit="%" tick={chartAxis} label={{ value: "Inclusion error", angle: -90, position: "insideLeft", fill: "#63716d", fontSize: 11 }} /><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Inclusion error"]} labelFormatter={(value) => `Coverage: ${Number(value).toFixed(1)}%`} /><Line type="monotone" dataKey="inclusionError" stroke="#c8862c" strokeWidth={2.5} dot={{ fill: "#c8862c", r: 3 }} name="Inclusion error" /></LineChart></ResponsiveContainer></ChartCard></div>

        <div className="border border-[#d9e0dc] bg-[#fbfcfb] p-6"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h2 className="text-lg font-semibold text-[#183f4a]">Risk score distribution</h2><p className="mt-1 text-sm text-[#63716d]">Anonymized household counts by model score band.</p></div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#087f76]">Current cut: {threshold}</p></div><div className="mt-6 h-[290px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={result?.distribution ?? []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}><CartesianGrid stroke="#e3e9e5" vertical={false} /><XAxis type="number" dataKey="score" domain={[0, 100]} tickFormatter={(value) => `${Number(value) - 5}-${value}`} tick={chartAxis} label={{ value: "Risk score", position: "insideBottom", offset: -4, fill: "#63716d", fontSize: 11 }} /><YAxis tick={chartAxis} label={{ value: "Households", angle: -90, position: "insideLeft", fill: "#63716d", fontSize: 11 }} /><Tooltip labelFormatter={(value) => `Score band: ${Number(value) - 5}-${value}`} /><ReferenceLine x={threshold} stroke="#183f4a" strokeWidth={2} label={{ value: "Threshold", position: "insideTopRight", fill: "#183f4a", fontSize: 11 }} /><Bar dataKey="households" name="Households" fill="#183f4a" barSize={24} /></BarChart></ResponsiveContainer></div></div>

        <div className="border border-[#d9e0dc] bg-[#fbfcfb] p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">Interpretation note</p><p className="mt-3 max-w-3xl text-sm leading-6 text-[#63716d]">These are projected effects of a rule change on modeled risk, not a guarantee of the accuracy of model classifications. Review threshold choices alongside policy context and uncertainty.</p></div>
      </section>
    </div>
  </main></DashboardShell>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="border border-[#d9e0dc] bg-[#fbfcfb] p-6"><h2 className="text-lg font-semibold text-[#183f4a]">{title}</h2><p className="mt-1 text-sm text-[#63716d]">{description}</p><div className="mt-5 h-[270px] w-full">{children}</div></div>;
}
