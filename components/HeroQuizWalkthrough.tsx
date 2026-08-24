"use client";

import Link from "next/link";
import { useState } from "react";

type Level = "GCSE" | "A LEVEL";
type WalkStep = "intro" | "subjects" | "tier" | "quiz" | "complete";

type SubjectOption = {
  name: string;
  level: Level;
};

const SUBJECTS: SubjectOption[] = [
  { name: "Maths", level: "GCSE" },
  { name: "Biology", level: "GCSE" },
  { name: "Chemistry", level: "GCSE" },
  { name: "Physics", level: "GCSE" },
  { name: "Maths", level: "A LEVEL" },
  { name: "Biology", level: "A LEVEL" },
  { name: "Chemistry", level: "A LEVEL" },
  { name: "Physics", level: "A LEVEL" },
];

const DEMO_QUESTIONS = [
  {
    stepLabel: "Step 1 of 3 — a full-marks answer",
    question: "Solve for x: 3x - 7 = 14",
    marks: 2,
    tip: "Tip: This answer hits every point the mark scheme is looking for — full marks, no ambiguity.",
    answer: "x = 7, 7",
    stamp: "CORRECT",
    stampClass: "border-[#16A34A] bg-[#DCFCE7] text-[#16A34A]",
    scoreLine: "2/2 marks. Add 7 to both sides (3x = 21), then divide by 3 (x = 7).",
    aiLine: "AI marking found: matched — x = 7, 7 · missing — none",
    modelAnswer: "x = 7",
    modelClass: "border-[#16A34A] bg-[#F0FDF4]",
    summaryTitle: "Q1 (Full marks) — 2/2 marks.",
    summaryBody: "Add 7 to both sides (3x = 21), then divide by 3 (x = 7).",
  },
  {
    stepLabel: "Step 2 of 3 — an answer that earns partial credit",
    question: "Expand and simplify: (x + 4)(x - 2)",
    marks: 2,
    tip: "Tip: This one only partly matches the mark scheme. Watch how the AI explains exactly what's missing, not just the number.",
    answer: "x²",
    stamp: "INCORRECT",
    stampClass: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
    scoreLine: "1/2 marks. x² - 2x + 4x - 8 = x² + 2x - 8.",
    aiLine: "AI marking found: matched — x² · missing — 2x, 8",
    modelAnswer: "x² + 2x - 8",
    modelClass: "border-[#16A34A] bg-[#F0FDF4]",
    summaryTitle: "Q2 (Partial credit) — 1/2 marks.",
    summaryBody: "x² - 2x + 4x - 8 = x² + 2x - 8.",
  },
  {
    stepLabel: "Step 3 of 3 — an answer that misses the mark scheme",
    question: "Factorise fully: 6x² + 9x",
    marks: 2,
    tip: "Tip: This answer misses the mark scheme entirely — but you still get the full model answer, so you know exactly what to write next time.",
    answer: "I'm not sure how to answer this one.",
    stamp: "INCORRECT",
    stampClass: "border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]",
    scoreLine: "0/2 marks. Take out the highest common factor, 3x, leaving 3x(2x + 3).",
    aiLine: "AI marking found: matched — none · missing — 3x, 2x, +3",
    modelAnswer: "3x(2x + 3)",
    modelClass: "border-[#16A34A] bg-[#F0FDF4]",
    summaryTitle: "Q3 (Missed the mark scheme) — 0/2 marks.",
    summaryBody: "Take out the highest common factor, 3x, leaving 3x(2x + 3).",
  },
];

function levelBadgeClass(level: Level) {
  return level === "GCSE"
    ? "bg-[#7C3AED] text-white"
    : "bg-[#EA580C] text-white";
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 border border-black ${
            index === current ? "bg-[#FACC15]" : "bg-white"
          }`}
        />
      ))}
    </div>
  );
}

export default function HeroQuizWalkthrough() {
  const [step, setStep] = useState<WalkStep>("intro");
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(
    null
  );
  const [selectedTier, setSelectedTier] = useState<"Foundation" | "Higher" | null>(
    null
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [checked, setChecked] = useState(false);

  function resetWalkthrough() {
    setStep("intro");
    setSelectedSubject(null);
    setSelectedTier(null);
    setQuestionIndex(0);
    setChecked(false);
  }

  function startQuiz(subject: SubjectOption) {
    setSelectedSubject(subject);
    setStep("tier");
  }

  function beginQuestions(tier: "Foundation" | "Higher") {
    setSelectedTier(tier);
    setQuestionIndex(0);
    setChecked(false);
    setStep("quiz");
  }

  function handleCheckAi() {
    setChecked(true);
  }

  function handleNextOrScore() {
    if (questionIndex < DEMO_QUESTIONS.length - 1) {
      setQuestionIndex((i) => i + 1);
      setChecked(false);
      return;
    }
    setStep("complete");
  }

  const currentQuestion = DEMO_QUESTIONS[questionIndex];

  return (
    <div className="w-full max-w-lg border-2 border-black bg-white shadow-[8px_8px_0_#000]">
      {/* Intro */}
      {step === "intro" && (
        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-black sm:text-base">
            See it before you sign up
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-black/65 sm:text-sm">
            No sign-up needed — try a short demo and see how AI marking works on
            real exam-style questions.
          </p>
          <button
            type="button"
            onClick={() => setStep("subjects")}
            className="mt-5 w-full border-2 border-black bg-[#F2F0E4] p-4 text-left transition hover:bg-[#FFF7D6]"
          >
            <p className="text-sm font-extrabold text-black">Simulate a Quiz</p>
            <p className="mt-1 text-xs leading-relaxed text-black/70">
              Step through one example at a time and see it marked instantly —
              the stamp, the reasoning and the model answer.
            </p>
          </button>
        </div>
      )}

      {/* Subject picker */}
      {step === "subjects" && (
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={resetWalkthrough}
            className="mb-4 border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_#000] sm:text-xs"
          >
            ← Start over
          </button>
          <h3 className="text-sm font-extrabold text-black sm:text-base">
            Quiz walkthrough — pick a subject
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            {SUBJECTS.map((subject) => (
              <button
                key={`${subject.level}-${subject.name}`}
                type="button"
                onClick={() => startQuiz(subject)}
                className="border-2 border-black bg-[#F2F0E4] p-3 text-left transition hover:bg-[#FFF7D6]"
              >
                <span
                  className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase ${levelBadgeClass(subject.level)}`}
                >
                  {subject.level}
                </span>
                <p className="mt-2 text-sm font-extrabold text-black">
                  {subject.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tier picker */}
      {step === "tier" && selectedSubject && (
        <div className="p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setStep("subjects")}
            className="mb-4 border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase shadow-[2px_2px_0_#000] sm:text-xs"
          >
            ← Start over
          </button>
          <h3 className="text-sm font-extrabold text-black sm:text-base">
            {selectedSubject.name} ({selectedSubject.level}) — pick a tier
          </h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {(["Foundation", "Higher"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => beginQuestions(tier)}
                className="min-w-[7rem] flex-1 border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-black transition hover:bg-[#FFF7D6]"
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quiz questions */}
      {step === "quiz" && selectedSubject && selectedTier && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-black sm:text-xs">
              Quiz walkthrough — Q{questionIndex + 1}/3 · {selectedSubject.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="border-2 border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase">
                {selectedTier}
              </span>
              <ProgressDots current={questionIndex} />
            </div>
          </div>

          <div className="space-y-4 px-4 py-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#DC2626] sm:text-xs">
              {currentQuestion.stepLabel}
            </p>

            <p className="text-sm font-bold text-black sm:text-base">
              {currentQuestion.question}{" "}
              <span className="font-semibold text-black/70">
                {currentQuestion.marks} marks
              </span>
            </p>

            <div className="flex gap-2 rounded border border-dashed border-black bg-[#F2F0E4] px-3 py-2.5 text-xs leading-relaxed text-black/85">
              <span aria-hidden>💡</span>
              <p>{currentQuestion.tip}</p>
            </div>

            <div className="relative min-h-[4rem] border-2 border-black bg-[#F3F4F6] px-3 py-2.5 text-sm text-black">
              {currentQuestion.answer}
              {checked && (
                <span
                  className={`absolute right-2 top-2 -rotate-6 border-2 px-2 py-0.5 text-[10px] font-extrabold uppercase sm:text-xs ${currentQuestion.stampClass}`}
                >
                  {currentQuestion.stamp}
                </span>
              )}
            </div>

            {checked && (
              <div className="space-y-3 border-t border-dashed border-black/40 pt-3">
                <p className="text-xs leading-relaxed text-black sm:text-sm">
                  {currentQuestion.scoreLine}
                </p>
                <p className="text-[10px] text-black/70 sm:text-xs">
                  {currentQuestion.aiLine}
                </p>
                <div
                  className={`border-2 p-3 text-xs sm:text-sm ${currentQuestion.modelClass}`}
                >
                  <p className="text-[10px] font-bold uppercase text-[#16A34A]">
                    Model answer — full marks
                  </p>
                  <p className="mt-1 font-semibold text-black">
                    {currentQuestion.modelAnswer}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t-2 border-black px-4 py-3">
            {!checked ? (
              <button
                type="button"
                onClick={handleCheckAi}
                className="border-2 border-black bg-[#DC2626] px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#000] sm:text-xs"
              >
                Check with AI
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextOrScore}
                className="border-2 border-black bg-[#1D4ED8] px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#000] sm:text-xs"
              >
                {questionIndex < DEMO_QUESTIONS.length - 1
                  ? "Next step →"
                  : "See my score"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Complete */}
      {step === "complete" && (
        <div className="p-5 sm:p-6">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/70 sm:text-xs">
            Walkthrough complete
          </p>
          <p className="mt-2 text-center text-4xl font-extrabold text-black">
            3/6
          </p>

          <div className="mt-5 space-y-4 border-t border-dashed border-black/40 pt-4">
            {DEMO_QUESTIONS.map((q) => (
              <div key={q.summaryTitle}>
                <p className="text-xs font-extrabold text-black sm:text-sm">
                  {q.summaryTitle}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-black/75 sm:text-sm">
                  {q.summaryBody}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-black/65 sm:text-sm">
            You just saw a full-marks answer, a partial-credit answer, and a
            missed answer — that&apos;s the same AI marking and model answers
            you&apos;ll get on every question once subscribed.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="inline-flex flex-1 items-center justify-center border-2 border-black bg-[#1D4ED8] px-4 py-2.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#000] sm:text-xs"
            >
              Create a free account
            </Link>
            <button
              type="button"
              onClick={resetWalkthrough}
              className="inline-flex flex-1 items-center justify-center border-2 border-black bg-white px-4 py-2.5 text-[10px] font-bold uppercase text-black shadow-[3px_3px_0_#000] sm:text-xs"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
