"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to sign in to the demo.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to reach the demo sign-in service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f5] px-6 py-10 text-[#182321] lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1180px] items-center justify-center">
        <div className="grid w-full max-w-[980px] overflow-hidden border border-[#d9e0dc] bg-[#fbfcfb] shadow-[0_8px_30px_rgba(24,35,33,0.06)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="bg-[#183f4a] p-8 text-white sm:p-12">
            <div className="flex h-10 w-10 items-center justify-center bg-[#f4c978] text-sm font-semibold tracking-wide text-[#183f4a]">NISR</div>
            <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a6d9d0]">Internal research environment</p>
            <h1 className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.03em]">Social Protection Targeting Accuracy Simulator</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#d2e1de]">A decision-support prototype for examining coverage and targeting error tradeoffs.</p>
          </section>

          <section className="p-8 sm:p-12">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#087f76]">Demo access</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[#183f4a]">Enter the workspace</h2>
            <p className="mt-3 text-sm leading-6 text-[#63716d]">Use any name for this session and the shared demo password provided by the project team.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-[#183f4a]">Name or organization</label><input id="username" name="username" type="text" autoComplete="organization" value={username} onChange={(event) => setUsername(event.target.value)} required className="w-full border border-[#bfcac5] bg-white px-3 py-3 text-sm outline-none focus:border-[#087f76] focus:ring-2 focus:ring-[#b9ded8]" placeholder="e.g. Policy Analysis Unit" /></div>
              <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#183f4a]">Shared demo password</label><input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full border border-[#bfcac5] bg-white px-3 py-3 text-sm outline-none focus:border-[#087f76] focus:ring-2 focus:ring-[#b9ded8]" /></div>
              {error && <p role="alert" className="border-l-2 border-[#b8544c] bg-[#fff5f3] px-3 py-2 text-sm text-[#8d3d37]">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#087f76] px-4 py-3 text-sm font-semibold text-white hover:bg-[#066b64] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Checking access..." : "Enter simulator"}</button>
            </form>

            <p className="mt-8 border-t border-[#d9e0dc] pt-5 text-xs leading-5 text-[#63716d]">Demo access only - no real credentials or personal data required.</p>
          </section>
        </div>
      </div>
    </main>
  );
}