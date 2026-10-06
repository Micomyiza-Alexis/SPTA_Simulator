"use client";

import { DashboardShell, PageIntro } from "../../components/DashboardShell";

const datasetLayers = [
  {
    label: "Household microdata",
    status: "Research input",
    description:
      "Household and person-level survey data used during the research and modelling workflow.",
  },
  {
    label: "Targeting features",
    status: "Model input",
    description:
      "Observable household characteristics transformed into predictors for the targeting models.",
  },
  {
    label: "Strategy results",
    status: "Dashboard output",
    description:
      "Aggregated targeting performance produced from the held-out evaluation population.",
  },
];

const exposedOutputs = [
  "Strategy-level targeting performance",
  "5%, 10%, and 20% household selection scenarios",
  "Poor-household coverage",
  "Severe-poor coverage",
  "Precision and targeting errors",
  "Model and targeting robustness results",
];

export default function HouseholdsPage() {
  return (
    <DashboardShell active="Households">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Research data / Households"
          title="From household data to targeting evidence"
          description="The research engine operates on household-level survey data, while the dashboard exposes aggregated evidence rather than individual household records."
        />

        <div className="space-y-6">
          <section className="border border-[#b8dcd7] bg-[#f2faf8] p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#087f76]">
                  Data boundary
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#183f4a]">
                  Household records are used for research, not exposed as a
                  dashboard directory.
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#63716d]">
                  The targeting models require household-level observations to
                  learn and evaluate vulnerability patterns. Once the
                  evaluation is complete, the dashboard focuses on aggregated
                  performance so decision-makers can compare strategies without
                  exposing unnecessary microdata.
                </p>
              </div>

              <div className="shrink-0 border border-[#b8dcd7] bg-white px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Dashboard access
                </p>

                <p className="mt-2 text-lg font-semibold text-[#087f76]">
                  Aggregated
                </p>

                <p className="mt-1 text-xs text-[#63716d]">
                  No individual household records exposed
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[#d9e0dc] bg-[#fbfcfb]">
            <div className="border-b border-[#d9e0dc] p-6 lg:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                Research pipeline
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                Where household data fits
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                The project separates the underlying survey data from the
                decision-support outputs presented in the dashboard.
              </p>
            </div>

            <div className="grid gap-px bg-[#d9e0dc] md:grid-cols-3">
              {datasetLayers.map((layer, index) => (
                <article
                  key={layer.label}
                  className="bg-white p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#087f76]">
                      0{index + 1}
                    </span>

                    <span className="border border-[#d9e0dc] bg-[#f7f9f8] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#63716d]">
                      {layer.status}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-[#183f4a]">
                    {layer.label}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#63716d]">
                    {layer.description}
                  </p>

                  {index < datasetLayers.length - 1 && (
                    <div className="mt-6 hidden text-xs text-[#087f76] md:block">
                      ↓
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                What the dashboard exposes
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                Decision-ready evidence
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#63716d]">
                Rather than displaying individual records, the dashboard
                exposes the measurements needed to compare targeting
                strategies.
              </p>

              <ul className="mt-6 space-y-3">
                {exposedOutputs.map((output) => (
                  <li
                    key={output}
                    className="flex items-start gap-3 text-sm text-[#183f4a]"
                  >
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center border border-[#b8dcd7] bg-[#f2faf8] font-mono text-[9px] text-[#087f76]">
                      ✓
                    </span>

                    <span>{output}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                Why this boundary matters
              </p>

              <h2 className="mt-2 text-xl font-semibold text-[#183f4a]">
                Protect the data. Preserve the evidence.
              </h2>

              <div className="mt-5 space-y-4">
                <div className="border-l-2 border-[#087f76] bg-white p-4">
                  <p className="text-sm font-semibold text-[#183f4a]">
                    Avoid unnecessary exposure
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#63716d]">
                    Individual household observations are not required for
                    comparing the performance of the targeting strategies.
                  </p>
                </div>

                <div className="border-l-2 border-[#087f76] bg-white p-4">
                  <p className="text-sm font-semibold text-[#183f4a]">
                    Keep evaluation separate from eligibility
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#63716d]">
                    The research results evaluate targeting performance. They
                    do not establish individual eligibility for a social
                    protection programme.
                  </p>
                </div>

                <div className="border-l-2 border-[#087f76] bg-white p-4">
                  <p className="text-sm font-semibold text-[#183f4a]">
                    Make results easier to audit
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#63716d]">
                    Aggregated metrics make it possible to compare strategies,
                    selection rates, and robustness without turning the
                    dashboard into a raw-data browser.
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                  Current API boundary
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#183f4a]">
                  Household-level API access is not currently exposed.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                  The dashboard API currently provides strategy results,
                  selection-rate scenarios, and robustness measurements. The
                  household endpoint is intentionally outside the current
                  dashboard surface.
                </p>
              </div>

              <div className="shrink-0 border border-[#d9e0dc] bg-white px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                  Status
                </p>

                <p className="mt-1 font-semibold text-[#183f4a]">
                  Not exposed
                </p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-6 text-xs leading-5 text-[#63716d]">
          Household-level microdata remains part of the research workflow.
          Dashboard results are aggregated estimates from the held-out
          evaluation population and should not be interpreted as individual
          eligibility decisions.
        </p>
      </main>
    </DashboardShell>
  );
}