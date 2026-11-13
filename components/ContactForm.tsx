"use client";

import { useState, type FormEvent } from "react";

const TOPICS = [
  "General question",
  "Review request",
  "Partnership",
  "Fragrance suggestion",
] as const;

const fieldClass =
  "w-full border-2 border-black bg-brand-cream px-3 py-2.5 text-[0.95rem] text-black outline-none placeholder:text-neutral-400";
const labelClass =
  "mb-1.5 block font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.12em] text-neutral-400";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("General question");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!json.ok) {
        throw new Error(json.message || "Could not send message");
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setTopic("General question");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="bg-brand-blue px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto flex w-full max-w-[780px] flex-col items-start">
          <span className="inline-block bg-black px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white">
            Contact
          </span>
          <h1 className="five-title relative z-10 mt-5 inline-block cursor-default whitespace-nowrap border-[3px] border-black bg-brand-cream px-6 py-3.5 font-[family-name:var(--font-hero-serif)] text-[clamp(2.2rem,6.5vw,3.75rem)] font-semibold leading-none tracking-[-0.03em] text-black shadow-[6px_6px_0_#000] sm:px-8 sm:py-4">
            Get in touch.
          </h1>
          <p className="mt-8 max-w-xl text-[1rem] font-medium leading-relaxed text-brand-cream sm:text-[1.05rem]">
            Questions, review requests or partnerships. Send a message
            and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      <section className="border-t-2 border-black bg-brand-cream px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="mx-auto w-full max-w-[780px]">
          {success ? (
            <div>
              <span className="inline-block bg-black px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.12em] text-white">
                Sent
              </span>
              <p className="mt-4 font-[family-name:var(--font-hero-serif)] text-[1.5rem] font-medium tracking-[-0.01em] text-black">
                Thanks — we&apos;ll get back to you.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500 underline-offset-2 hover:text-black hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 120))}
                    required
                    autoComplete="name"
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@email.com"
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="mt-5 block">
                <span className={labelClass}>Topic</span>
                <select
                  value={topic}
                  onChange={(e) =>
                    setTopic(e.target.value as (typeof TOPICS)[number])
                  }
                  className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"><path fill="%23000" d="M1 1l5 5 5-5"/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-10`}
                >
                  {TOPICS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-5 block">
                <span className={labelClass}>Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  required
                  rows={7}
                  className={`${fieldClass} resize-y`}
                />
                <span className="mt-1.5 block text-right font-[family-name:var(--font-geist-mono)] text-[0.6rem] text-neutral-400">
                  {message.length} / 1000
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center border-2 border-black bg-brand-blue px-6 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#000] transition-[transform,box-shadow] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_#000]"
              >
                {submitting ? "Sending…" : "Send message →"}
              </button>

              {error ? (
                <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </>
  );
}
