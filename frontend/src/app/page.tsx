"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "../components/DashboardShell";
import {
  FALLBACK_DASHBOARD,
  getDashboard,
  STRATEGY_KEYS,
  STRATEGY_LABELS,
} from "../lib/api";
import type { DashboardData, StrategyResult } from "../lib/api";

const strategyOrder: readonly string[] = STRATEGY_KEYS;

const strategyColors: Record<string, string> = {
  "Random Targeting": "#94a3b8",
  "Geographic Targeting": "#f4b942",
  "Rule-Based Targeting": "#2dd4bf",
  "Logistic Targeting": "#67e8f9",
  "Random Forest Targeting": "#34d399",
};

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

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b2428] px-3 py-2.5 text-white shadow-xl">
      <p className="mb-1.5 text-[11px] font-semibold text-[#9ee0d4]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-xs text-[#d2e1de]">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="ml-auto font-mono font-semibold text-white">
            {Number(entry.value).toFixed(1)}%
          </span>
        </p>
      ))}
    </div>
  );
}

function RingStat({
  label,
  value,
  detail,
  ratio,
}: {
  label: string;
  value: string;
  detail: string;
  ratio: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));
  const offset = circumference - clamped * circumference;

  return (
    <article className="flex items-center gap-4 rounded-3xl bg-white/10 px-4 py-4 ring-1 ring-white/10">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90" aria-hidden="true">
        <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9ee0d4]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-xs leading-5 text-[#b7cdc8]">{detail}</p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData>(FALLBACK_DASHBOARD);
  const [budget, setBudget] = useState(0.1);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    getDashboard()
      .then((payload) => {
        setData(payload);
        setUsingFallback(false);
      })
      .catch(() => {
        setData(FALLBACK_DASHBOARD);
        setUsingFallback(true);
      });
  }, []);

  const selectedResults = useMemo(() => {
    return strategyOrder
      .map((strategy) => getResult(data.results, strategy, budget))
      .filter((result): result is StrategyResult => Boolean(result));
  }, [data, budget]);

  const rankedCoverage = useMemo(
    () =>
      [...selectedResults]
        .sort((a, b) => b.coverage - a.coverage)
        .map((result) => ({
          ...result,
          label: STRATEGY_LABELS[result.strategy] ?? result.strategy,
          coveragePct: result.coverage * 100,
        })),
    [selectedResults],
  );

  const comparisonData = useMemo(
    () =>
      selectedResults.map((result) => ({
        strategy: STRATEGY_LABELS[result.strategy] ?? result.strategy,
        coverage: Number((result.coverage * 100).toFixed(1)),
        severePoorCoverage: Number((result.severe_poor_coverage * 100).toFixed(1)),
        precision: Number((result.precision * 100).toFixed(1)),
      })),
    [selectedResults],
  );

  const radarData = useMemo(() => {
    const metrics = [
      { key: "coverage", label: "Poor coverage" },
      { key: "severe_poor_coverage", label: "Severe-poor" },
      { key: "precision", label: "Precision" },
    ] as const;

    return metrics.map((metric) => {
      const point: Record<string, string | number> = { metric: metric.label };
      for (const result of selectedResults) {
        const label = STRATEGY_LABELS[result.strategy] ?? result.strategy;
        point[label] = Number((result[metric.key] * 100).toFixed(1));
      }
      return point;
    });
  }, [selectedResults]);

  const coverageByBudget = useMemo(() => {
    return (data.budgets ?? []).map((currentBudget) => {
      const row: Record<string, string | number> = {
        budget: `${Math.round(currentBudget * 100)}%`,
      };

      for (const strategy of strategyOrder) {
        const result = getResult(data.results, strategy, currentBudget);
        const label = STRATEGY_LABELS[strategy] ?? strategy;
        row[label] = result ? Number((result.coverage * 100).toFixed(1)) : 0;
      }

      return row;
    });
  }, [data]);

  const summary = useMemo(() => {
    if (selectedResults.length === 0) return null;
    const selected = selectedResults[0];
    const highestCoverage = selectedResults.reduce((max, result) =>
      result.coverage > max.coverage ? result : max,
    );

    return {
      households: selected.households_selected,
      observedCoverage: highestCoverage.coverage,
      severeCoverage: selectedResults.reduce(
        (max, result) => Math.max(max, result.severe_poor_coverage),
        0,
      ),
      strategies: selectedResults.length,
      leadingStrategy: STRATEGY_LABELS[highestCoverage.strategy] ?? highestCoverage.strategy,
    };
  }, [selectedResults]);

  const maxCoverage = rankedCoverage[0]?.coveragePct ?? 1;

  return (
    <DashboardShell active="Overview">
      <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">
        <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#041c21] via-[#0f3a42] to-[#0b8a80] p-6 text-white shadow-[0_30px_80px_-40px_rgba(4,28,33,0.85)] sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9ee0d4]">
                NISR Hackathon · Live command center
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Social protection targeting, scored in one view.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#d7ece8] sm:text-base">
                Compare random, geographic, rule-based and machine-learning strategies under a fixed household budget — coverage, precision and targeting error in the same dashboard.
              </p>
              {usingFallback && (
                <p className="mt-4 inline-flex rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-300/30">
                  Preview data · start FastAPI on port 8000 for live results
                </p>
              )}
            </div>

            <div className="w-full rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 xl:max-w-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9ee0d4]">
                Evaluation budget
              </p>
              <p className="mt-1 text-sm text-[#d7ece8]">Share of households that can be selected.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[0.05, 0.1, 0.2].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBudget(value)}
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                      budget === value
                        ? "bg-white text-[#0f3a42] shadow-lg"
                        : "bg-white/5 text-white hover:bg-white/15"
                    }`}
                  >
                    {percent(value)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {summary && (
            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <RingStat
                label="Households selected"
                value={number(summary.households)}
                detail={`At the ${percent(budget)} budget`}
                ratio={budget / 0.2}
              />
              <RingStat
                label="Best poor coverage"
                value={percent(summary.observedCoverage)}
                detail={summary.leadingStrategy}
                ratio={summary.observedCoverage}
              />
              <RingStat
                label="Severe-poor coverage"
                value={percent(summary.severeCoverage)}
                detail="Highest observed at this budget"
                ratio={summary.severeCoverage}
              />
              <RingStat
                label="Strategies in play"
                value={number(summary.strategies)}
                detail="Baseline through Random Forest"
                ratio={summary.strategies / 5}
              />
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-5">
          <article className="rounded-[28px] border border-[#d7e2de] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,58,66,0.45)] xl:col-span-3">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0b8a80]">Coverage race</p>
                <h2 className="mt-1 text-xl font-semibold text-[#0f3a42]">Who reaches poor households?</h2>
              </div>
              <span className="rounded-full bg-[#e8f6f3] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#17675e]">
                {percent(budget)} budget
              </span>
            </div>
            <div className="space-y-4">
              {rankedCoverage.map((result, index) => (
                <div key={result.strategy}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-[#0f3a42]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f3a42] text-[11px] text-white">
                        {index + 1}
                      </span>
                      {result.label}
                    </span>
                    <span className="font-mono font-semibold text-[#0b8a80]">
                      {percent(result.coverage)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#eef4f2]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(8, (result.coveragePct / maxCoverage) * 100)}%`,
                        background: strategyColors[result.strategy],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#d7e2de] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,58,66,0.45)] xl:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0b8a80]">Multi-metric radar</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0f3a42]">Coverage vs precision</h2>
            <div className="mt-2 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="#d7e2de" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#5c6c68", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  {strategyOrder.map((strategy) => {
                    const label = STRATEGY_LABELS[strategy] ?? strategy;
                    return (
                      <Radar
                        key={strategy}
                        name={label}
                        dataKey={label}
                        stroke={strategyColors[strategy]}
                        fill={strategyColors[strategy]}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#d7e2de] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,58,66,0.45)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0b8a80]">Strategy comparison</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0f3a42]">Performance at {percent(budget)}</h2>
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }} barGap={3}>
                  <CartesianGrid stroke="#e8eeec" vertical={false} />
                  <XAxis dataKey="strategy" tick={{ fill: "#5c6c68", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#5c6c68", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="coverage" name="Poor coverage" fill="#0b8a80" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="severePoorCoverage" name="Severe-poor" fill="#c8862c" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="precision" name="Precision" fill="#5b6f91" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-[28px] border border-[#d7e2de] bg-white p-6 shadow-[0_18px_40px_-28px_rgba(15,58,66,0.45)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0b8a80]">Budget sensitivity</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0f3a42]">Coverage as the budget grows</h2>
            <div className="mt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coverageByBudget} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                  <CartesianGrid stroke="#e8eeec" vertical={false} />
                  <XAxis dataKey="budget" tick={{ fill: "#5c6c68", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#5c6c68", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  {strategyOrder.map((strategy) => {
                    const label = STRATEGY_LABELS[strategy] ?? strategy;
                    return (
                      <Line
                        key={strategy}
                        type="monotone"
                        dataKey={label}
                        name={label}
                        stroke={strategyColors[strategy]}
                        strokeWidth={2.8}
                        dot={{ r: 4, strokeWidth: 0 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-[#d7e2de] bg-white shadow-[0_18px_40px_-28px_rgba(15,58,66,0.45)]">
          <div className="flex flex-col gap-3 border-b border-[#e8eeec] p-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0b8a80]">Scoreboard</p>
              <h2 className="mt-1 text-xl font-semibold text-[#0f3a42]">Strategy table at {percent(budget)}</h2>
            </div>
            <Link
              href="/simulator"
              className="inline-flex items-center justify-center rounded-full bg-[#0f3a42] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17675e]"
            >
              Open simulator
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-[#f4f8f7] text-xs uppercase tracking-[0.12em] text-[#5c6c68]">
                  <th className="px-5 py-4 font-semibold">Strategy</th>
                  <th className="px-5 py-4 font-semibold">Poor coverage</th>
                  <th className="px-5 py-4 font-semibold">Severe-poor</th>
                  <th className="px-5 py-4 font-semibold">Precision</th>
                  <th className="px-5 py-4 font-semibold">Exclusion error</th>
                </tr>
              </thead>
              <tbody>
                {rankedCoverage.map((result) => (
                  <tr key={result.strategy} className="border-t border-[#e8eeec] text-sm">
                    <td className="px-5 py-4 font-semibold text-[#0f3a42]">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: strategyColors[result.strategy] }} />
                      {result.label}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-14 font-mono text-[#0b8a80]">{percent(result.coverage)}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef4f2]">
                          <span
                            className="block h-full rounded-full bg-[#0b8a80]"
                            style={{ width: `${result.coverage * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[#0f3a42]">{percent(result.severe_poor_coverage)}</td>
                    <td className="px-5 py-4 font-mono text-[#0f3a42]">{percent(result.precision)}</td>
                    <td className="px-5 py-4 font-mono text-[#8d3d37]">{percent(result.exclusion_error)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-xs leading-5 text-[#5c6c68]">
          Evaluation results describe observed performance on the current test-set simulation. They do not establish individual eligibility or determine a social protection policy decision.
        </p>
      </main>
    </DashboardShell>
  );
}
