"use client";

import Image from "next/image";
import { useState, type CSSProperties, type FormEvent } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        already_subscribed?: boolean;
        message?: string;
      };

      if (!json.ok) {
        throw new Error(json.message || "Could not subscribe");
      }

      setSuccessMessage(
        json.already_subscribed
          ? "You're already on the list."
          : "You're in — thanks for subscribing."
      );
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_left,rgba(0,0,0,0.06),transparent_70%)]"
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <Image
          src="/stamp.png"
          alt=""
          width={420}
          height={520}
          className="stamp-inset w-[7.25rem] object-contain drop-shadow-[3px_8px_10px_rgba(0,0,0,0.16)] sm:w-[8.25rem]"
          style={{ "--stamp-rot": "8deg" } as CSSProperties}
        />

        <h2 className="mt-8 font-[family-name:var(--font-hero-serif)] text-[clamp(2.4rem,6vw,4.15rem)] font-medium leading-[1.02] tracking-[-0.03em] text-black">
          Stay in the loop.
        </h2>

        <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-neutral-500 sm:text-[1rem]">
          Subscribe to the newsletter for fragrance write-ups, occasion picks,
          and discount codes, unsubscribe anytime.
        </p>

        {success ? (
          <div className="mt-10 w-full max-w-xl border-2 border-black bg-white px-5 py-6 shadow-[4px_4px_0_#000]">
            <span className="inline-block border-2 border-black bg-black px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.12em] text-white">
              Success
            </span>
            <p className="mt-4 font-[family-name:var(--font-hero-serif)] text-[1.35rem] font-medium tracking-[-0.01em] text-black">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setSuccessMessage("");
              }}
              className="mt-5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500 underline-offset-2 hover:text-black hover:underline"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full border-2 border-black bg-white px-4 py-3 text-[0.95rem] text-black outline-none placeholder:text-neutral-400 sm:max-w-[18rem]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center gap-2 border-2 border-black bg-white px-6 py-3 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.12em] text-black shadow-[4px_4px_0_#000] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#000]"
            >
              {submitting ? "Subscribing…" : "Subscribe →"}
            </button>
          </form>
        )}

        {error && !success ? (
          <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
