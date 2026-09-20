import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const navigation = [
  { label: "Overview", href: "/", shortLabel: "Home", icon: OverviewIcon },
  { label: "Simulator", href: "/simulator", shortLabel: "Simulate", icon: SimulatorIcon },
  { label: "Households", href: "/households", shortLabel: "Records", icon: HouseholdsIcon },
  { label: "Scenarios", href: "/scenarios", shortLabel: "Compare", icon: ScenariosIcon },
];

export function DashboardShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-[#12211f]">
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-64 flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#07262c] via-[#0f3a42] to-[#0a2f36] text-white shadow-[0_24px_60px_-28px_rgba(15,58,66,0.7)] lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Image src="/NISR LOGO.png" alt="NISR" width={54} height={54} className="h-9 w-9 object-contain" priority />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ee0d4]">NISR</p>
            <p className="mt-1 text-sm font-semibold tracking-tight text-white">SPTA Analytics</p>
          </div>
        </div>

        <div className="px-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ab8b5]">Workspace</p>
          <nav className="mt-3 space-y-1.5" aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.label} item={item} active={active === item.label} />
            ))}
          </nav>
        </div>

        <div className="m-4 mt-auto rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8ab8b5]">Research prototype</p>
          <p className="mt-2 text-xs leading-5 text-[#d2e1de]">Targeting accuracy and coverage analysis for policy teams.</p>
          <p className="mt-4 font-mono text-[10px] text-[#8ab8b5]">SPTA v0.1.0</p>
        </div>
      </aside>

      <div className="lg:pl-[18.5rem]">
        <header className="sticky top-0 z-10 border-b border-white/40 bg-white/65 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3.5 lg:px-10">
            <Link href="/" className="flex items-center gap-3 lg:hidden" aria-label="SPTA Simulator overview">
              <Image src="/NISR LOGO.png" alt="NISR" width={42} height={42} className="h-9 w-9 object-contain" />
              <span className="text-sm font-semibold text-[#0f3a42]">SPTA Simulator</span>
            </Link>
            <div className="hidden items-center gap-2 rounded-full bg-[#e8f6f3] px-3 py-1.5 text-sm text-[#17675e] lg:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2d9b83] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2d9b83]" />
              </span>
              Model available
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-[#d7e2de] bg-white/80 px-3 py-1.5 sm:block">
                <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5c6c68]">Refresh</span>
                <span className="font-mono text-xs font-semibold text-[#0f3a42]">2026-09-12</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <nav className="border-b border-[#d7e2de]/80 bg-white/70 backdrop-blur lg:hidden" aria-label="Mobile navigation">
          <div className="flex gap-1 overflow-x-auto px-4 py-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  active === item.label ? "bg-[#0f3a42] text-white" : "text-[#5c6c68] hover:bg-[#e8f6f3]"
                }`}
              >
                {item.shortLabel}
              </Link>
            ))}
          </div>
        </nav>

        {children}
        <footer className="px-5 pb-8 pt-2 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 rounded-2xl border border-[#d7e2de]/80 bg-white/60 px-5 py-4 text-xs text-[#5c6c68] sm:flex-row">
            <span>NISR 2026 Big Data Hackathon · Track 2</span>
            <span>Research/demo prototype · Predictions carry uncertainty</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: (typeof navigation)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
        active ? "bg-white text-[#0f3a42] shadow-sm" : "text-[#d2e1de] hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className={active ? "text-[#0b8a80]" : "text-[#8ab8b5]"} />
      {item.label}
    </Link>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0b8a80]">{eyebrow}</p>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[#0f3a42] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5c6c68]">{description}</p>
    </div>
  );
}

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SimulatorIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  );
}

function HouseholdsIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 3-4.5 5.5-4.5S13.9 16 14.5 19" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16 15c2.2.2 3.8 1.4 4.4 4" strokeLinecap="round" />
    </svg>
  );
}

function ScenariosIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
    </svg>
  );
}
