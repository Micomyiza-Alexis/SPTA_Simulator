"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import {
  getModelRobustness,
  getTargetingRobustness,
  STRATEGY_LABELS,
} from "../../lib/api";
import type { ModelRobustness, TargetingRobustness } from "../../lib/api";

function percent(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}

function decimal(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(4);
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#63716d]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[#183f4a]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#63716d]">{detail}</p>
    </article>
  );
}

function ModelCard({ model }: { model: ModelRobustness }) {
  return (
    <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#183f4a]">
            {STRATEGY_LABELS[model.strategy] ?? model.strategy}
          </h3>
          <p className="mt-1 text-xs text-[#63716d]">Model-level evaluation</p>
        </div>
        <span className="border border-[#d9e0dc] px-3 py-1 font-mono text-xs text-[#63716d]">
          {model.splits} splits
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="border border-[#e0e7e4] bg-white p-4">
          <p className="text-xs text-[#63716d]">ROC-AUC · mean</p>
          <p className="mt-2 text-2xl font-semibold text-[#087f76]">
            {percent(model.roc_auc_mean)}
          </p>
          <p className="mt-2 text-xs text-[#63716d]">
            Standard deviation: {decimal(model.roc_auc_std)}
          </p>
        </div>

        <div className="border border-[#e0e7e4] bg-white p-4">
          <p className="text-xs text-[#63716d]">PR-AUC · mean</p>
          <p className="mt-2 text-2xl font-semibold text-[#183f4a]">
            {percent(model.pr_auc_mean)}
          </p>
          <p className="mt-2 text-xs text-[#63716d]">
            Standard deviation: {decimal(model.pr_auc_std)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-[#63716d]">
        Lower standard deviation indicates less variation in the metric across
        the evaluated splits. It does not, by itself, establish that a model
        will generalize to every population.
      </p>
    </article>
  );
}

const targetingMetrics = [
  {
    key: "coverage",
    label: "Poor-household coverage",
    mean: "coverage_mean",
    std: "coverage_std",
  },
  {
    key: "severe",
    label: "Severe-poor coverage",
    mean: "severe_poor_coverage_mean",
    std: "severe_poor_coverage_std",
  },
  {
    key: "precision",
    label: "Precision",
    mean: "precision_mean",
    std: "precision_std",
  },
  {
    key: "inclusion",
    label: "Inclusion error",
    mean: "inclusion_error_mean",
    std: "inclusion_error_std",
  },
  {
    key: "exclusion",
    label: "Exclusion error",
    mean: "exclusion_error_mean",
    std: "exclusion_error_std",
  },
] as const;

export default function RobustnessPage() {
  const [models, setModels] = useState<ModelRobustness[]>([]);
  const [targeting, setTargeting] = useState<TargetingRobustness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [modelResults, targetingResults] = await Promise.all([
          getModelRobustness(),
          getTargetingRobustness(),
        ]);

        if (cancelled) return;

        setModels(modelResults);
        setTargeting(targetingResults);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load robustness results.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const budgets = [...new Set(targeting.map((item) => item.budget))].sort(
    (a, b) => a - b,
  );

  return (
    <DashboardShell active="Robustness">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Evaluation / Model stability"
          title="Robustness & reliability"
          description="Examine how model discrimination and targeting outcomes vary across evaluation splits. Use these results to understand stability, not as a guarantee of future performance."
        />

        {loading && (
          <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
            <p className="text-sm text-[#63716d]">
              Loading robustness results from the API…
            </p>
          </section>
        )}

        {error && (
          <section className="border border-[#e8b6b0] bg-[#fff5f3] p-6">
            <h2 className="font-semibold text-[#8d3d37]">
              Robustness results unavailable
            </h2>
            <p className="mt-2 text-sm text-[#8d3d37]">{error}</p>
            <p className="mt-3 text-xs text-[#63716d]">
              Check that the backend is running and the robustness endpoints
              return valid results.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 border border-[#d9a39d] px-4 py-2 text-sm font-semibold text-[#8d3d37]"
            >
              Retry
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <Metric
                label="Models evaluated"
                value={String(models.length)}
                detail="Strategies with model-level robustness results"
              />
              <Metric
                label="Targeting evaluations"
                value={String(targeting.length)}
                detail="Strategy and selection-rate result rows"
              />
              <Metric
                label="Selection scenarios"
                value={String(budgets.length)}
                detail="Distinct budget rates in the returned results"
              />
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  01 / Model-level stability
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#183f4a]">
                  Discrimination across evaluation splits
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                  ROC-AUC measures ranking across classes. PR-AUC summarizes
                  precision-recall performance and is particularly useful when
                  the outcome classes are imbalanced. The reported standard
                  deviations describe variation across the evaluated splits.
                </p>
              </div>

              {models.length === 0 ? (
                <p className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 text-sm text-[#63716d]">
                  No model robustness results were returned by the API.
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {models.map((model) => (
                    <ModelCard key={model.strategy} model={model} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  02 / Targeting stability
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#183f4a]">
                  Does the targeting result hold across splits?
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                  Compare the mean and standard deviation for each targeting
                  metric at each budget. A high mean may be desirable for
                  coverage or precision, while lower inclusion and exclusion
                  errors are generally preferable.
                </p>
              </div>

              {targeting.length === 0 ? (
                <p className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 text-sm text-[#63716d]">
                  No targeting robustness results were returned by the API.
                </p>
              ) : (
                <div className="space-y-8">
                  {budgets.map((budget) => {
                    const rows = targeting
                      .filter(
                        (item) => Math.abs(item.budget - budget) < 0.000001,
                      )
                      .sort((a, b) => a.strategy.localeCompare(b.strategy));

                    return (
                      <section
                        key={budget}
                        className="border border-[#d9e0dc] bg-[#fbfcfb]"
                      >
                        <div className="border-b border-[#d9e0dc] p-5 sm:p-6">
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#63716d]">
                            Selection budget
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-[#183f4a]">
                            {percent(budget)}
                          </h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[1100px] border-collapse text-left">
                            <thead>
                              <tr className="border-b border-[#d9e0dc] bg-[#f2f6f4] text-[10px] uppercase tracking-[0.1em] text-[#63716d]">
                                <th className="sticky left-0 z-10 bg-[#f2f6f4] px-5 py-4">
                                  Strategy
                                </th>
                                <th className="px-4 py-4 text-center">
                                  Splits
                                </th>
                                {targetingMetrics.map((metric) => (
                                  <th
                                    key={metric.key}
                                    className="min-w-[155px] px-4 py-4"
                                  >
                                    {metric.label}
                                    <span className="mt-1 block font-normal normal-case tracking-normal">
                                      Mean ± standard deviation
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            <tbody>
                              {rows.map((row) => (
                                <tr
                                  key={row.strategy}
                                  className="border-b border-[#e6ebe8] text-xs last:border-0 hover:bg-[#f2f8f6]"
                                >
                                  <td className="sticky left-0 z-10 bg-[#fbfcfb] px-5 py-5 font-semibold text-[#183f4a]">
                                    <span className="block whitespace-nowrap">
                                      {STRATEGY_LABELS[row.strategy] ??
                                        row.strategy}
                                    </span>
                                  </td>

                                  <td className="px-4 py-5 text-center font-mono text-[#63716d]">
                                    {row.splits}
                                  </td>

                                  {targetingMetrics.map((metric) => {
                                    const mean = row[metric.mean];
                                    const std = row[metric.std];

                                    return (
                                      <td
                                        key={metric.key}
                                        className="px-4 py-5"
                                      >
                                        <p className="whitespace-nowrap font-mono text-sm font-semibold text-[#183f4a]">
                                          {percent(mean)}
                                        </p>
                                        <p className="mt-1 whitespace-nowrap text-[#63716d]">
                                          ± {percent(std)}
                                        </p>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-10 border border-[#d9e0dc] bg-[#f8faf9] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                Interpretation & limitations
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                Stability is evidence, not certainty
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#63716d]">
                <li>
                  Standard deviation describes variability across the splits
                  used by the backend; it is not automatically a confidence
                  interval.
                </li>
                <li>
                  Model discrimination and targeting outcomes answer different
                  questions. A higher AUC does not guarantee better coverage at
                  a particular budget.
                </li>
                <li>
                  Results depend on the data, labels, sampling design, split
                  procedure and evaluation assumptions.
                </li>
                <li>
                  These estimates support policy analysis. They do not
                  independently establish eligibility or replace accountable
                  human decisions.
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/scenarios"
                  className="text-sm font-semibold text-[#087f76]"
                >
                  Compare scenarios →
                </Link>
                <Link
                  href="/simulator"
                  className="text-sm font-semibold text-[#087f76]"
                >
                  Open simulator →
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </DashboardShell>
  );
}
