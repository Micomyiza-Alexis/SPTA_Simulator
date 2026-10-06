"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getDashboard,
  STRATEGY_KEYS,
  STRATEGY_LABELS as strategyLabels,
  type DashboardData,
  type StrategyResult,
  type TargetingRobustness,
} from "../../lib/api";
import {
  buildCrossScenarioInsight,
  buildTargetingInsight,
} from "../../lib/targetingInsights";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";

const strategyOrder: readonly string[] = STRATEGY_KEYS;

const strategyColors: Record<string, string> = {
  "Random Targeting": "#8a9691",
  "Geographic Targeting": "#c8862c",
  "Rule-Based Targeting": "#087f76",
  "Logistic Targeting": "#183f4a",
  "Random Forest Targeting": "#5b6f91",
};

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getResult(
  data: DashboardData | null,
  strategy: string,
  budget: number
): StrategyResult | undefined {
  return data?.results.find(
    (item) =>
      item.strategy === strategy &&
      Math.abs(item.budget - budget) < 0.001
  );
}

function getTargetingRobustness(
  data: DashboardData | null,
  strategy: string,
  budget: number
): TargetingRobustness | undefined {
  return data?.targeting_robustness.find(
    (item) =>
      item.strategy === strategy &&
      Math.abs(item.budget - budget) < 0.001
  );
}

function meanStd(mean: number, std: number) {
  return `${(mean * 100).toFixed(1)}% ± ${(std * 100).toFixed(1)}%`;
}

export default function SimulatorPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [budget, setBudget] = useState(0.1);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() =>
        setError(
          "The dashboard data could not be loaded. Make sure the FastAPI backend is running."
        )
      );
  }, []);

  const selectedResults = useMemo(() => {
    if (!data) return [];

    return strategyOrder
      .map((strategy) => getResult(data, strategy, budget))
      .filter((result): result is StrategyResult => Boolean(result));
  }, [data, budget]);

  const targetingInsight = useMemo(
    () => buildTargetingInsight(selectedResults),
    [selectedResults]
  );

  const hasPrecisionTradeoff =
    targetingInsight !== null &&
    targetingInsight.precisionLeader !==
      targetingInsight.coverageRecommendedStrategy;

  const crossScenarioInsight = useMemo(
    () => (data ? buildCrossScenarioInsight(data.results) : null),
    [data]
  );

  const comparisonData = selectedResults.map((result) => ({
    strategy: strategyLabels[result.strategy] ?? result.strategy,
    coverage: Number((result.coverage * 100).toFixed(1)),
    severePoorCoverage: Number(
      (result.severe_poor_coverage * 100).toFixed(1)
    ),
    precision: Number((result.precision * 100).toFixed(1)),
  }));

  const coverageByBudget = strategyOrder.map((strategy) => {
    const points = (data?.budgets ?? []).map((currentBudget) => {
      const result = getResult(data, strategy, currentBudget);

      return {
        budget: `${Math.round(currentBudget * 100)}%`,
        coverage: result
          ? Number((result.coverage * 100).toFixed(1))
          : null,
      };
    });

    return {
      strategy: strategyLabels[strategy] ?? strategy,
      points,
    };
  });

  const selectedLogistic = getResult(data, "Logistic Targeting", budget);

  const robustnessResults = useMemo(() => {
    if (!data) return [];

    return strategyOrder
      .map((strategy) => getTargetingRobustness(data, strategy, budget))
      .filter((result): result is TargetingRobustness => Boolean(result));
  }, [data, budget]);

  const modelRobustness = data?.model_robustness ?? [];

  return (
    <DashboardShell active="Simulator">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Decision support / Simulator"
          title="Explore targeting performance at different household selection rates."
          description="Select a household selection rate to examine how different targeting strategies perform against the same poverty reference. Results shown here come from the finalized SPTA simulation."
        />

        {error && (
          <div
            role="alert"
            className="mb-6 border-l-2 border-[#b8544c] bg-[#fff5f3] px-4 py-3 text-sm text-[#8d3d37]"
          >
            {error}
          </div>
        )}

        <section
          className="mb-7 border border-[#d9e0dc] bg-[#fbfcfb] p-6"
          aria-labelledby="selection-rate-title"
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                Selection constraint
              </p>

              <h2
                id="selection-rate-title"
                className="mt-2 text-xl font-semibold text-[#183f4a]"
              >
                Households that can be selected
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63716d]">
                The selection rate represents the share of test households
                available for selection. The simulator does not change the
                underlying models; it changes the selection constraint.
              </p>
            </div>

            <div
              className="flex shrink-0 gap-2"
              role="group"
              aria-label="Household selection rate"
            >
              {(data?.budgets ?? [0.05, 0.1, 0.2]).map((value) => {
                const active = Math.abs(value - budget) < 0.001;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBudget(value)}
                    className={`min-w-20 border px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-[#183f4a] bg-[#183f4a] text-white"
                        : "border-[#cfd8d4] bg-white text-[#63716d] hover:border-[#087f76] hover:text-[#183f4a]"
                    }`}
                  >
                    {Math.round(value * 100)}%
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {selectedResults.length > 0 && (
          <>
            <section
              className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Selected household selection rate summary"
            >
              <MetricCard
                label="Selection rate"
                value={`${Math.round(budget * 100)}%`}
                note="Share of test households selected"
                tone="#183f4a"
              />

              <MetricCard
                label="Households selected"
                value={number(selectedResults[0].households_selected)}
                note="Fixed selection count at this selection rate"
                tone="#087f76"
              />

              <MetricCard
                label="Highest observed poor coverage"
                value={percent(
                  Math.max(
                    ...selectedResults.map((result) => result.coverage)
                  )
                )}
                note="Across displayed strategies"
                tone="#c8862c"
              />

              <MetricCard
                label="Logistic poor coverage"
                value={
                  selectedLogistic
                    ? percent(selectedLogistic.coverage)
                    : "—"
                }
                note="Reference model result"
                tone="#5b6f91"
              />
            </section>

            {targetingInsight && (
              <section className="mb-7 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-2xl border border-[#d9e4e1] bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087f76]">
                        Coverage leader
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-[#183f4a]">
                        {strategyLabels[
                          targetingInsight.coverageRecommendedStrategy
                        ] ?? targetingInsight.coverageRecommendedStrategy}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61706c]">
                        At a {Math.round(budget * 100)}% household selection
                        rate, this strategy achieves the highest observed
                        coverage of poor households among the evaluated
                        approaches.
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl bg-[#e6f4f1] px-3 py-2 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#087f76]">
                        Selection rate
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#183f4a]">
                        {Math.round(budget * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#f6f8f7] p-4">
                      <p className="text-xs font-medium text-[#61706c]">
                        Poor coverage
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#183f4a]">
                        {percent(targetingInsight.highestCoverage)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f6f8f7] p-4">
                      <p className="text-xs font-medium text-[#61706c]">
                        Severe-poor coverage
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#183f4a]">
                        {percent(
                          targetingInsight.highestSeverePoorCoverage
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f6f8f7] p-4">
                      <p className="text-xs font-medium text-[#61706c]">
                        Precision
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#183f4a]">
                        {percent(
                          selectedResults.find(
                            (result) =>
                              result.strategy ===
                              targetingInsight.coverageRecommendedStrategy
                          )?.precision ?? 0
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-[#e5ebe9] bg-[#fbfcfb] p-4">
                    <p className="text-sm leading-6 text-[#4f5d59]">
                      The recommended strategy reaches{" "}
                      <strong className="text-[#183f4a]">
                        {targetingInsight.coverageMultiplierVsRandom
                          ? `${targetingInsight.coverageMultiplierVsRandom.toFixed(
                              2
                            )}×`
                          : "more"}
                      </strong>{" "}
                      the poor-household coverage of the random baseline at
                      this selection rate.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d9e4e1] bg-[#183f4a] p-6 text-white shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9fd6cd]">
                    Why this strategy?
                  </p>

                  <h3 className="mt-3 text-lg font-bold">
                    Coverage-first interpretation
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#dce8e5]">
                    {strategyLabels[
                      targetingInsight.coverageRecommendedStrategy
                    ] ?? targetingInsight.coverageRecommendedStrategy}{" "}
                    leads the evaluated strategies on poor-household coverage
                    at the selected rate.
                    {hasPrecisionTradeoff && (
                      <>
                        {" "}
                        {strategyLabels[targetingInsight.precisionLeader] ??
                          targetingInsight.precisionLeader}{" "}
                        has slightly higher precision, creating a
                        coverage-versus-precision trade-off.
                      </>
                    )}
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-[#b9cbc7]">
                        Coverage leader
                      </span>

                      <span className="font-semibold">
                        {strategyLabels[targetingInsight.coverageLeader] ??
                          targetingInsight.coverageLeader}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-[#b9cbc7]">
                        Severe-poor leader
                      </span>

                      <span className="font-semibold">
                        {strategyLabels[
                          targetingInsight.severePoorLeader
                        ] ?? targetingInsight.severePoorLeader}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#b9cbc7]">
                        Most frequent precision leader
                      </span>

                      <span className="font-semibold">
                        {strategyLabels[targetingInsight.precisionLeader] ??
                          targetingInsight.precisionLeader}
                      </span>
                    </div>

                    {hasPrecisionTradeoff && (
                      <div className="mt-4 rounded-xl border border-[#ffffff1a] bg-white/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9fd6cd]">
                          Decision trade-off
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#dce8e5]">
                          Choose{" "}
                          <strong>
                            {strategyLabels[
                              targetingInsight.coverageRecommendedStrategy
                            ] ??
                              targetingInsight.coverageRecommendedStrategy}
                          </strong>{" "}
                          when reaching more poor households is the priority.
                          Choose{" "}
                          <strong>
                            {strategyLabels[
                              targetingInsight.precisionLeader
                            ] ?? targetingInsight.precisionLeader}
                          </strong>{" "}
                          when precision is the stronger priority.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="mb-7 grid gap-5 lg:grid-cols-2">
              <ChartCard
                title="Poor household coverage"
                description={`Share of poor households reached at a ${Math.round(
                  budget * 100
                )}% household selection rate.`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke="#e3e9e5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="strategy"
                      tick={{
                        fill: "#63716d",
                        fontSize: 10,
                      }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={55}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Poor coverage",
                      ]}
                    />

                    <Bar
                      dataKey="coverage"
                      name="Poor coverage"
                      fill="#087f76"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Severe-poor household coverage"
                description="Share of severe-poor households reached at the selected rate."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke="#e3e9e5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="strategy"
                      tick={{
                        fill: "#63716d",
                        fontSize: 10,
                      }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={55}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Severe-poor coverage",
                      ]}
                    />

                    <Bar
                      dataKey="severePoorCoverage"
                      name="Severe-poor coverage"
                      fill="#c8862c"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </section>

            <section className="mb-7 border border-[#d9e0dc] bg-[#fbfcfb] p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-[#183f4a]">
                    Coverage across selection rates
                  </h2>

                  <p className="mt-1 text-sm text-[#63716d]">
                    Observe how poor-household coverage changes as the
                    household selection rate increases.
                  </p>
                </div>

                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#63716d]">
                  Test-set results
                </span>
              </div>

              <div className="mt-6 h-[330px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      stroke="#e3e9e5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="budget"
                      type="category"
                      allowDuplicatedCategory={false}
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      tick={{
                        fill: "#63716d",
                        fontSize: 11,
                      }}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "Poor coverage",
                      ]}
                    />

                    <Legend
                      wrapperStyle={{
                        paddingTop: 10,
                        fontSize: 11,
                      }}
                    />

                    {coverageByBudget.map((series) => (
                      <Line
                        key={series.strategy}
                        data={series.points}
                        type="monotone"
                        dataKey="coverage"
                        name={series.strategy}
                        stroke={
                          strategyColors[
                            strategyOrder.find(
                              (key) =>
                                strategyLabels[key] === series.strategy
                            ) ?? "Random Targeting"
                          ]
                        }
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {crossScenarioInsight && (
              <section
                className="mb-7 overflow-hidden rounded-2xl border border-[#d9e4e1] bg-white shadow-sm"
                aria-labelledby="cross-scenario-title"
              >
                <div className="border-b border-[#e3e9e5] bg-[#f7faf9] px-6 py-5">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087f76]">
                        Cross-scenario intelligence
                      </p>

                      <h2
                        id="cross-scenario-title"
                        className="mt-2 text-xl font-bold text-[#183f4a]"
                      >
                        What changes as the selection rate increases?
                      </h2>

                      <p className="mt-1 max-w-3xl text-sm leading-6 text-[#63716d]">
                        This view compares the same targeting strategies across
                        all tested household selection rates rather than
                        evaluating only the currently selected scenario.
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl border border-[#d9e4e1] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#63716d]">
                        Coverage leader
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#183f4a]">
                        {strategyLabels[crossScenarioInsight.coverageLeader] ??
                          crossScenarioInsight.coverageLeader}
                      </p>

                      <p className="mt-1 text-xs text-[#63716d]">
                        Leads in{" "}
                        {crossScenarioInsight.coverageLeadershipCount} of{" "}
                        {data?.budgets.length ?? 0} tested rates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <InsightCard
                      label="Consistent coverage leader"
                      value={
                        strategyLabels[crossScenarioInsight.coverageLeader] ??
                        crossScenarioInsight.coverageLeader
                      }
                      note={`Leads poor-household coverage in ${crossScenarioInsight.coverageLeadershipCount} of ${
                        data?.budgets.length ?? 0
                      } tested selection rates.`}
                      tone="#183f4a"
                    />

                    <InsightCard
                      label="Severe-poor leader"
                      value={
                        strategyLabels[
                          crossScenarioInsight.severePoorLeader
                        ] ?? crossScenarioInsight.severePoorLeader
                      }
                      note={`Leads severe-poor coverage in ${crossScenarioInsight.severePoorLeadershipCount} of ${
                        data?.budgets.length ?? 0
                      } tested rates.`}
                      tone="#c8862c"
                    />

                    <InsightCard
                      label="Most frequent precision leader"
                      value={
                        strategyLabels[
                          crossScenarioInsight.precisionLeader
                        ] ?? crossScenarioInsight.precisionLeader
                      }
                      note={`Highest precision across ${
                        crossScenarioInsight.precisionLeadershipCount
                      } of ${data?.budgets.length ?? 0} tested rates.`}
                      tone="#5b6f91"
                    />

                    <InsightCard
                      label="Coverage gain"
                      value={`+${(
                        crossScenarioInsight.coverageChange * 100
                      ).toFixed(1)} pp`}
                      note={`For the coverage-leading strategy from ${Math.round(
                        crossScenarioInsight.lowestBudget * 100
                      )}% to ${Math.round(
                        crossScenarioInsight.highestBudget * 100
                      )}% selection.`}
                      tone="#087f76"
                    />
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#e3e9e5] bg-[#fbfcfb] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087f76]">
                        Coverage effect
                      </p>

                      <div className="mt-3 flex items-end gap-3">
                        <span className="text-3xl font-bold tracking-[-0.04em] text-[#183f4a]">
                          {percent(
                            crossScenarioInsight.coverageAtLowestBudget
                          )}
                        </span>

                        <span className="pb-1 text-lg text-[#9aa7a3]">
                          →
                        </span>

                        <span className="text-3xl font-bold tracking-[-0.04em] text-[#087f76]">
                          {percent(
                            crossScenarioInsight.coverageAtHighestBudget
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#63716d]">
                        Poor-household coverage rises by{" "}
                        <strong className="text-[#183f4a]">
                          {(
                            crossScenarioInsight.coverageChange * 100
                          ).toFixed(1)}{" "}
                          percentage points
                        </strong>{" "}
                        when the selection rate increases from{" "}
                        {Math.round(
                          crossScenarioInsight.lowestBudget * 100
                        )}
                        % to{" "}
                        {Math.round(
                          crossScenarioInsight.highestBudget * 100
                        )}
                        %.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#e3e9e5] bg-[#fbfcfb] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#c8862c]">
                        Precision trade-off
                      </p>

                      <div className="mt-3 flex items-end gap-3">
                        <span className="text-3xl font-bold tracking-[-0.04em] text-[#183f4a]">
                          {percent(
                            crossScenarioInsight.precisionAtLowestBudget
                          )}
                        </span>

                        <span className="pb-1 text-lg text-[#9aa7a3]">
                          →
                        </span>

                        <span className="text-3xl font-bold tracking-[-0.04em] text-[#c8862c]">
                          {percent(
                            crossScenarioInsight.precisionAtHighestBudget
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#63716d]">
                        Precision changes by{" "}
                        <strong className="text-[#183f4a]">
                          {crossScenarioInsight.precisionChange >= 0
                            ? "+"
                            : ""}
                          {(
                            crossScenarioInsight.precisionChange * 100
                          ).toFixed(1)}{" "}
                          percentage points
                        </strong>{" "}
                        for the coverage-leading strategy as the selection
                        rate increases.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-[#d9e4e1] bg-[#183f4a] p-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9fd6cd]">
                      Policy interpretation
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#dce8e5]">
                      {strategyLabels[crossScenarioInsight.coverageLeader] ??
                        crossScenarioInsight.coverageLeader}{" "}
                      is the most consistent choice when the policy objective
                      is to maximize poor-household coverage: it leads across{" "}
                      {crossScenarioInsight.coverageLeadershipCount} of{" "}
                      {data?.budgets.length ?? 0} tested selection rates.
                      Increasing the selection rate from{" "}
                      {Math.round(
                        crossScenarioInsight.lowestBudget * 100
                      )}
                      % to{" "}
                      {Math.round(
                        crossScenarioInsight.highestBudget * 100
                      )}
                      % substantially increases coverage, but precision for
                      the coverage-leading strategy falls from{" "}
                      {percent(
                        crossScenarioInsight.precisionAtLowestBudget
                      )}{" "}
                      to{" "}
                      {percent(
                        crossScenarioInsight.precisionAtHighestBudget
                      )}
                      . This is a coverage-versus-precision trade-off rather
                      than a change in the underlying model.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="mb-7 border border-[#d9e0dc] bg-[#fbfcfb] p-6">
              <div>
                <h2 className="text-lg font-semibold text-[#183f4a]">
                  Strategy results at {Math.round(budget * 100)}%
                </h2>

                <p className="mt-1 text-sm text-[#63716d]">
                  Metrics are computed against the poverty reference in the
                  test set.
                </p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d9e0dc] text-xs uppercase tracking-[0.08em] text-[#63716d]">
                      <th className="px-3 py-3 font-semibold">
                        Strategy
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Selected
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Poor coverage
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Severe poor
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Precision
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Inclusion error
                      </th>
                      <th className="px-3 py-3 font-semibold">
                        Exclusion error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedResults.map((result) => (
                      <tr
                        key={result.strategy}
                        className="border-b border-[#edf0ee] last:border-0"
                      >
                        <td className="px-3 py-4 font-semibold text-[#183f4a]">
                          {strategyLabels[result.strategy] ??
                            result.strategy}
                        </td>

                        <td className="px-3 py-4 text-[#63716d]">
                          {number(result.households_selected)}
                        </td>

                        <td className="px-3 py-4 font-semibold text-[#087f76]">
                          {percent(result.coverage)}
                        </td>

                        <td className="px-3 py-4 text-[#63716d]">
                          {percent(result.severe_poor_coverage)}
                        </td>

                        <td className="px-3 py-4 text-[#63716d]">
                          {percent(result.precision)}
                        </td>

                        <td className="px-3 py-4 text-[#63716d]">
                          {percent(result.inclusion_error)}
                        </td>

                        <td className="px-3 py-4 text-[#63716d]">
                          {percent(result.exclusion_error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {robustnessResults.length > 0 && (
              <section
                className="mb-7 border border-[#d9e0dc] bg-[#fbfcfb] p-6"
                aria-labelledby="targeting-robustness-title"
              >
                <div>
                  <h2
                    id="targeting-robustness-title"
                    className="text-lg font-semibold text-[#183f4a]"
                  >
                    Targeting robustness at {Math.round(budget * 100)}%
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#63716d]">
                    Each figure is the mean ± standard deviation across{" "}
                    {robustnessResults[0]?.splits ?? 5} repeated stratified
                    train/test splits, showing how much targeting performance
                    varies with the sample rather than a single split.
                  </p>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#d9e0dc] text-xs uppercase tracking-[0.08em] text-[#63716d]">
                        <th className="px-3 py-3 font-semibold">
                          Strategy
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Poor coverage
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Severe poor
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Precision
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Inclusion error
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Exclusion error
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {robustnessResults.map((result) => (
                        <tr
                          key={result.strategy}
                          className="border-b border-[#edf0ee] last:border-0"
                        >
                          <td className="px-3 py-4 font-semibold text-[#183f4a]">
                            {strategyLabels[result.strategy] ??
                              result.strategy}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.coverage_mean,
                              result.coverage_std
                            )}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.severe_poor_coverage_mean,
                              result.severe_poor_coverage_std
                            )}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.precision_mean,
                              result.precision_std
                            )}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.inclusion_error_mean,
                              result.inclusion_error_std
                            )}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.exclusion_error_mean,
                              result.exclusion_error_std
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {modelRobustness.length > 0 && (
              <section
                className="mb-7 border border-[#d9e0dc] bg-[#fbfcfb] p-6"
                aria-labelledby="model-robustness-title"
              >
                <div>
                  <h2
                    id="model-robustness-title"
                    className="text-lg font-semibold text-[#183f4a]"
                  >
                    Model robustness
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#63716d]">
                    Discrimination performance of the underlying models across
                    repeated splits. This does not depend on the selection rate
                    above.
                  </p>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#d9e0dc] text-xs uppercase tracking-[0.08em] text-[#63716d]">
                        <th className="px-3 py-3 font-semibold">
                          Model
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          ROC-AUC
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          PR-AUC
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {modelRobustness.map((result) => (
                        <tr
                          key={result.strategy}
                          className="border-b border-[#edf0ee] last:border-0"
                        >
                          <td className="px-3 py-4 font-semibold text-[#183f4a]">
                            {strategyLabels[result.strategy] ??
                              result.strategy}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.roc_auc_mean,
                              result.roc_auc_std
                            )}
                          </td>

                          <td className="px-3 py-4 text-[#63716d]">
                            {meanStd(
                              result.pr_auc_mean,
                              result.pr_auc_std
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <section className="border border-[#d9e0dc] bg-[#f8faf9] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
            Interpretation note
          </p>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#63716d]">
            These results are empirical test-set estimates from the SPTA
            research prototype. Coverage, precision, inclusion error, and
            exclusion error describe different aspects of targeting
            performance; changing the selection rate changes the number of
            households available for selection. The results should therefore
            be interpreted together rather than as a single decision rule.
          </p>
        </section>
      </main>
    </DashboardShell>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5 shadow-[0_2px_8px_rgba(24,35,33,0.03)]">
      <div
        className="mb-7 h-1 w-10"
        style={{ backgroundColor: tone }}
      />

      <p className="text-sm font-medium text-[#63716d]">{label}</p>

      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#183f4a]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#63716d]">{note}</p>
    </article>
  );
}

function InsightCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-[#e3e9e5] bg-[#fbfcfb] p-4">
      <div
        className="mb-4 h-1 w-8 rounded-full"
        style={{ backgroundColor: tone }}
      />

      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#63716d]">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-[#183f4a]">{value}</p>

      <p className="mt-2 text-xs leading-5 text-[#63716d]">{note}</p>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
      <h2 className="text-lg font-semibold text-[#183f4a]">{title}</h2>

      <p className="mt-1 text-sm text-[#63716d]">{description}</p>

      <div className="mt-5 h-[300px] w-full">{children}</div>
    </div>
  );
}
