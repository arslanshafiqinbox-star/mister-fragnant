"use client";
import { useState } from "react";

export default function TestCase() {
    const [showReview, setShowReview] = useState(false);

    const handleShowReview = () => {
        setShowReview(true);
    }

  return (
    <section className="bg-[#27e4d7] border-t-4 border-black py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black">
              Test case
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-black">
              Practice Interview Scenarios
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/80">
              Read the case on the right, write your answer on the left, and
              then run a quick self‑check with our hints and solution notes.
            </p>
          </div>
        </div>

        {/* Main split area */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Left: answer editor */}
          <div className="relative">
            <div className="absolute left-2 top-2 h-full w-full bg-black" />
            <div className="relative border-2 border-black bg-[#ffc928] p-5">
              <h3 className="mb-3 text-lg font-semibold text-black">
                Your Answer
              </h3>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-black/70">
                Draft your solution
              </label>
              <textarea
                rows={8}
                className="mb-4 w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-[#fff7d6]"
                placeholder="Write how you would approach this case..."
              />

              <div className="flex flex-wrap items-center gap-3">
                  {/* <input
                    type="text"
                    className="h-10 flex-1 min-w-[160px] border-2 border-black bg-white px-3 text-sm outline-none focus:bg-[#fff7d6]"
                    placeholder="Optional: key metric / final value"
                  /> */}
                <button
                  type="button"
                  onClick={handleShowReview}
                  className="inline-flex items-center justify-center border-2 border-black bg-[#29e3dd] px-6 py-2 text-sm font-semibold text-black shadow-[4px_4px_0_#000] transition hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000]"
                >
                  Run Test
                </button>
              </div>
            </div>
          </div>

          {/* Right: case description + hints */}
          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <h3 className="text-lg font-semibold text-black">
              Case 01 – Course Recommendation Puzzle
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-black/85">
              You are building an AI assistant for Coursefy. A student says:
              &quot;I know a bit of Python and design, and I only have 5 hours
              this week. Which course should I start with?&quot; You have access
              only to the course titles and estimated durations shown on the
              homepage.
            </p>

            <div className="mt-4 rounded-md border border-dashed border-black bg-[#fffbe6] p-3 text-sm">
              <p className="font-semibold text-black">Hints</p>
              <ul className="mt-1 list-disc pl-5 text-black/85">
                <li>Think about how you would rank courses by relevance.</li>
                <li>Consider simple rules before complex algorithms.</li>
                <li>
                  Explain how you would communicate trade‑offs to the student.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom evaluation strip */}
        {showReview && (
        <div className="mt-10 border-2 border-black bg-white px-6 py-5 shadow-[6px_6px_0_#000]">
          <div className="mb-3 flex items-center gap-2 text-black">
            <span className="flex gap-1">
              8/10
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Review
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-black">
                Actual Answer
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                This area can describe a strong reference solution or outline
                the key steps an ideal answer would include.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-black">
                Shortcomings
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-black/80">
                Use this space to note what was missing from your attempt, such
                as edge cases, unclear communication, or missing constraints.
              </p>
            </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

