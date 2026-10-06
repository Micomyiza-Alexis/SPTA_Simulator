"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { getDashboard, STRATEGY_KEYS, STRATEGY_LABELS } from "../../lib/api";
import type { DashboardData, StrategyResult } from "../../lib/api";

const strategyOrder: readonly string[] = STRATEGY_KEYS;
const scenarioRates = [0.05, 0.1, 0.2];

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function percentagePoints(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} pp`;
}

function getResult(
  results: StrategyResult[],
  strategy: string,
  budget: number,
) {
  return results.find(
    (result) =>
      result.strategy === strategy && Math.abs(result.budget - budget) < 0.001,
  );
}

function getLeader(
  results: StrategyResult[],
  metric: keyof Pick<
    StrategyResult,
    "coverage" | "severe_poor_coverage" | "precision"
  >,
) {
  return [...results].sort((a, b) => b[metric] - a[metric])[0];
}

function getStrategyLabel(strategy?: string) {
  if (!strategy) return "—";
  return STRATEGY_LABELS[strategy] ?? strategy;
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
        setError(
          err instanceof Error ? err.message : "Unable to load scenarios.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const results = useMemo(() => {
    if (!data) return [];

    return strategyOrder
      .map((strategy) => getResult(data.results, strategy, budget))
      .filter((result): result is StrategyResult => Boolean(result));
  }, [data, budget]);

  const coverageLeader = useMemo(
    () => getLeader(results, "coverage"),
    [results],
  );

  const severePoorLeader = useMemo(
    () => getLeader(results, "severe_poor_coverage"),
    [results],
  );

  const precisionLeader = useMemo(
    () => getLeader(results, "precision"),
    [results],
  );

  const randomResult = useMemo(
    () => results.find((result) => result.strategy === "Random Targeting"),
    [results],
  );

  const coverageGainVsRandom =
    coverageLeader && randomResult
      ? coverageLeader.coverage - randomResult.coverage
      : null;

  const chartData = results.map((result) => ({
    strategy: STRATEGY_LABELS[result.strategy] ?? result.strategy,
    coverage: result.coverage * 100,
    precision: result.precision * 100,
  }));

  const scenarioTrend = useMemo(() => {
    if (!data) return [];

    return scenarioRates.map((rate) => {
      const scenarioResults = strategyOrder
        .map((strategy) => getResult(data.results, strategy, rate))
        .filter((result): result is StrategyResult => Boolean(result));

      const logistic = scenarioResults.find(
        (result) => result.strategy === "Logistic Targeting",
      );

      const rf = scenarioResults.find(
        (result) => result.strategy === "Random Forest Targeting",
      );

      return {
        rate,
        logisticCoverage: logistic?.coverage ?? 0,
        logisticPrecision: logistic?.precision ?? 0,
        logisticSeverePoor: logistic?.severe_poor_coverage ?? 0,
        rfCoverage: rf?.coverage ?? 0,
        rfPrecision: rf?.precision ?? 0,
      };
    });
  }, [data]);

  const lowestScenario = scenarioTrend[0];
  const highestScenario = scenarioTrend[scenarioTrend.length - 1];

  const coverageChange =
    lowestScenario && highestScenario
      ? highestScenario.logisticCoverage - lowestScenario.logisticCoverage
      : null;

  const precisionChange =
    lowestScenario && highestScenario
      ? highestScenario.logisticPrecision - lowestScenario.logisticPrecision
      : null;

  return (
    <DashboardShell active="Scenarios">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Decision support / Scenarios"
          title="What changes when the selection rate changes?"
          description="Compare targeting strategies under three household selection constraints and examine the trade-off between reaching more poor households and concentrating assistance among those selected."
        />

        <section className="mb-6 border border-[#d9e0dc] bg-[#fbfcfb]">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                Household selection rate
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                Select how many households can be targeted.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#63716d]">
                These scenarios represent the share of households selected for
                targeting. They are selection constraints, not monetary budget
                amounts.
              </p>
            </div>

            <div className="flex gap-2">
              {scenarioRates.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBudget(value)}
                  aria-pressed={budget === value}
                  className={`min-w-[72px] border px-4 py-2.5 text-sm font-semibold transition ${
                    budget === value
                      ? "border-[#087f76] bg-[#087f76] text-white"
                      : "border-[#bfcac5] bg-white text-[#183f4a] hover:border-[#087f76] hover:text-[#087f76]"
                  }`}
                >
                  {percent(value)}
                </button>
              ))}
            </div>
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

        {data && !error && results.length > 0 && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="border border-[#b8dcd7] bg-[#f2faf8] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Coverage leader
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  {getStrategyLabel(coverageLeader?.strategy)}
                </h2>

                <p className="mt-4 font-mono text-3xl font-semibold text-[#087f76]">
                  {coverageLeader ? percent(coverageLeader.coverage) : "—"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#63716d]">
                  Poor-household coverage at the {percent(budget)} selection
                  rate.
                </p>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Severe-poor leader
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  {getStrategyLabel(severePoorLeader?.strategy)}
                </h2>

                <p className="mt-4 font-mono text-3xl font-semibold text-[#087f76]">
                  {severePoorLeader
                    ? percent(severePoorLeader.severe_poor_coverage)
                    : "—"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#63716d]">
                  Severe-poor households reached under this scenario.
                </p>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Precision leader
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  {getStrategyLabel(precisionLeader?.strategy)}
                </h2>

                <p className="mt-4 font-mono text-3xl font-semibold text-[#183f4a]">
                  {precisionLeader ? percent(precisionLeader.precision) : "—"}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#63716d]">
                  Share of selected households that are poor under the
                  evaluation definition.
                </p>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Households selected
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  {number(coverageLeader?.households_selected ?? 0)}
                </h2>

                <p className="mt-4 font-mono text-3xl font-semibold text-[#183f4a]">
                  {percent(budget)}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#63716d]">
                  Selected from the held-out evaluation population.
                </p>
              </article>
            </section>

            <section className="border border-[#b8dcd7] bg-[#f2faf8] p-6 lg:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                    Scenario finding
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#183f4a]">
                    {getStrategyLabel(coverageLeader?.strategy)} provides the
                    strongest poor-household coverage at {percent(budget)}.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#63716d]">
                    {coverageLeader
                      ? `${getStrategyLabel(
                          coverageLeader.strategy,
                        )} reaches ${percent(
                          coverageLeader.coverage,
                        )} of poor households under this selection constraint.`
                      : "The selected scenario is available for comparison."}{" "}
                    {coverageGainVsRandom !== null &&
                      coverageLeader?.strategy !== "Random Targeting" && (
                        <>
                          That is{" "}
                          <strong className="text-[#183f4a]">
                            {percentagePoints(coverageGainVsRandom)}
                          </strong>{" "}
                          higher coverage than the random baseline at the same
                          selection rate.
                        </>
                      )}
                  </p>
                </div>

                <div className="shrink-0 border border-[#b8dcd7] bg-white px-5 py-4">
                  <p className="text-xs text-[#63716d]">Coverage</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#087f76]">
                    {coverageLeader ? percent(coverageLeader.coverage) : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-[#d9e0dc] bg-[#fbfcfb]">
              <div className="border-b border-[#d9e0dc] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Strategy comparison
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Results at a {percent(budget)} selection rate
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                  Coverage measures the share of poor households reached.
                  Precision measures the share of selected households that are
                  poor. Severe-poor coverage is reported as an additional
                  targeting-performance indicator.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d9e0dc] bg-[#f4f6f5] text-xs uppercase tracking-[0.12em] text-[#63716d]">
                      <th className="px-5 py-4 font-semibold">Strategy</th>
                      <th className="px-5 py-4 font-semibold">Selected</th>
                      <th className="px-5 py-4 font-semibold">Poor coverage</th>
                      <th className="px-5 py-4 font-semibold">Severe-poor</th>
                      <th className="px-5 py-4 font-semibold">Precision</th>
                      <th className="px-5 py-4 font-semibold">Exclusion</th>
                      <th className="px-5 py-4 font-semibold">Inclusion</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((result) => {
                      const isCoverageLeader =
                        result.strategy === coverageLeader?.strategy;

                      const isPrecisionLeader =
                        result.strategy === precisionLeader?.strategy;

                      return (
                        <tr
                          key={result.strategy}
                          className={`border-b border-[#e6ebe8] text-sm last:border-0 ${
                            isCoverageLeader ? "bg-[#f5fbfa]" : ""
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[#183f4a]">
                                {getStrategyLabel(result.strategy)}
                              </span>

                              {isCoverageLeader && (
                                <span className="border border-[#b8dcd7] bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#087f76]">
                                  Coverage leader
                                </span>
                              )}

                              {isPrecisionLeader && (
                                <span className="border border-[#d9e0dc] bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#63716d]">
                                  Precision leader
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 font-mono text-[#63716d]">
                            {number(result.households_selected)}
                          </td>

                          <td
                            className={`px-5 py-4 font-mono font-semibold ${
                              isCoverageLeader
                                ? "text-[#087f76]"
                                : "text-[#183f4a]"
                            }`}
                          >
                            {percent(result.coverage)}
                          </td>

                          <td className="px-5 py-4 font-mono text-[#087f76]">
                            {percent(result.severe_poor_coverage)}
                          </td>

                          <td
                            className={`px-5 py-4 font-mono font-semibold ${
                              isPrecisionLeader
                                ? "text-[#183f4a]"
                                : "text-[#63716d]"
                            }`}
                          >
                            {percent(result.precision)}
                          </td>

                          <td className="px-5 py-4 font-mono text-[#8d3d37]">
                            {percent(result.exclusion_error)}
                          </td>

                          <td className="px-5 py-4 font-mono text-[#93631e]">
                            {percent(result.inclusion_error)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Observed comparison
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Coverage vs precision by strategy
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Compare how much poor-household coverage each strategy
                  achieves against the concentration of poor households among
                  those selected.
                </p>
              </div>

              <div className="mt-6 h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid stroke="#e3e9e5" vertical={false} />

                    <XAxis
                      dataKey="strategy"
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      unit="%"
                      domain={[0, 100]}
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)}%`,
                        name === "coverage" ? "Poor coverage" : "Precision",
                      ]}
                    />

                    <Bar
                      dataKey="coverage"
                      fill="#087f76"
                      name="coverage"
                      radius={[3, 3, 0, 0]}
                    />

                    <Bar
                      dataKey="precision"
                      fill="#183f4a"
                      name="precision"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap gap-5 text-xs text-[#63716d]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#087f76]" />
                  Poor coverage
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-[#183f4a]" />
                  Precision
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Across scenarios
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  How the selection rate changes the outcome
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Logistic targeting remains the coverage leader across the
                  three tested selection rates. As more households are selected,
                  coverage increases while precision declines.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {scenarioTrend.map((scenario) => (
                    <div
                      key={scenario.rate}
                      className={`border p-4 ${
                        Math.abs(scenario.rate - budget) < 0.001
                          ? "border-[#087f76] bg-[#f2faf8]"
                          : "border-[#d9e0dc] bg-white"
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#63716d]">
                        Selection
                      </p>

                      <p className="mt-1 font-mono text-lg font-semibold text-[#183f4a]">
                        {percent(scenario.rate)}
                      </p>

                      <dl className="mt-4 space-y-2 text-xs">
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#63716d]">Coverage</dt>
                          <dd className="font-mono font-semibold text-[#087f76]">
                            {percent(scenario.logisticCoverage)}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-2">
                          <dt className="text-[#63716d]">Severe-poor</dt>
                          <dd className="font-mono font-semibold text-[#183f4a]">
                            {percent(scenario.logisticSeverePoor)}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-2">
                          <dt className="text-[#63716d]">Precision</dt>
                          <dd className="font-mono font-semibold text-[#183f4a]">
                            {percent(scenario.logisticPrecision)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Policy interpretation
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Coverage comes with a precision trade-off.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#63716d]">
                  Moving from 5% to 20% selection increases the number of
                  households targeted and substantially expands the share of
                  poor households reached.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="border border-[#d9e0dc] bg-white p-4">
                    <p className="text-xs text-[#63716d]">
                      Logistic coverage change
                    </p>
                    <p className="mt-1 font-mono text-xl font-semibold text-[#087f76]">
                      {coverageChange !== null
                        ? percentagePoints(coverageChange)
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-[#63716d]">
                      From 5% to 20% selection.
                    </p>
                  </div>

                  <div className="border border-[#d9e0dc] bg-white p-4">
                    <p className="text-xs text-[#63716d]">
                      Logistic precision change
                    </p>
                    <p className="mt-1 font-mono text-xl font-semibold text-[#8d3d37]">
                      {precisionChange !== null
                        ? percentagePoints(precisionChange)
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-[#63716d]">
                      From 5% to 20% selection.
                    </p>
                  </div>
                </div>
              </article>
            </section>
          </div>
        )}
        <p className="mt-6 text-xs leading-5 text-[#63716d]">
          Evaluation results describe observed performance on the current
          held-out test-set simulation. They are research estimates and do not
          establish individual eligibility or determine a social protection
          policy decision.
        </p>
      </main>
    </DashboardShell>
  );
}
