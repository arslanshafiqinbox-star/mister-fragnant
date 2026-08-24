"use client";

import { useState } from "react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="border-b-2 border-black bg-[#F2F0E4] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC2626] sm:text-xs">
            Contact us
          </p>
          <h1 className="mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-3xl lg:text-4xl">
            Let&apos;s talk about your next exam
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-black/70">
            Questions about subjects, plans, or AI marking? Send a message and
            we&apos;ll get back to you soon.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                Email
              </p>
              <a
                href="mailto:support@grademark.com"
                className="mt-1 block text-sm font-semibold text-black underline decoration-black/40 underline-offset-2"
              >
                support@grademark.com
              </a>
            </div>
            <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                Phone
              </p>
              <p className="mt-1 text-sm font-semibold text-black">
                +1 (555) 123-4567
              </p>
            </div>
            <div className="border-2 border-black bg-[#FACC15] p-5 shadow-[6px_6px_0_#000]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-black/70">
                Response time
              </p>
              <p className="mt-1 text-sm font-semibold text-black">
                Usually within one working day
              </p>
            </div>
          </div>

          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-black">
              Send us a message
            </h2>

            {submitted ? (
              <p className="mt-4 border-2 border-black bg-[#F2F0E4] px-4 py-3 text-sm font-semibold text-black">
                Thanks — your message is ready to send. We&apos;ll be in touch
                soon.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="name"
                      className="text-[10px] font-bold uppercase tracking-wide text-black"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="h-10 border-2 border-black bg-[#F2F0E4] px-3 text-sm outline-none focus:bg-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-[10px] font-bold uppercase tracking-wide text-black"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="h-10 border-2 border-black bg-[#F2F0E4] px-3 text-sm outline-none focus:bg-white"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="subject"
                    className="text-[10px] font-bold uppercase tracking-wide text-black"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    className="h-10 border-2 border-black bg-[#F2F0E4] px-3 text-sm outline-none focus:bg-white"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="message"
                    className="text-[10px] font-bold uppercase tracking-wide text-black"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="border-2 border-black bg-[#F2F0E4] px-3 py-2 text-sm outline-none focus:bg-white"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center border-2 border-black bg-[#1D4ED8] px-6 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] sm:text-xs"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
