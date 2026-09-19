"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { getDashboard } from "../../lib/api";
import type { DashboardData, StrategyResult } from "../../lib/api";

const strategyLabels: Record<string, string> = {
  Random: "Random targeting",
  Geographic: "Geographic targeting",
  Rule: "Transparent rule-based",
  Logistic: "Logistic targeting",
  RF: "Random Forest",
};

const strategyOrder = ["Random", "Geographic", "Rule", "Logistic", "RF"];

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function getResult(
  results: StrategyResult[],
  strategy: string,
  budget: number,
) {
  return results.find(
    (result) =>
      result.strategy === strategy &&
      Math.abs(result.budget - budget) < 0.001,
  );
}

export default function ScenariosPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [budget, setBudget] = useState(0.1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load scenarios.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const results = useMemo(() => {
    if (!data) return [];

    return strategyOrder
      .map((strategy) => getResult(data.results, strategy, budget))
      .filter((result): result is StrategyResult => Boolean(result));
  }, [data, budget]);

  const chartData = results.map((result) => ({
    strategy: strategyLabels[result.strategy] ?? result.strategy,
    coverage: result.coverage * 100,
    severePoorCoverage: result.severe_poor_coverage * 100,
    precision: result.precision * 100,
  }));

  return (
    <DashboardShell active="Scenarios">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Decision support / Scenarios"
          title="Compare budget-constrained targeting scenarios."
          description="Explore how the observed targeting strategies perform when different shares of households can be selected. Results are presented side by side without ranking a strategy."
        />

        <section className="mb-6 flex flex-col gap-4 border border-[#d9e0dc] bg-[#fbfcfb] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
              Scenario budget
            </p>
            <p className="mt-2 text-sm text-[#63716d]">
              Select the share of households available for targeting.
            </p>
          </div>

          <div className="flex gap-2">
            {[0.05, 0.1, 0.2].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setBudget(value)}
                className={`border px-4 py-2 text-sm font-semibold transition ${
                  budget === value
                    ? "border-[#087f76] bg-[#087f76] text-white"
                    : "border-[#bfcac5] bg-white text-[#183f4a] hover:border-[#087f76]"
                }`}
              >
                {percent(value)}
              </button>
            ))}
          </div>
        </section>

        {isLoading && (
          <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-8">
            <p className="text-sm text-[#63716d]">
              Loading scenario results...
            </p>
          </section>
        )}

        {error && (
          <section className="border border-[#e8b6b0] bg-[#fff5f3] p-6">
            <h2 className="font-semibold text-[#8d3d37]">
              Scenario data unavailable
            </h2>
            <p className="mt-2 text-sm text-[#8d3d37]">{error}</p>
          </section>
        )}

        {data && !error && (
          <div className="space-y-6">
            <section className="border border-[#d9e0dc] bg-[#fbfcfb]">
              <div className="border-b border-[#d9e0dc] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Observed outcomes
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Results at a {percent(budget)} targeting budget
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Coverage indicates the share of poor households reached by
                  the selected households. Precision indicates the share of
                  selected households that are poor under the evaluation
                  definition.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d9e0dc] bg-[#f4f6f5] text-xs uppercase tracking-[0.12em] text-[#63716d]">
                      <th className="px-5 py-4 font-semibold">Strategy</th>
                      <th className="px-5 py-4 font-semibold">Selected</th>
                      <th className="px-5 py-4 font-semibold">Poor coverage</th>
                      <th className="px-5 py-4 font-semibold">Severe-poor coverage</th>
                      <th className="px-5 py-4 font-semibold">Precision</th>
                      <th className="px-5 py-4 font-semibold">Exclusion</th>
                      <th className="px-5 py-4 font-semibold">Inclusion</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.strategy}
                        className="border-b border-[#e6ebe8] text-sm last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-[#183f4a]">
                          {strategyLabels[result.strategy] ?? result.strategy}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#63716d]">
                          {number(result.households_selected)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#087f76]">
                          {percent(result.coverage)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#087f76]">
                          {percent(result.severe_poor_coverage)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#183f4a]">
                          {percent(result.precision)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#8d3d37]">
                          {percent(result.exclusion_error)}
                        </td>
                        <td className="px-5 py-4 font-mono text-[#93631e]">
                          {percent(result.inclusion_error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
              <div>
                <h2 className="text-lg font-semibold text-[#183f4a]">
                  Coverage comparison
                </h2>
                <p className="mt-1 text-sm text-[#63716d]">
                  Observed poor-household coverage for each strategy at the
                  selected budget.
                </p>
              </div>

              <div className="mt-6 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke="#e3e9e5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="strategy"
                      tick={{ fill: "#63716d", fontSize: 11 }}
                    />
                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fill: "#63716d", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Poor coverage",
                      ]}
                    />
                    <Bar
                      dataKey="coverage"
                      fill="#087f76"
                      name="Poor coverage"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              {results.map((result) => (
                <article
                  key={result.strategy}
                  className="border border-[#d9e0dc] bg-[#fbfcfb] p-6"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                    Strategy
                  </p>

                  <h3 className="mt-2 font-semibold text-[#183f4a]">
                    {strategyLabels[result.strategy] ?? result.strategy}
                  </h3>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#63716d]">Poor coverage</dt>
                      <dd className="font-mono font-semibold text-[#183f4a]">
                        {percent(result.coverage)}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-[#63716d]">Precision</dt>
                      <dd className="font-mono font-semibold text-[#183f4a]">
                        {percent(result.precision)}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-4">
                      <dt className="text-[#63716d]">Weighted poor reached</dt>
                      <dd className="font-mono font-semibold text-[#183f4a]">
                        {number(result.weighted_poor_selected)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-[#63716d]">
          These are evaluation results from the current test-set simulation.
          They describe observed performance under each budget constraint and
          do not by themselves establish program eligibility or a policy
          decision.
        </p>
      </main>
    </DashboardShell>
  );
}
