"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_EMAIL_KEY,
  ADMIN_TOKEN_KEY,
  isAdminSignedIn,
} from "@/lib/admin-session";

type SignInResponse = {
  ok: boolean;
  token?: string;
  email?: string;
  message?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminSignedIn()) {
      router.replace("/admin/main");
      return;
    }
    setReady(true);
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const json = (await res.json()) as SignInResponse;

      if (!json.ok || !json.token) {
        throw new Error(json.message || "Invalid email or password.");
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, json.token);
      sessionStorage.setItem(ADMIN_EMAIL_KEY, json.email ?? email.trim());
      router.replace("/admin/main");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.12em] text-neutral-400">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 sm:px-8">
      <div className="w-full max-w-md border border-black bg-white p-6 shadow-[6px_6px_0_#000] sm:p-8">
        <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
          Admin
        </span>

        <h1 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.85rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
          Sign in.
        </h1>
        <p className="mt-2 text-[0.9rem] text-neutral-500">
          Moderator access only.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-neutral-500"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="w-full border-0 border-b border-black bg-transparent pb-2 text-[0.95rem] text-black outline-none placeholder:text-neutral-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-neutral-500"
            >
              Password
            </label>
            <div className="flex items-end gap-2 border-b border-black">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full border-0 bg-transparent pb-2 text-[0.95rem] text-black outline-none placeholder:text-neutral-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 pb-2 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.1em] text-neutral-500 hover:text-black"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_#a3a3a3] transition-[transform,box-shadow,opacity] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#a3a3a3] disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
