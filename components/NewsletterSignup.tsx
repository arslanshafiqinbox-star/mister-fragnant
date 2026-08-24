"use client";

import { useState, type FormEvent } from "react";

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
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="inline-block border border-black bg-white px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#000]">
          The newsletter
        </span>

        <h2 className="mt-6 font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
          Stay in the loop.
        </h2>

        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-neutral-500 sm:text-[1.05rem]">
          Subscribe to the newsletter for new scent write-ups, occasion picks,
          and the odd sponsored feature — no spam, unsubscribe any time.
        </p>

        {success ? (
          <div className="mt-9 w-full max-w-md border border-black bg-white px-5 py-6 shadow-[4px_4px_0_#000]">
            <span className="inline-block border border-black bg-black px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.12em] text-white">
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
            className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full border border-black bg-white px-4 py-3 text-[0.95rem] text-black outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 border border-black bg-white px-5 py-3 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.12em] text-black shadow-[3px_3px_0_#000] transition-[transform,box-shadow,background-color,color] duration-150 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-[4px_5px_0_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-[3px_3px_0_#000]"
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
