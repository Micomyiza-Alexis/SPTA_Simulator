"use client";

import { DashboardShell, PageIntro } from "../../components/DashboardShell";

export default function HouseholdsPage() {
  return (
    <DashboardShell active="Households">
      <main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14">
        <PageIntro
          eyebrow="Records / Households"
          title="Household-level review"
          description="Household-level records are kept separate from the aggregated targeting results used by the simulator."
        />

        <section className="border border-[#d9e0dc] bg-[#fbfcfb] p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#b9ded8] bg-[#eff9f6] font-mono text-sm font-semibold text-[#17675e]">
              i
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#183f4a]">
                Aggregated results are currently exposed
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#63716d]">
                The simulator API currently provides strategy-level targeting
                results, budget scenarios, and robustness measurements. It does
                not expose household-level records through the dashboard
                endpoint.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="border border-[#d9e0dc] bg-white p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                    Available
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#183f4a]">
                    Strategy results
                  </p>
                </div>

                <div className="border border-[#d9e0dc] bg-white p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                    Available
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#183f4a]">
                    Budget scenarios
                  </p>
                </div>

                <div className="border border-[#d9e0dc] bg-white p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#63716d]">
                    Available
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#183f4a]">
                    Robustness results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-5 text-xs leading-5 text-[#63716d]">
          Household-level microdata remains separate from the aggregated
          dashboard results. This boundary helps prevent accidental exposure
          of identifiable or unnecessary household information.
        </p>
      </main>
    </DashboardShell>
  );
}
