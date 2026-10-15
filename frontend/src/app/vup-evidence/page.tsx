"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { getVUPEvidence } from "../../lib/api";
import type { VUPEvidence } from "../../lib/api";

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function percent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
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

export default function VUPEvidencePage() {
  const [evidence, setEvidence] = useState<VUPEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getVUPEvidence();
        if (!cancelled) setEvidence(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load VUP evidence.",
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

  const componentChart = evidence?.programme_components.map((component) => ({
    component: component.label,
    households: component.unique_households,
  })) ?? [];

  const povertyChart = evidence?.overall_poverty_composition.map((item) => ({
    category: item.category,
    households: item.count,
    share: item.percent ?? 0,
  })) ?? [];

  const overlapChart = evidence?.overlap.distribution_by_component_count.map(
    (item) => ({
      components: `${item.components_per_household}`,
      households: item.households,
    }),
  ) ?? [];

  return (
    <DashboardShell active="VUP Evidence">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Programme evidence / VUP"
          title="VUP participation & poverty evidence"
          description="Explore household participation across five VUP programme components, the sample's recorded poverty composition, and overlap between components. This is descriptive evidence for policy analysis, not a causal impact evaluation."
        />

        {loading && (
          <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6">
            <p className="text-sm text-[#63716d]">
              Loading aggregate VUP evidence from the API...
            </p>
          </section>
        )}

        {error && (
          <section className="border border-[#e8b6b0] bg-[#fff5f3] p-6">
            <h2 className="font-semibold text-[#8d3d37]">
              VUP evidence unavailable
            </h2>
            <p className="mt-2 text-sm text-[#8d3d37]">{error}</p>
            <p className="mt-3 text-xs leading-5 text-[#63716d]">
              Check that the backend is running and the aggregate evidence
              endpoint returns valid data.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 border border-[#d9a39d] px-4 py-2 text-sm font-semibold text-[#8d3d37]"
            >
              Retry
            </button>
          </section>
        )}

        {!loading && !error && evidence && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Master sample"
                value={numberFormat(evidence.metadata.master_households)}
                detail="Unique households in the VUP household file"
              />
              <Metric
                label="In any component"
                value={numberFormat(
                  evidence.overlap.households_in_any_component,
                )}
                detail="Unique households found in at least one component file"
              />
              <Metric
                label="Multiple components"
                value={numberFormat(
                  evidence.overlap.households_in_multiple_components,
                )}
                detail="Households appearing in two or more component files"
              />
              <Metric
                label="No component file"
                value={numberFormat(
                  evidence.overlap.households_in_no_component,
                )}
                detail="Master-file households not found in these five component files"
              />
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  01 / Programme participation
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#183f4a]">
                  Unique households by component
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                  Each bar counts unique household IDs within that component.
                  A household can appear in more than one bar, so these counts
                  should not be added to estimate the number of distinct
                  programme households.
                </p>
              </div>

              <div className="border border-[#d9e0dc] bg-[#fbfcfb] p-4 sm:p-6">
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={componentChart}
                      margin={{ top: 12, right: 16, left: 8, bottom: 64 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="component"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickFormatter={(value: number) =>
                          numberFormat(value)
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          numberFormat(Number(value)),
                          "Unique households",
                        ]}
                      />
                      <Bar
                        dataKey="households"
                        name="Unique households"
                        fill="#087f76"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#d9e0dc] text-[10px] uppercase tracking-[0.1em] text-[#63716d]">
                        <th className="py-3 pr-4">Component</th>
                        <th className="px-4 py-3 text-right">Unique households</th>
                        <th className="px-4 py-3 text-right">Duplicate rows removed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidence.programme_components.map((component) => (
                        <tr
                          key={component.key}
                          className="border-b border-[#e6ebe8] last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium text-[#183f4a]">
                            {component.label}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {numberFormat(component.unique_households)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#63716d]">
                            {numberFormat(component.duplicate_rows_removed)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-2">
              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  02 / Poverty composition
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  Recorded categories in the master sample
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  These counts describe the unweighted sample distribution,
                  not national poverty prevalence.
                </p>

                <div className="mt-5 h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={povertyChart}
                      layout="vertical"
                      margin={{ top: 8, right: 20, bottom: 8, left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value: number) =>
                          numberFormat(value)
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={130}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          numberFormat(Number(value)),
                          name === "households" ? "Households" : String(name),
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="households"
                        name="Households"
                        fill="#276b75"
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-3">
                  {evidence.overall_poverty_composition.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between gap-4 border-t border-[#e6ebe8] pt-3 text-sm"
                    >
                      <span className="text-[#63716d]">{item.category}</span>
                      <span className="font-mono font-semibold text-[#183f4a]">
                        {numberFormat(item.count)} ({percent(item.percent)})
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-5 sm:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  03 / Component overlap
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                  How many components per household?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#63716d]">
                  This distribution includes every master-file household,
                  including households not found in any of the five component
                  files.
                </p>

                <div className="mt-5 h-[270px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overlapChart}
                      margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="components"
                        tickFormatter={(value) => `${value}`}
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Number of components",
                          position: "insideBottom",
                          offset: -2,
                          fontSize: 11,
                        }}
                        height={44}
                      />
                      <YAxis
                        tickFormatter={(value: number) =>
                          numberFormat(value)
                        }
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          numberFormat(Number(value)),
                          "Households",
                        ]}
                        labelFormatter={(value) =>
                          `${value} component(s)`
                        }
                      />
                      <Bar
                        dataKey="households"
                        name="Households"
                        fill="#087f76"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-3">
                  {evidence.overlap.distribution_by_component_count.map(
                    (item) => (
                      <div
                        key={item.components_per_household}
                        className="flex items-center justify-between gap-4 border-t border-[#e6ebe8] pt-3 text-sm"
                      >
                        <span className="text-[#63716d]">
                          {item.components_per_household} component(s)
                        </span>
                        <span className="font-mono font-semibold text-[#183f4a]">
                          {numberFormat(item.households)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </article>
            </section>

            <section className="mt-10 border border-[#d9e0dc] bg-[#f8faf9] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                Research notes / interpretation
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                What this evidence can and cannot tell us
              </h2>

              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#63716d]">
                <li>
                  <strong>Descriptive, not causal:</strong> participation
                  counts and poverty composition do not prove that a VUP
                  component caused a change in household welfare.
                </li>
                <li>
                  <strong>Weighting:</strong> {evidence.metadata.weighting}
                </li>
                <li>
                  <strong>Separate datasets:</strong> VUP and EICV7 household
                  IDs have not been matched. Shared geography alone does not
                  establish record-level linkage.
                </li>
                <li>
                  <strong>Overlap:</strong> component counts can overlap; use
                  the distinct-household union and overlap distribution when
                  describing programme reach.
                </li>
                <li>
                  <strong>Privacy:</strong> this endpoint serves aggregate
                  statistics only and does not return household or person IDs.
                </li>
              </ul>

              <div className="mt-6 border-t border-[#d9e0dc] pt-5 text-xs leading-5 text-[#63716d]">
                <p><strong>Source:</strong> {evidence.metadata.source}</p>
                <p className="mt-1"><strong>Privacy note:</strong> {evidence.metadata.privacy_note}</p>
                <p className="mt-1">
                  <strong>Generated (UTC):</strong>{" "}
                  {evidence.metadata.generated_at_utc}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </DashboardShell>
  );
}
