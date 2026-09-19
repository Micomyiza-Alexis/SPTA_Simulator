"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell, PageIntro } from "../../components/DashboardShell";
import { getHouseholds } from "../../lib/api";
import type { Household } from "../../lib/mockApi";

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => { getHouseholds().then(setHouseholds); }, []);

  const filtered = useMemo(() => households.filter((household) => {
    const matchesQuery = `${household.id} ${household.district}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All" || household.category === category);
  }), [households, query, category]);

  return <DashboardShell active="Households"><main className="mx-auto max-w-[1440px] px-6 py-10 lg:px-10 lg:py-14"><PageIntro eyebrow="Records / Households" title="Review anonymized risk records." description="Filter the current household sample by anonymized identifier, district, or risk category. No names, national IDs, addresses, or phone numbers are displayed." /><section className="border border-[#d9e0dc] bg-[#fbfcfb]"><div className="flex flex-col gap-4 border-b border-[#d9e0dc] p-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">Household register</p><p className="mt-2 text-sm text-[#63716d]">{filtered.length} of {households.length} anonymized records</p></div><div className="flex flex-col gap-3 sm:flex-row"><label className="text-sm font-semibold text-[#183f4a]">Search<input aria-label="Search households" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID or district" className="mt-1 block border border-[#bfcac5] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#087f76]" /></label><label className="text-sm font-semibold text-[#183f4a]">Risk category<select aria-label="Filter by risk category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block border border-[#bfcac5] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#087f76]"><option>All</option><option>High</option><option>Medium</option><option>Low</option></select></label></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] border-collapse text-left"><caption className="sr-only">Anonymized household risk records</caption><thead><tr className="border-b border-[#d9e0dc] bg-[#f4f6f5] text-xs uppercase tracking-[0.12em] text-[#63716d]"><th className="px-5 py-4 font-semibold">Anonymized ID</th><th className="px-5 py-4 font-semibold">Risk score</th><th className="px-5 py-4 font-semibold">Risk category</th><th className="px-5 py-4 font-semibold">District</th><th className="px-5 py-4 font-semibold">Predicted status</th></tr></thead><tbody>{filtered.map((household) => <tr key={household.id} className="border-b border-[#e6ebe8] text-sm last:border-0"><td className="px-5 py-4 font-mono font-semibold text-[#183f4a]">{household.id}</td><td className="px-5 py-4 font-mono text-[#183f4a]">{household.riskScore.toFixed(1)}</td><td className="px-5 py-4"><span className={`inline-flex border px-2 py-1 text-xs font-semibold ${household.category === "High" ? "border-[#e8b6b0] bg-[#fff5f3] text-[#8d3d37]" : household.category === "Medium" ? "border-[#eed39f] bg-[#fffaf0] text-[#93631e]" : "border-[#b9ded8] bg-[#eff9f6] text-[#17675e]"}`}>{household.category}</span></td><td className="px-5 py-4 text-[#63716d]">{household.district}</td><td className="px-5 py-4 text-[#63716d]">{household.predictedEligible ? "Predicted eligible" : "Not predicted eligible"}</td></tr>)}</tbody></table></div></section><p className="mt-5 text-xs leading-5 text-[#63716d]">This view is for model review only. A predicted category does not establish eligibility for a social protection program.</p></main></DashboardShell>;
}
