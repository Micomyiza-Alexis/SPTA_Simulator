"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/demo-logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label="Logout"
      title="Logout"
      className="inline-flex items-center gap-2 rounded-full border border-[#e8b6b0] bg-[#fff7f6] px-3 py-1.5 text-sm font-semibold text-[#b8544c] transition-colors hover:bg-[#fff0ee]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}
