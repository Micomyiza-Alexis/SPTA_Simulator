"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { compareScenarios } from "../../lib/api";
import type { Scenario } from "../../lib/mockApi";

const initialScenarios = [
  { name: "Higher coverage", threshold: 35 },
  { name: "Balanced", threshold: 50 },
  { name: "Stricter targeting", threshold: 65 },
];

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [results, setResults] = useState<Scenario[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  async function runComparison() {
    setIsComparing(true);
    setResults(await compareScenarios(scenarios));
    setIsComparing(false);
  }

  function updateScenario(index: number, field: "name" | "threshold", value: string) {
    setScenarios((current) =>
      current.map((scenario, scenarioIndex) =>
        scenarioIndex === index ? { ...scenario, [field]: field === "threshold" ? Number(value) : value } : scenario,
      ),
    );
  }

  return (
    <DashboardShell active="Scenarios">
      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
        <PageIntro
          eyebrow="Decision support / Scenarios"
          title="Compare operating points side by side."
          description="Define a small set of named thresholds and compare the resulting coverage and targeting errors. The interface presents the tradeoffs without ranking a scenario as best."
        />
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="panel rounded-[28px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5c6c68]">Scenario definitions</p>
            <div className="mt-5 space-y-4">
              {scenarios.map((scenario, index) => (
                <div key={index} className="rounded-2xl bg-[#f7faf9] p-4">
                  <label className="block text-sm font-semibold text-[#0f3a42]">
                    Scenario {index + 1}
                    <input
                      value={scenario.name}
                      onChange={(event) => updateScenario(index, "name", event.target.value)}
                      className="mt-2 block w-full rounded-xl border border-[#d7e2de] bg-white px-3 py-2 text-sm font-normal outline-none ring-[#0b8a80]/20 transition focus:border-[#0b8a80] focus:ring-4"
                    />
                  </label>
                  <label className="mt-3 block text-sm font-semibold text-[#0f3a42]">
                    Risk threshold
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scenario.threshold}
                      onChange={(event) => updateScenario(index, "threshold", event.target.value)}
                      className="mt-2 block w-full rounded-xl border border-[#d7e2de] bg-white px-3 py-2 font-mono text-sm font-normal outline-none ring-[#0b8a80]/20 transition focus:border-[#0b8a80] focus:ring-4"
                    />
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={runComparison}
              disabled={isComparing}
              className="mt-6 w-full rounded-full bg-[#0b8a80] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#066b64] disabled:opacity-60"
            >
              {isComparing ? "Comparing..." : "Compare scenarios"}
            </button>
            <p className="mt-4 text-xs leading-5 text-[#5c6c68]">Request: POST /api/scenarios/compare</p>
          </section>
          <section className="space-y-5">
            <div className="panel rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f3a42]">Outcome comparison</h2>
                  <p className="mt-1 text-sm text-[#5c6c68]">Coverage and error estimates returned for each scenario.</p>
                </div>
                {results.length === 0 && <span className="rounded-full bg-[#f7faf9] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[#5c6c68]">Awaiting run</span>}
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#e6eeea] text-xs uppercase tracking-[0.12em] text-[#5c6c68]">
                      <th className="pb-3 font-semibold">Scenario</th>
                      <th className="pb-3 font-semibold">Threshold</th>
                      <th className="pb-3 font-semibold">Coverage</th>
                      <th className="pb-3 font-semibold">Exclusion</th>
                      <th className="pb-3 font-semibold">Inclusion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((scenario) => (
                      <tr key={scenario.name} className="border-b border-[#eef3f1] text-sm last:border-0">
                        <td className="py-4 font-semibold text-[#0f3a42]">{scenario.name}</td>
                        <td className="py-4 font-mono text-[#5c6c68]">{scenario.threshold}</td>
                        <td className="py-4 font-mono text-[#0b8a80]">{scenario.coverage.toFixed(1)}%</td>
                        <td className="py-4 font-mono text-[#8d3d37]">{scenario.exclusionError.toFixed(1)}%</td>
                        <td className="py-4 font-mono text-[#93631e]">{scenario.inclusionError.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {results.length > 0 && (
              <div className="panel rounded-[28px] p-6">
                <h2 className="text-lg font-semibold text-[#0f3a42]">Coverage by scenario</h2>
                <p className="mt-1 text-sm text-[#5c6c68]">Higher coverage is shown alongside the named policy choice.</p>
                <div className="mt-6 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid stroke="#e3e9e5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#5c6c68", fontSize: 11 }} />
                      <YAxis unit="%" tick={{ fill: "#5c6c68", fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Coverage"]} />
                      <Bar dataKey="coverage" fill="#0b8a80" radius={[8, 8, 0, 0]} name="Coverage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </DashboardShell>
  );
}
