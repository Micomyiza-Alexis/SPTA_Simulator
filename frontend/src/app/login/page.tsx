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
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f1] px-6">
      <div className="w-full max-w-sm border border-[#d9e0dc] bg-[#fbfcfb] p-8 shadow-[0_2px_8px_rgba(24,35,33,0.05)]">
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
            <p className="text-sm font-semibold text-[#183f4a]">
              SPTA Simulator
            </p>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-[#183f4a]">
          Research prototype access
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#63716d]">
          This is a demo gate for the hackathon prototype, not production
          authentication.
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
              className="mt-2 w-full border border-[#cfd8d4] bg-white px-3 py-2 text-sm text-[#183f4a] outline-none focus:border-[#087f76]"
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
              className="mt-2 w-full border border-[#cfd8d4] bg-white px-3 py-2 text-sm text-[#183f4a] outline-none focus:border-[#087f76]"
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
            className="w-full border border-[#183f4a] bg-[#183f4a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f2a32] disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}