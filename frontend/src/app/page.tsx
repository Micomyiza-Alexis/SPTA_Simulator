"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell, PageIntro } from "../components/DashboardShell";
import { getDashboard, STRATEGY_KEYS, STRATEGY_LABELS } from "../lib/api";
import type { DashboardData, StrategyResult } from "../lib/api";

const strategyOrder: readonly string[] = STRATEGY_KEYS;

const scenarioBudgets = [0.05, 0.1, 0.2];

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
function getModelRobustness(
  models: DashboardData["model_robustness"],
  strategy: string,
) {
  return models.find((model) => model.strategy === strategy);
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

function FindingCard({
  number: findingNumber,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#087f76]">
          {findingNumber}
        </span>
        <span className="h-2 w-2 rounded-full bg-[#087f76]" />
      </div>

      <h3 className="mt-5 text-lg font-semibold leading-6 text-[#183f4a]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#63716d]">{description}</p>
    </article>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard data.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const overview = useMemo(() => {
    if (!data) return null;

    const resultsAt20 = strategyOrder
      .map((strategy) => getResult(data.results, strategy, 0.2))
      .filter((result): result is StrategyResult => Boolean(result));

    const logistic20 = getResult(data.results, "Logistic Targeting", 0.2);

    const rf20 = getResult(data.results, "Random Forest Targeting", 0.2);

    const logistic5 = getResult(data.results, "Logistic Targeting", 0.05);

    const logistic10 = getResult(data.results, "Logistic Targeting", 0.1);

    const random20 = getResult(data.results, "Random Targeting", 0.2);

    const coverageLeader = resultsAt20.reduce<StrategyResult | null>(
      (leader, result) =>
        !leader || result.coverage > leader.coverage ? result : leader,
      null,
    );

    const severePoorLeader = resultsAt20.reduce<StrategyResult | null>(
      (leader, result) =>
        !leader || result.severe_poor_coverage > leader.severe_poor_coverage
          ? result
          : leader,
      null,
    );

    const precisionLeader = resultsAt20.reduce<StrategyResult | null>(
      (leader, result) =>
        !leader || result.precision > leader.precision ? result : leader,
      null,
    );

    const logisticCoverageGain =
      logistic20 && random20 ? logistic20.coverage - random20.coverage : null;

    const coverageChange =
      logistic5 && logistic20 ? logistic20.coverage - logistic5.coverage : null;

    const precisionChange =
      logistic5 && logistic20
        ? logistic20.precision - logistic5.precision
        : null;

    return {
      resultsAt20,
      logistic20,
      rf20,
      logistic5,
      logistic10,
      random20,
      coverageLeader,
      severePoorLeader,
      precisionLeader,
      logisticCoverageGain,
      coverageChange,
      precisionChange,
    };
  }, [data]);

  return (
    <DashboardShell active="Overview">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="NISR Hackathon / SPTA Simulator"
          title="Social Protection Targeting Accuracy Simulator"
          description="Evidence-driven comparison of household targeting strategies under different selection constraints."
        />

        {isLoading && (
          <section className="mt-8 border border-[#d9e0dc] bg-[#fbfcfb] p-8">
            <p className="text-sm text-[#63716d]">
              Loading research results...
            </p>
          </section>
        )}

        {error && (
          <section className="mt-8 border border-[#e8b6b0] bg-[#fff5f3] p-6">
            <h2 className="font-semibold text-[#8d3d37]">
              Dashboard data unavailable
            </h2>

            <p className="mt-2 text-sm text-[#8d3d37]">{error}</p>

            <p className="mt-3 text-xs text-[#63716d]">
              Make sure the FastAPI backend is running on port 8000.
            </p>
          </section>
        )}

        {data && overview && !error && (
          <>
            {/* Executive finding */}
            <section className="mt-8 border border-[#183f4a] bg-[#183f4a] p-7 text-white lg:p-9">
              <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9ed8d0]">
                    Executive finding
                  </p>

                  <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                    Logistic targeting provides the strongest poor-household
                    coverage across all tested selection rates.
                  </h2>

                  <p className="mt-5 max-w-3xl text-sm leading-6 text-[#d5e3e1]">
                    At the 20% selection rate, logistic targeting covers{" "}
                    <strong className="text-white">
                      {overview.logistic20
                        ? percent(overview.logistic20.coverage)
                        : "—"}
                    </strong>{" "}
                    of poor households and{" "}
                    <strong className="text-white">
                      {overview.logistic20
                        ? percent(overview.logistic20.severe_poor_coverage)
                        : "—"}
                    </strong>{" "}
                    of severe-poor households. Random Forest achieves slightly
                    higher precision at this selection rate, highlighting a
                    clear coverage-versus-precision trade-off.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/simulator"
                      className="inline-flex items-center border border-[#9ed8d0] bg-[#9ed8d0] px-5 py-2.5 text-sm font-semibold text-[#183f4a] hover:bg-white"
                    >
                      Explore simulator
                    </Link>

                    <Link
                      href="/scenarios"
                      className="inline-flex items-center border border-[#6e9290] px-5 py-2.5 text-sm font-semibold text-white hover:border-white"
                    >
                      Compare scenarios
                    </Link>
                  </div>
                </div>

                <div className="border border-[#42636a] bg-[#204b56] p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9ed8d0]">
                    20% selection rate
                  </p>

                  <p className="mt-4 text-5xl font-semibold tracking-tight">
                    {overview.logistic20
                      ? percent(overview.logistic20.coverage)
                      : "—"}
                  </p>

                  <p className="mt-2 text-sm text-[#c7d9d7]">
                    poor-household coverage under logistic targeting
                  </p>

                  {overview.logisticCoverageGain !== null && (
                    <p className="mt-5 border-t border-[#42636a] pt-4 text-xs leading-5 text-[#c7d9d7]">
                      {percent(overview.logisticCoverageGain)} higher coverage
                      than random targeting at the same selection rate.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Key metrics */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Best poor coverage"
                value={
                  overview.logistic20
                    ? percent(overview.logistic20.coverage)
                    : "—"
                }
                detail="Logistic targeting at the 20% selection rate"
              />

              <MetricCard
                label="Severe-poor coverage"
                value={
                  overview.logistic20
                    ? percent(overview.logistic20.severe_poor_coverage)
                    : "—"
                }
                detail="Logistic targeting at the 20% selection rate"
              />

              <MetricCard
                label="Logistic ROC-AUC"
                value={
                  getModelRobustness(
                    data.model_robustness,
                    "Logistic Targeting",
                  )?.roc_auc_mean !== undefined
                    ? percent(
                        getModelRobustness(
                          data.model_robustness,
                          "Logistic Targeting",
                        )!.roc_auc_mean,
                      )
                    : "—"
                }
                detail="Mean performance across repeated train/test splits"
              />

              <MetricCard
                label="Selection range"
                value="5% → 20%"
                detail="Three household selection scenarios evaluated"
              />
            </section>

            {/* Main research findings */}
            <section className="mt-10">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  What the research found
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#183f4a]">
                  Three findings matter most
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <FindingCard
                  number="01"
                  title="Logistic leads on coverage"
                  description={`Logistic targeting is the coverage leader at 5%, 10% and 20%, making it the most consistent strategy when the policy objective is to reach more poor households.`}
                />

                <FindingCard
                  number="02"
                  title="Higher selection increases coverage"
                  description={`Increasing the selection rate from 5% to 20% substantially expands poor-household coverage, but the gain comes with a decline in precision.`}
                />

                <FindingCard
                  number="03"
                  title="Random Forest trades coverage for precision"
                  description={`Random Forest delivers slightly higher precision than logistic targeting at 10% and 20%, while logistic targeting maintains the stronger coverage performance.`}
                />
              </div>
            </section>

            {/* Selection-rate story */}
            <section className="mt-10 border border-[#d9e0dc] bg-[#fbfcfb]">
              <div className="border-b border-[#d9e0dc] p-6 lg:p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Selection-rate story
                </p>

                <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#183f4a]">
                      Logistic targeting from 5% to 20%
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#63716d]">
                      The strongest coverage strategy becomes more effective at
                      reaching poor households as the selection rate rises,
                      while precision falls.
                    </p>
                  </div>

                  <Link
                    href="/simulator"
                    className="text-sm font-semibold text-[#087f76]"
                  >
                    Inspect all metrics →
                  </Link>
                </div>
              </div>

              <div className="grid gap-0 md:grid-cols-3">
                {[
                  {
                    rate: "5%",
                    result: overview.logistic5,
                  },
                  {
                    rate: "10%",
                    result: overview.logistic10,
                  },
                  {
                    rate: "20%",
                    result: overview.logistic20,
                  },
                ].map(({ rate, result }, index) => (
                  <div
                    key={rate}
                    className={`p-6 ${
                      index < 2
                        ? "border-b border-[#d9e0dc] md:border-b-0 md:border-r"
                        : ""
                    }`}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                      Selection rate
                    </p>

                    <p className="mt-2 text-3xl font-semibold text-[#183f4a]">
                      {rate}
                    </p>

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#63716d]">Poor coverage</span>
                          <span className="font-mono font-semibold text-[#087f76]">
                            {result ? percent(result.coverage) : "—"}
                          </span>
                        </div>

                        <div className="mt-2 h-2 bg-[#e7ecea]">
                          <div
                            className="h-2 bg-[#087f76]"
                            style={{
                              width: result
                                ? `${result.coverage * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#63716d]">
                            Severe-poor coverage
                          </span>
                          <span className="font-mono font-semibold text-[#087f76]">
                            {result
                              ? percent(result.severe_poor_coverage)
                              : "—"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#63716d]">Precision</span>
                          <span className="font-mono font-semibold text-[#183f4a]">
                            {result ? percent(result.precision) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {overview.coverageChange !== null &&
                overview.precisionChange !== null && (
                  <div className="grid border-t border-[#d9e0dc] sm:grid-cols-2">
                    <div className="border-b border-[#d9e0dc] p-6 sm:border-b-0 sm:border-r">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                        Coverage gain
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-[#087f76]">
                        +{(overview.coverageChange * 100).toFixed(1)} pp
                      </p>

                      <p className="mt-1 text-xs text-[#63716d]">
                        From 5% to 20% selection
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                        Precision trade-off
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-[#8d3d37]">
                        {(overview.precisionChange * 100).toFixed(1)} pp
                      </p>

                      <p className="mt-1 text-xs text-[#63716d]">
                        Change from 5% to 20% selection
                      </p>
                    </div>
                  </div>
                )}
            </section>

            {/* Strategy snapshot */}
            <section className="mt-10">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                    Strategy snapshot
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                    How the strategies compare at 20%
                  </h2>
                </div>

                <Link
                  href="/simulator"
                  className="text-sm font-semibold text-[#087f76]"
                >
                  Full comparison →
                </Link>
              </div>

              <div className="overflow-x-auto border border-[#d9e0dc] bg-[#fbfcfb]">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#d9e0dc] bg-[#f4f6f5] text-xs uppercase tracking-[0.12em] text-[#63716d]">
                      <th className="px-5 py-4 font-semibold">Strategy</th>
                      <th className="px-5 py-4 font-semibold">Poor coverage</th>
                      <th className="px-5 py-4 font-semibold">Severe-poor</th>
                      <th className="px-5 py-4 font-semibold">Precision</th>
                      <th className="px-5 py-4 font-semibold">
                        Exclusion error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {overview.resultsAt20.map((result) => {
                      const isCoverageLeader =
                        result.strategy === overview.coverageLeader?.strategy;

                      const isPrecisionLeader =
                        result.strategy === overview.precisionLeader?.strategy;

                      return (
                        <tr
                          key={result.strategy}
                          className="border-b border-[#e6ebe8] text-sm last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-[#183f4a]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>
                                {STRATEGY_LABELS[result.strategy] ??
                                  result.strategy}
                              </span>

                              {isCoverageLeader && (
                                <span className="border border-[#9ed8d0] bg-[#eff9f6] px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.08em] text-[#087f76]">
                                  Coverage leader
                                </span>
                              )}

                              {isPrecisionLeader && (
                                <span className="border border-[#cbd4d1] bg-[#f4f6f5] px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.08em] text-[#183f4a]">
                                  Precision leader
                                </span>
                              )}
                            </div>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Model robustness */}
            <section className="mt-10">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Research confidence
                </p>

                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Model robustness
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#63716d]">
                  Repeated train/test splits provide an indication of how stable
                  the machine-learning results are across different samples.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    name: "Logistic regression",
                    model: getModelRobustness(
                      data.model_robustness,
                      "Logistic Targeting",
                    ),
                  },
                  {
                    name: "Random Forest",
                    model: getModelRobustness(
                      data.model_robustness,
                      "Random Forest Targeting",
                    ),
                  },
                ].map(({ name, model }) => (
                  <article
                    key={name}
                    className="border border-[#d9e0dc] bg-[#fbfcfb] p-6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-[#183f4a]">{name}</h3>

                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#63716d]">
                        Repeated splits
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="border border-[#e0e7e4] bg-white p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#63716d]">
                          ROC-AUC
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-[#183f4a]">
                          {model?.roc_auc_mean !== undefined
                            ? percent(model.roc_auc_mean)
                            : "—"}
                        </p>

                        {model?.roc_auc_std !== undefined && (
                          <p className="mt-1 text-xs text-[#63716d]">
                            ± {percent(model.roc_auc_std)}
                          </p>
                        )}
                      </div>

                      <div className="border border-[#e0e7e4] bg-white p-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#63716d]">
                          PR-AUC
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-[#183f4a]">
                          {model?.pr_auc_mean !== undefined
                            ? percent(model.pr_auc_mean)
                            : "—"}
                        </p>

                        {model?.pr_auc_std !== undefined && (
                          <p className="mt-1 text-xs text-[#63716d]">
                            ± {percent(model.pr_auc_std)}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Navigation */}
            <section className="mt-10 grid gap-4 md:grid-cols-3">
              <Link
                href="/simulator"
                className="group border border-[#d9e0dc] bg-[#fbfcfb] p-6 transition hover:border-[#087f76]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#087f76]">
                  01 / Simulator
                </p>

                <h3 className="mt-3 text-lg font-semibold text-[#183f4a]">
                  Test targeting strategies
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Explore coverage, precision, severe-poor coverage and
                  targeting errors across selection rates.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-[#087f76]">
                  Open simulator →
                </span>
              </Link>

              <Link
                href="/scenarios"
                className="group border border-[#d9e0dc] bg-[#fbfcfb] p-6 transition hover:border-[#087f76]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#087f76]">
                  02 / Scenarios
                </p>

                <h3 className="mt-3 text-lg font-semibold text-[#183f4a]">
                  Compare selection rates
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Compare the 5%, 10% and 20% targeting scenarios side by side.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-[#087f76]">
                  View scenarios →
                </span>
              </Link>

              <Link
                href="/households"
                className="group border border-[#d9e0dc] bg-[#fbfcfb] p-6 transition hover:border-[#087f76]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#087f76]">
                  03 / Households
                </p>

                <h3 className="mt-3 text-lg font-semibold text-[#183f4a]">
                  Inspect household data
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  Explore household-level targeting information and model
                  outputs.
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-[#087f76]">
                  Explore households →
                </span>
              </Link>
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-[#d9e0dc] pt-6">
          <p className="max-w-4xl text-xs leading-5 text-[#63716d]">
            Evaluation results describe observed performance on the current
            held-out test-set simulation. They are research estimates and do not
            establish individual eligibility or determine a social protection
            policy decision.
          </p>
        </footer>
      </main>
    </DashboardShell>
  );
}
