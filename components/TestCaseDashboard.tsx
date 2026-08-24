"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardCourse } from "@/components/DashboardCourseContext";

const CASE_STUDIES = [
  {
    id: 1,
    title: "Course Recommendation Puzzle",
    description:
      'You are building an AI assistant for Coursefy. A student says: "I know a bit of Python and design, and I only have 5 hours this week. Which course should I start with?" You have access only to the course titles and estimated durations shown on the homepage.',
    hints: [
      "Think about how you would rank courses by relevance.",
      "Consider simple rules before complex algorithms.",
      "Explain how you would communicate trade‑offs to the student.",
    ],
  },
  {
    id: 2,
    title: "Onboarding Drop-off",
    description:
      "40% of new users leave before completing the first lesson. Analytics show a spike of exits on the Welcome screen and the first quiz. Diagnose possible reasons and propose at least two experiments to improve completion of the first lesson.",
    hints: [
      "Consider expectations and time to value.",
      "Think about clarity of next actions.",
      "What would you instrument (events, funnels)?",
    ],
  },
  {
    id: 3,
    title: "Feature Prioritization You have three feature requests You have three feature requests ",
    description:
      "You have three feature requests: dark mode, offline progress sync, and a community forum. Engineering can only ship one this quarter. How do you decide, and how do you communicate the decision to users who asked for the others?",
    hints: [
      "Define criteria (impact, effort, strategic fit).",
      "Consider how to say no clearly.",
      "Think about feedback loops for future prioritization.",
    ],
  },
];

/** Evaluate API returns `rating` on a 0–10 scale; map to the question's max marks. */
const RATING_SCALE = 10;

function normalizeRatingToMarks(ratingOutOf10: number, maxMarks: number): number {
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
    return ratingOutOf10;
  }
  return (ratingOutOf10 / RATING_SCALE) * maxMarks;
}

function formatScoreDisplay(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return (Math.round(value * 10) / 10).toString();
}

export default function TestCaseDashboard() {
  const { selectedCourseId } = useDashboardCourse();
  const [showReview, setShowReview] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState<
    {
      id: string;
      question: string;
      ideal_answer: string;
      marks: number;
      course_id: string;
      course_name: string;
      created_at: string;
      updated_at: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  type EvaluateApiResponse = {
    rating?: number;
    shortComing?: string;
    data?: { rating?: number; shortComing?: string };
  };
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluateApiResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      if (!selectedCourseId) {
        setQuestions([]);
        setCaseIndex(0);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setShowReview(false);
      setAnswer("");
      setCaseIndex(0);

      try {
        const accessToken =
          typeof window !== "undefined"
            ? sessionStorage.getItem("accessToken")
            : null;

        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/questions?courseId=${encodeURIComponent(selectedCourseId)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load questions.");
        }

        if (isMounted) {
          setQuestions(
            Array.isArray(result?.data?.questions) ? result.data.questions : []
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to fetch questions."
          );
          setQuestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    setShowReview(false);
    setEvaluationError("");
    setEvaluationResult(null);
  }, [caseIndex]);

  const caseStudy = CASE_STUDIES[caseIndex % CASE_STUDIES.length];
  const question = questions[caseIndex];
  const canGoPrev = caseIndex > 0;
  const canGoNext = caseIndex < questions.length - 1;

  const handleShowReview = async () => {
    if (!question) {
      return;
    }

    setIsEvaluating(true);
    setEvaluationError("");
    setEvaluationResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idealAnswer: question.ideal_answer,
          myAnswer: answer.trim(),
          question: question.question,
        }),
      });

      const result = (await response.json()) as EvaluateApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result?.message || "Failed to evaluate answer.");
      }

      setEvaluationResult(result);
      setShowReview(true);
    } catch (error) {
      setEvaluationError(
        error instanceof Error ? error.message : "Unable to evaluate answer."
      );
      setShowReview(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const data = evaluationResult?.data;
  const extractedRating =
    typeof evaluationResult?.rating === "number"
      ? evaluationResult.rating
      : typeof data?.rating === "number"
        ? data.rating
        : null;
  const extractedShortComing =
    typeof evaluationResult?.shortComing === "string"
      ? evaluationResult.shortComing
      : typeof data?.shortComing === "string"
        ? data.shortComing
        : "";

  const normalizedScore =
    question && extractedRating !== null
      ? normalizeRatingToMarks(extractedRating, question.marks)
      : null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black">
              START NOW
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-black">
              Practice Interview Scenarios
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/80">
              <span className="lg:hidden">
                Read the question first, write your answer below, then run a
                test to see review and shortcomings.
              </span>
              <span className="hidden lg:inline">
                Read the case on the right, write your answer on the left, and
                then run a quick self‑check with our hints and solution notes.
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Mobile: question → answer → review. lg: answer | question, review full width */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Question + hints: first on small screens, right column on lg */}
            <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] lg:col-start-2 lg:row-start-1">
              <div className="mb-2 flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setCaseIndex((i) => Math.max(0, i - 1))}
                  disabled={!canGoPrev}
                  className="rounded text-black transition hover:bg-[#ffe066] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous case"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="min-w-[4rem] text-center text-sm font-semibold text-black">
                  {questions.length === 0
                    ? "0 / 0"
                    : `${caseIndex + 1} / ${questions.length}`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCaseIndex((i) =>
                      Math.min(questions.length - 1, i + 1)
                    )
                  }
                  disabled={!canGoNext}
                  className="rounded text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next case"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-black">
                  {question
                    ? `Question ${String(caseIndex + 1).padStart(2, "0")} - ${question.course_name}`
                    : "No question loaded"}
                </h3>
              </div>
              {isLoading ? (
                <p className="mt-3 text-sm leading-relaxed text-black/85">
                  Loading questions...
                </p>
              ) : errorMessage ? (
                <p className="mt-3 text-sm leading-relaxed text-red-700">
                  {errorMessage}
                </p>
              ) : question ? (
                <p className="mt-3 text-sm leading-relaxed text-black/85">
                  {question.question}
                </p>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-black/85">
                  Select a course from the sidebar to load questions.
                </p>
              )}

              <div className="mt-4 rounded-md border border-dashed border-black bg-[#fffbe6] p-3 text-sm">
                <p className="font-semibold text-black">Hints</p>
                <ul className="mt-1 list-disc pl-5 text-black/85">
                  {caseStudy.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Answer editor: second on small screens, left column on lg */}
            <div className="relative lg:col-start-1 lg:row-start-1">
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
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShowReview}
                    disabled={!question || isEvaluating}
                    className="inline-flex items-center justify-center border-2 border-black bg-[#29e3dd] px-6 py-2 text-sm font-semibold text-black shadow-[4px_4px_0_#000] transition hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000]"
                  >
                    {isEvaluating ? "Evaluating..." : "Run Test"}
                  </button>
                  {evaluationError ? (
                    <p className="text-sm font-medium text-red-700">
                      {evaluationError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Review + shortcomings: third on small screens, full width below grid on lg */}
          {showReview && (
            <div className="border-2 border-black bg-white px-6 py-5 shadow-[6px_6px_0_#000]">
              <div className="mb-3 flex items-center gap-2 text-black">
                <span className="flex gap-1 font-semibold">
                  {question && normalizedScore !== null
                    ? `${formatScoreDisplay(normalizedScore)} /${question.marks}`
                    : question
                      ? "—"
                      : "0/0"}
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
                    {question?.ideal_answer || "No ideal answer found."}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-black">
                    Shortcomings
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-black/80">
                    {extractedShortComing
                      ? extractedShortComing
                      : evaluationError
                        ? evaluationError
                        : answer.trim()
                          ? "Compare your draft with the ideal answer and note missing concepts or unclear reasoning."
                          : "You did not write an answer yet. Type your answer and run the test again."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

