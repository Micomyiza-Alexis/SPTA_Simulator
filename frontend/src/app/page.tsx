"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell, PageIntro } from "../components/DashboardShell";
import { getDashboard } from "../lib/api";
import type { DashboardData, StrategyResult } from "../lib/api";

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

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#183f4a]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#63716d]">{detail}</p>
    </article>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [budget, setBudget] = useState(0.1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedResults = useMemo(() => {
    if (!data) return [];

    return strategyOrder
      .map((strategy) => getResult(data.results, strategy, budget))
      .filter((result): result is StrategyResult => Boolean(result));
  }, [data, budget]);

  const summary = useMemo(() => {
    if (selectedResults.length === 0) return null;

    const selected = selectedResults[0];

    return {
      households: selected.households_selected,
      observedCoverage: selectedResults.reduce(
        (max, result) => Math.max(max, result.coverage),
        0,
      ),
      severeCoverage: selectedResults.reduce(
        (max, result) => Math.max(max, result.severe_poor_coverage),
        0,
      ),
      strategies: selectedResults.length,
    };
  }, [selectedResults]);

  return (
    <DashboardShell active="Overview">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="NISR Hackathon / SPTA Simulator"
          title="Social Protection Targeting Accuracy Simulator"
          description="Explore how alternative targeting strategies perform when household selection is constrained by a fixed budget."
        />

        <section className="mb-6 flex flex-col gap-4 border border-[#d9e0dc] bg-[#fbfcfb] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
              Evaluation budget
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
                className={`border px-4 py-2 text-sm font-semibold ${
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
              Loading simulator results...
            </p>
          </section>
        )}

        {error && (
          <section className="border border-[#e8b6b0] bg-[#fff5f3] p-6">
            <h2 className="font-semibold text-[#8d3d37]">
              Dashboard data unavailable
            </h2>
            <p className="mt-2 text-sm text-[#8d3d37]">{error}</p>
            <p className="mt-3 text-xs text-[#63716d]">
              Make sure the FastAPI backend is running on port 8000.
            </p>
          </section>
        )}

        {data && summary && !error && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Households selected"
                value={number(summary.households)}
                detail={`At the ${percent(budget)} evaluation budget`}
              />

              <MetricCard
                label="Observed poor coverage"
                value={percent(summary.observedCoverage)}
                detail="Highest observed coverage among the displayed strategies"
              />

              <MetricCard
                label="Severe-poor coverage"
                value={percent(summary.severeCoverage)}
                detail="Highest observed severe-poor coverage at this budget"
              />

              <MetricCard
                label="Strategies evaluated"
                value={number(summary.strategies)}
                detail="Random, geographic, rule-based, logistic and RF"
              />
            </section>

            <section className="mt-6 border border-[#d9e0dc] bg-[#fbfcfb]">
              <div className="flex flex-col gap-4 border-b border-[#d9e0dc] p-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                    Strategy comparison
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                    Observed results at {percent(budget)}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#63716d]">
                    Results are calculated against the poverty evaluation
                    labels under the selected household budget.
                  </p>
                </div>

                <Link
                  href="/simulator"
                  className="inline-flex items-center justify-center border border-[#087f76] px-4 py-2 text-sm font-semibold text-[#087f76] hover:bg-[#eff9f6]"
                >
                  Open simulator
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d9e0dc] bg-[#f4f6f5] text-xs uppercase tracking-[0.12em] text-[#63716d]">
                      <th className="px-5 py-4 font-semibold">Strategy</th>
                      <th className="px-5 py-4 font-semibold">Poor coverage</th>
                      <th className="px-5 py-4 font-semibold">
                        Severe-poor coverage
                      </th>
                      <th className="px-5 py-4 font-semibold">Precision</th>
                      <th className="px-5 py-4 font-semibold">
                        Exclusion error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedResults.map((result) => (
                      <tr
                        key={result.strategy}
                        className="border-b border-[#e6ebe8] text-sm last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-[#183f4a]">
                          {strategyLabels[result.strategy] ?? result.strategy}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-3">
              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Simulation
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  Budget-constrained targeting
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Examine how the selected budget changes household coverage,
                  precision and targeting errors.
                </p>
                <Link
                  href="/simulator"
                  className="mt-5 inline-block text-sm font-semibold text-[#087f76]"
                >
                  View simulator →
                </Link>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Scenarios
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  Compare evaluation settings
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Review all observed strategies at the available 5%, 10% and
                  20% targeting budgets.
                </p>
                <Link
                  href="/scenarios"
                  className="mt-5 inline-block text-sm font-semibold text-[#087f76]"
                >
                  View scenarios →
                </Link>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Robustness
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  Repeated-split validation
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Review variation across five train/test splits for the
                  machine-learning strategies.
                </p>
              </article>
            </section>
          </>
        )}

        <p className="mt-6 text-xs leading-5 text-[#63716d]">
          Evaluation results describe observed performance on the current
          test-set simulation. They do not establish individual eligibility
          or determine a social protection policy decision.
        </p>
      </main>
    </DashboardShell>
  );
}
