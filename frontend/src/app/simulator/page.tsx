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
  type DashboardData,
  type StrategyResult,
} from "../../lib/api";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";

const strategyLabels: Record<string, string> = {
  Random: "Random baseline",
  Geographic: "Geographic",
  "Rule-Based": "Rule-based",
  Logistic: "Logistic",
  "Random Forest": "Random Forest",
};

const strategyOrder = [
  "Random",
  "Geographic",
  "Rule-Based",
  "Logistic",
  "Random Forest",
];

const strategyColors: Record<string, string> = {
  Random: "#8a9691",
  Geographic: "#c8862c",
  "Rule-Based": "#087f76",
  Logistic: "#183f4a",
  "Random Forest": "#5b6f91",
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

  const selectedLogistic = getResult(data, "Logistic", budget);

  return (
    <DashboardShell active="Simulator">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Decision support / Simulator"
          title="Explore targeting performance under a constrained budget."
          description="Select a budget share to examine how different targeting strategies perform against the same poverty reference. Results shown here come from the finalized SPTA simulation."
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
          aria-labelledby="budget-title"
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                Resource constraint
              </p>
              <h2
                id="budget-title"
                className="mt-2 text-xl font-semibold text-[#183f4a]"
              >
                Households that can be selected
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63716d]">
                The budget represents the share of test households available
                for selection. The simulator does not change the underlying
                models; it changes the selection constraint.
              </p>
            </div>

            <div
              className="flex shrink-0 gap-2"
              role="group"
              aria-label="Budget"
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
              aria-label="Selected budget summary"
            >
              <MetricCard
                label="Budget"
                value={`${Math.round(budget * 100)}%`}
                note="Share of test households selected"
                tone="#183f4a"
              />
              <MetricCard
                label="Households selected"
                value={number(selectedResults[0].households_selected)}
                note="Fixed selection count at this budget"
                tone="#087f76"
              />
              <MetricCard
                label="Highest observed poor coverage"
                value={percent(
                  Math.max(
                    ...selectedResults.map(
                      (result) => result.coverage
                    )
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

            <section className="mb-7 grid gap-5 lg:grid-cols-2">
              <ChartCard
                title="Poor household coverage"
                description={`Share of poor households reached at a ${Math.round(
                  budget * 100
                )}% selection budget.`}
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
                description="Share of severe-poor households reached at the selected budget."
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
                    Coverage across budgets
                  </h2>
                  <p className="mt-1 text-sm text-[#63716d]">
                    Observe how poor-household coverage changes as the
                    selection budget increases.
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
                    <Legend />
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
                                strategyLabels[key] ===
                                series.strategy
                            ) ?? "Random"
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
            performance; changing the budget changes the number of households
            available for selection. The results should therefore be
            interpreted together rather than as a single decision rule.
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
