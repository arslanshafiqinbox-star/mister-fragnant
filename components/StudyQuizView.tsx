"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  ideal_answer: string;
  marks: number;
  course_id: string;
  course_name: string;
  subtopic_id?: string;
  subtopic_name?: string;
  topic_id?: string;
  topic_name?: string;
  created_at: string;
  updated_at: string;
};

type EvaluateApiResponse = {
  rating?: number;
  shortComing?: string;
  data?: { rating?: number; shortComing?: string };
};

const RATING_SCALE = 10;

function normalizeRatingToMarks(ratingOutOf10: number, maxMarks: number): number {
  if (!Number.isFinite(maxMarks) || maxMarks <= 0) return ratingOutOf10;
  return (ratingOutOf10 / RATING_SCALE) * maxMarks;
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : (Math.round(value * 10) / 10).toString();
}

/** Build truncated question nav: e.g. 1 2 3 4 5 … 99 */
function getQuestionNavItems(
  currentIndex: number,
  total: number,
  siblingCount = 2
): Array<number | "ellipsis"> {
  if (total <= 0) return [];
  if (total <= siblingCount * 2 + 3) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const first = 0;
  const last = total - 1;
  const left = Math.max(currentIndex - siblingCount, first + 1);
  const right = Math.min(currentIndex + siblingCount, last - 1);

  const items: Array<number | "ellipsis"> = [first];

  if (left > first + 1) {
    items.push("ellipsis");
  } else {
    for (let i = first + 1; i < left; i += 1) items.push(i);
  }

  for (let i = left; i <= right; i += 1) items.push(i);

  if (right < last - 1) {
    items.push("ellipsis");
  } else {
    for (let i = right + 1; i < last; i += 1) items.push(i);
  }

  items.push(last);
  return items;
}

const actionBtn =
  "inline-flex items-center justify-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0";

type StudyQuizViewProps = {
  domainId: string;
  courseId: string | null;
  courseName: string;
  topicId: string | null;
  topicName: string;
  topicTag: string;
  subtopicId: string | null;
  subtopicName: string | null;
  hasNextSubtopic?: boolean;
  allSubtopicsDone?: boolean;
  isSubmittingSubtopic?: boolean;
  submitSubtopicError?: string;
  onSubmitSubtopic?: () => void | Promise<void>;
};

export default function StudyQuizView({
  courseName,
  topicName,
  topicTag,
  subtopicId,
  subtopicName,
  hasNextSubtopic = false,
  allSubtopicsDone = false,
  isSubmittingSubtopic = false,
  submitSubtopicError = "",
  onSubmitSubtopic,
}: StudyQuizViewProps) {
  const [apiQuestions, setApiQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationByIndex, setEvaluationByIndex] = useState<
    Record<number, EvaluateApiResponse | null>
  >({});
  const [showReviewByIndex, setShowReviewByIndex] = useState<
    Record<number, boolean>
  >({});
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [assistantError, setAssistantError] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      if (!subtopicId) {
        setApiQuestions([]);
        setIsLoading(false);
        setErrorMessage("");
        setCurrentIndex(0);
        setAnswers({});
        setEvaluationByIndex({});
        setShowReviewByIndex({});
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setCurrentIndex(0);
      setAnswers({});
      setEvaluationByIndex({});
      setShowReviewByIndex({});
      setEvaluationError("");
      setAssistantMessages([]);
      setAssistantQuery("");
      setAssistantError("");
      setAssistantOpen(false);

      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/questions?subtopicId=${encodeURIComponent(subtopicId)}`,
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
          setApiQuestions(
            Array.isArray(result?.data?.questions) ? result.data.questions : []
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to fetch questions."
          );
          setApiQuestions([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [subtopicId]);

  const questions = apiQuestions;
  const displayTag = (subtopicName || topicTag || "TOPIC").toUpperCase();
  const displayLabel = courseName || "Tier";

  const total = questions.length;
  const activeQuestion = questions[currentIndex];
  const canGoBack = currentIndex > 0;
  const isLastQuestion = total > 0 && currentIndex >= total - 1;
  const answer = answers[currentIndex] ?? "";

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    setShowReviewByIndex((prev) => ({ ...prev, [currentIndex]: false }));
    setEvaluationByIndex((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
    setEvaluationError("");
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setEvaluationError("");
    setAssistantMessages([]);
    setAssistantQuery("");
    setAssistantError("");
  }

  async function handleEvaluate() {
    if (!activeQuestion) return;

    if (!answer.trim()) {
      setEvaluationError("Write an answer before evaluating.");
      setShowReviewByIndex((prev) => ({ ...prev, [currentIndex]: true }));
      return;
    }

    setIsEvaluating(true);
    setEvaluationError("");

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idealAnswer: activeQuestion.ideal_answer,
          myAnswer: answer.trim(),
          question: activeQuestion.question,
        }),
      });

      const result = (await response.json()) as EvaluateApiResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result?.message || "Failed to evaluate answer.");
      }

      setEvaluationByIndex((prev) => ({ ...prev, [currentIndex]: result }));
      setShowReviewByIndex((prev) => ({ ...prev, [currentIndex]: true }));

      const rating =
        typeof result.rating === "number"
          ? result.rating
          : typeof result.data?.rating === "number"
            ? result.data.rating
            : null;
      const shortcomings =
        typeof result.shortComing === "string"
          ? result.shortComing
          : typeof result.data?.shortComing === "string"
            ? result.data.shortComing
            : "";
      const obtainedMarks =
        rating !== null
          ? normalizeRatingToMarks(rating, activeQuestion.marks)
          : 0;

      const accessToken = sessionStorage.getItem("accessToken");
      const resultsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/results`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            questionId: activeQuestion.id,
            userAnswer: answer.trim(),
            obtainedMarks,
            shortcomings,
          }),
        }
      );
      const resultsJson = await resultsRes.json().catch(() => null);
      if (!resultsRes.ok) {
        throw new Error(
          resultsJson?.message || "Evaluation saved locally but failed to post result."
        );
      }
    } catch (error) {
      setEvaluationError(
        error instanceof Error ? error.message : "Unable to evaluate answer."
      );
      setShowReviewByIndex((prev) => ({ ...prev, [currentIndex]: true }));
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleAssistantSubmit(
    event?: React.FormEvent,
    preset?: string
  ) {
    event?.preventDefault();
    const query = (preset ?? assistantQuery).trim();
    if (!query || isAssistantLoading) return;

    const history = assistantMessages;
    setAssistantMessages((prev) => [...prev, { role: "user", content: query }]);
    setAssistantQuery("");
    setIsAssistantLoading(true);
    setAssistantError("");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestion?.question ?? "",
          idealAnswer: activeQuestion?.ideal_answer ?? "",
          topic: topicName,
          userAnswer: answer.trim(),
          query,
          history,
        }),
      });

      const result = (await response.json()) as {
        reply?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result?.message || "Assistant request failed.");
      }

      setAssistantMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.reply ?? "Try asking that another way.",
        },
      ]);
    } catch (error) {
      setAssistantError(
        error instanceof Error ? error.message : "Unable to reach the assistant."
      );
    } finally {
      setIsAssistantLoading(false);
    }
  }

  const evaluationResult = evaluationByIndex[currentIndex] ?? null;
  const showReview = showReviewByIndex[currentIndex] ?? false;
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
    activeQuestion && extractedRating !== null
      ? normalizeRatingToMarks(extractedRating, activeQuestion.marks)
      : null;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F2F0E4]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-[#F2F0E4] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-sm font-extrabold uppercase tracking-wide text-black sm:text-base">
            Quiz – Question {total === 0 ? 0 : currentIndex + 1} of {total}
          </h1>
          <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-bold uppercase">
            {displayLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {getQuestionNavItems(currentIndex, total).map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-7 min-w-7 items-center justify-center px-1 text-xs font-bold text-black/50"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToQuestion(item)}
                className={`flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold ${
                  item === currentIndex
                    ? "bg-white ring-2 ring-inset ring-[#DC2626]"
                    : "bg-white"
                }`}
              >
                {item + 1}
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        {!subtopicId ? (
          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
            <p className="text-sm font-semibold text-black">
              {allSubtopicsDone
                ? "You've completed every subtopic in this tier."
                : "Select a subtopic from the sidebar to load questions."}
            </p>
            <p className="mt-2 text-sm text-black/65">
              {allSubtopicsDone
                ? "Pick another tier or topic from the sidebar to keep practising."
                : "Choose a tier, then a topic — the first subtopic loads automatically."}
            </p>
          </div>
        ) : isLoading ? (
          <p className="text-sm text-black/70">Loading questions...</p>
        ) : errorMessage ? (
          <p className="text-sm text-[#DC2626]">{errorMessage}</p>
        ) : !activeQuestion ? (
          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
            <p className="text-sm font-semibold text-black">
              No questions found for this subtopic.
            </p>
          </div>
        ) : (
          <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase">
                {displayTag}
              </span>
              <span className="border-2 border-black bg-[#FACC15] px-2 py-0.5 text-[10px] font-bold">
                {activeQuestion.marks} marks
              </span>
            </div>

            <p className="text-base font-extrabold leading-snug text-black sm:text-lg">
              {activeQuestion.question}
            </p>

            <textarea
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer here..."
              className="mt-5 w-full resize-y border-2 border-black bg-white px-3 py-2.5 text-sm outline-none placeholder:text-black/35 focus:bg-[#FFF7D6]"
            />

            <div className="mt-4 border-t-2 border-black pt-4">
              <span className="inline-block pr-[3px] pb-[3px]">
                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={!activeQuestion || isEvaluating}
                  className="inline-flex items-center justify-center border-2 border-black bg-[#1D4ED8] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-[3px_3px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] disabled:opacity-50"
                >
                  {isEvaluating ? "Evaluating..." : "Evaluate"}
                </button>
              </span>
            </div>

            {showReview && (
              <div className="mt-4 border-t-2 border-dashed border-black/30 pt-4">
                <div className="mb-4 flex items-center gap-2 text-black">
                  <span className="text-base font-extrabold">
                    {normalizedScore !== null && activeQuestion
                      ? `${formatScore(normalizedScore)}/${activeQuestion.marks}`
                      : activeQuestion
                        ? "—"
                        : "0/0"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Review
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-black">
                      Actual answer
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-black/80">
                      {activeQuestion?.ideal_answer || "No model answer found."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-black">
                      Shortcomings
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-black/80">
                      {extractedShortComing
                        ? extractedShortComing
                        : evaluationError
                          ? evaluationError
                          : answer.trim()
                            ? "Compare your answer with the model answer above."
                            : "Write an answer and click Evaluate."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {assistantOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[70vh] flex-col border-t-2 border-black bg-white shadow-[0_-8px_0_rgba(0,0,0,0.06)] sm:inset-x-auto sm:right-4 sm:bottom-20 sm:max-h-[min(70vh,520px)] sm:w-[min(100%-2rem,380px)] sm:border-2 sm:shadow-[6px_6px_0_#000]">
          <div className="flex items-center justify-between gap-2 border-b-2 border-black bg-[#DC2626] px-4 py-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-white">
                AI Assistant
              </p>
              <p className="text-[10px] text-white/80">
                Ask anything about this question
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="flex h-7 w-7 items-center justify-center border-2 border-black bg-white text-sm font-bold leading-none text-black"
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F2F0E4] px-3 py-3">
            {assistantMessages.length === 0 && !isAssistantLoading ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-black/65">
                  Explain concepts, check your draft, ask for steps, or get the
                  full model answer — whatever helps you learn this question.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Explain this question simply",
                    "Give me step-by-step hints",
                    "Show the full model answer",
                    "Review my draft answer",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAssistantSubmit(undefined, chip)}
                      className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black shadow-[2px_2px_0_#000] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {assistantMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[95%] border-2 border-black px-3 py-2 text-sm leading-relaxed shadow-[2px_2px_0_#000] ${
                  message.role === "user"
                    ? "ml-auto bg-[#1D4ED8] text-white"
                    : "mr-auto bg-white text-black"
                }`}
              >
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wide opacity-70">
                  {message.role === "user" ? "You" : "Assistant"}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}

            {isAssistantLoading ? (
              <div className="mr-auto max-w-[95%] border-2 border-black bg-white px-3 py-2 text-sm text-black/60 shadow-[2px_2px_0_#000]">
                Thinking…
              </div>
            ) : null}

            {assistantError ? (
              <p className="border-2 border-black bg-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#DC2626]">
                {assistantError}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={handleAssistantSubmit}
            className="flex gap-2 border-t-2 border-black bg-white p-3"
          >
            <input
              value={assistantQuery}
              onChange={(e) => setAssistantQuery(e.target.value)}
              placeholder="Ask anything about this question…"
              className="min-w-0 flex-1 border-2 border-black bg-[#F2F0E4] px-3 py-2 text-sm outline-none placeholder:text-black/40 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isAssistantLoading || !assistantQuery.trim()}
              className="shrink-0 border-2 border-black bg-[#1D4ED8] px-3 py-2 text-[10px] font-bold uppercase text-white shadow-[2px_2px_0_#000] disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-[#F2F0E4] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => goToQuestion(currentIndex - 1)}
            className={actionBtn}
          >
            ← Back
          </button>
          <button
            type="button"
            disabled={isLastQuestion}
            onClick={() => goToQuestion(currentIndex + 1)}
            className={actionBtn}
          >
            Next →
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block pr-[3px] pb-[3px]">
            <button
              type="button"
              onClick={() => setAssistantOpen((open) => !open)}
              className="inline-flex items-center gap-2 border-2 border-black bg-[#DC2626] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000]"
            >
              <span aria-hidden>☁</span>
              AI Assistant
            </button>
          </span>
          {isLastQuestion && subtopicId ? (
            <span className="inline-block pr-[3px] pb-[3px]">
              <button
                type="button"
                disabled={isSubmittingSubtopic}
                onClick={onSubmitSubtopic}
                className="inline-flex items-center justify-center border-2 border-black bg-[#1D4ED8] px-5 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingSubtopic
                  ? "Submitting..."
                  : hasNextSubtopic
                    ? "Submit subtopic →"
                    : "Submit subtopic"}
              </button>
            </span>
          ) : null}
          {submitSubtopicError ? (
            <p className="w-full text-xs font-semibold text-[#DC2626]">
              {submitSubtopicError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
