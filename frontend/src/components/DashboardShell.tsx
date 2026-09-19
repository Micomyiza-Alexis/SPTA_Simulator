import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/", shortLabel: "Home" },
  { label: "Simulator", href: "/simulator", shortLabel: "Simulate" },
  { label: "Households", href: "/households", shortLabel: "Records" },
  { label: "Scenarios", href: "/scenarios", shortLabel: "Compare" },
];

export function DashboardShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef2f1] text-[#172624]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#123b43] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-7 py-7">
          <Image src="/NISR LOGO.png" alt="NISR" width={54} height={54} className="h-12 w-12 object-contain" priority />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8e0d5]">NISR</p>
            <p className="mt-1 text-sm font-semibold text-white">SPTA Simulator</p>
          </div>
        </div>
        <div className="px-5 pt-8">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ab8b5]">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.label} item={item} active={active === item.label} />
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 px-7 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8ab8b5]">Research prototype</p>
          <p className="mt-2 text-xs leading-5 text-[#d2e1de]">Targeting accuracy and coverage analysis for policy teams.</p>
          <p className="mt-5 font-mono text-[10px] text-[#8ab8b5]">SPTA v0.1.0</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-[#d7e0dc] bg-[#f8faf9]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-10">
            <Link href="/" className="flex items-center gap-3 lg:hidden" aria-label="SPTA Simulator overview">
              <Image src="/NISR LOGO.png" alt="NISR" width={42} height={42} className="h-10 w-10 object-contain" />
              <span className="text-sm font-semibold text-[#123b43]">SPTA Simulator</span>
            </Link>
            <div className="hidden items-center gap-3 text-sm text-[#63716d] lg:flex">
              <span className="h-2 w-2 rounded-full bg-[#2d9b83]" />
              <span>Model available</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#63716d] sm:inline">Latest refresh</span>
              <span className="font-mono text-xs font-semibold text-[#123b43]">2026-09-12</span>
            </div>
          </div>
        </header>

        <nav className="border-b border-[#d7e0dc] bg-[#f8faf9] lg:hidden" aria-label="Mobile navigation">
          <div className="flex gap-1 overflow-x-auto px-4 py-2">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className={`whitespace-nowrap px-3 py-2 text-xs font-semibold ${active === item.label ? "bg-[#d9efea] text-[#087f76]" : "text-[#63716d]"}`}>
                {item.shortLabel}
              </Link>
            ))}
          </div>
        </nav>

        {children}
        <footer className="border-t border-[#d7e0dc] px-6 py-6 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 text-xs text-[#63716d] sm:flex-row">
            <span>NISR 2026 Big Data Hackathon · Track 2</span>
            <span>Research/demo prototype · Predictions carry uncertainty</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: (typeof navigation)[number]; active: boolean }) {
  return (
    <Link href={item.href} className={`flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors ${active ? "bg-[#e1f2ee] text-[#123b43]" : "text-[#d2e1de] hover:bg-white/10 hover:text-white"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#087f76]" : "bg-[#6e9997]"}`} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-9">
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#087f76]">{eyebrow}</p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#123b43] sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#63716d]">{description}</p>
    </div>
  );
}
