import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Simulator", href: "/simulator" },
  { label: "Households", href: "/households" },
  { label: "Scenarios", href: "/scenarios" },
];

export function DashboardShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f4f6f5] text-[#182321]"><header className="border-b border-[#d9e0dc] bg-[#fbfcfb]"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10"><Link href="/" className="flex items-center gap-3" aria-label="SPTA Simulator overview"><span className="flex h-10 w-10 items-center justify-center bg-[#183f4a] text-sm font-semibold tracking-wide text-white">NISR</span><span><span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#087f76]">Research prototype</span><span className="block text-base font-semibold">SPTA Simulator</span></span></Link><p className="hidden font-mono text-[11px] text-[#63716d] sm:block">SPTA v0.1.0</p></div></header><nav className="border-b border-[#d9e0dc] bg-[#f4f6f5]" aria-label="Primary navigation"><div className="mx-auto flex max-w-[1440px] items-center gap-7 overflow-x-auto px-6 lg:px-10">{navigation.map((item) => <Link key={item.label} href={item.href} className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap ${active === item.label ? "border-[#087f76] text-[#183f4a]" : "border-transparent text-[#63716d] hover:text-[#183f4a]"}`}>{item.label}</Link>)}<span className="ml-auto"><LogoutButton /></span></div></nav>{children}<footer className="border-t border-[#d9e0dc] px-6 py-6 lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 text-xs text-[#63716d] sm:flex-row"><span>NISR 2026 Big Data Hackathon · Track 2</span><span>Research/demo prototype - predictions carry uncertainty</span></div></footer></div>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-9"><p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#087f76]">{eyebrow}</p><h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#183f4a] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#63716d]">{description}</p></div>;
}