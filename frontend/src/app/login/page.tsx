"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Enter a username and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "Unable to sign in.");
        setIsSubmitting(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Is the backend running?");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#041c21] px-6 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#0b8a80]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-[#c8862c]/25 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden text-white lg:block">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9ee0d4]">
            NISR 2026 · Track 2
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">
            SPTA Analytics
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#d7ece8]">
            A targeting command center for social protection: coverage, precision and error across competing strategies.
          </p>
          <div className="mt-8 grid max-w-sm grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9ee0d4]">Strategies</p>
              <p className="mt-2 text-2xl font-semibold">5</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#9ee0d4]">Budgets</p>
              <p className="mt-2 text-2xl font-semibold">5% / 10% / 20%</p>
            </div>
          </div>
        </div>

        <div className="w-full rounded-[28px] border border-white/10 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(4,28,33,0.8)]">
          <div className="mb-7 flex items-center gap-3">
            <Image
              src="/NISR LOGO.png"
              alt="NISR"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              priority
            />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#63716d]">
                NISR
              </p>
              <p className="text-sm font-semibold text-[#183f4a]">SPTA Analytics</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-[#0f3a42]">Open the dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-[#63716d]">
            Demo gate for the hackathon prototype — not production authentication.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#63716d]"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-[#cfd8d4] bg-[#f7fafa] px-3 py-3 text-sm text-[#183f4a] outline-none focus:border-[#087f76]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#63716d]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 w-full rounded-2xl border border-[#cfd8d4] bg-[#f7fafa] px-3 py-3 text-sm text-[#183f4a] outline-none focus:border-[#087f76]"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#8d3d37]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#0f3a42] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#17675e] disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Enter command center"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
