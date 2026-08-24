"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type QuestionResult = {
  id: string;
  userAnswer: string;
  obtainedMarks: number;
  shortcomings: string;
  createdAt: string;
};

type QuestionItem = {
  id: string;
  question: string;
  idealAnswer: string;
  totalMarks: number;
  answered: boolean;
  result: QuestionResult | null;
};

type SubtopicItem = {
  id: string;
  subtopicName: string;
  questions: QuestionItem[];
};

type TopicItem = {
  id: string;
  topicName: string;
  subtopics: SubtopicItem[];
};

type CourseDetail = {
  id: string;
  courseName: string;
  domainId: string;
  domainName: string;
};

type Summary = {
  totalTopics: number;
  totalSubtopics: number;
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  totalMarks: number;
  obtainedMarks: number;
  scorePercentage: number;
};

function formatScore(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : (Math.round(value * 10) / 10).toString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ResultsCourseDetail() {
  const params = useParams();
  const router = useRouter();
  const courseId = typeof params.id === "string" ? params.id : "";

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRetaking, setIsRetaking] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetail() {
      if (!courseId) return;

      setIsLoading(true);
      setErrorMessage("");

      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/results/courses/${encodeURIComponent(courseId)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || result?.message || "Failed to load course results."
          );
        }

        if (!isMounted) return;

        setCourse(result?.data?.course ?? null);
        setSummary(result?.data?.summary ?? null);
        setTopics(Array.isArray(result?.data?.topics) ? result.data.topics : []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load course results."
          );
          setCourse(null);
          setSummary(null);
          setTopics([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  async function handleRetake() {
    if (!course || isRetaking) return;

    setIsRetaking(true);
    setErrorMessage("");

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/results/courses/${encodeURIComponent(course.id)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.error || result?.message || "Failed to reset course results."
        );
      }

      router.push(
        `/dashboard/study?subject=${encodeURIComponent(course.domainId)}`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to retake course."
      );
      setIsRetaking(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/results"
        className="inline-flex items-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000]"
      >
        ← Results
      </Link>

      {isLoading ? (
        <p className="text-sm text-black/65">Loading course results...</p>
      ) : errorMessage ? (
        <p className="text-sm text-[#DC2626]">{errorMessage}</p>
      ) : !course || !summary ? (
        <p className="text-sm text-black/65">No results found for this course.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
                {course.domainName}
              </h1>
              <p className="mt-1 text-sm text-black/65">
                {course.courseName} · Quiz results
              </p>
            </div>
            <button
              type="button"
              disabled={isRetaking}
              onClick={handleRetake}
              className="inline-flex items-center border-2 border-black bg-[#1D4ED8] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRetaking ? "Resetting..." : "Retake"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Score",
                value: `${formatScore(summary.obtainedMarks)}/${formatScore(summary.totalMarks)}`,
              },
              {
                label: "Percentage",
                value: `${formatScore(summary.scorePercentage)}%`,
              },
              {
                label: "Answered",
                value: `${summary.answeredQuestions}/${summary.totalQuestions}`,
              },
              {
                label: "Topics",
                value: `${summary.totalTopics} · ${summary.totalSubtopics} subtopics`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border-2 border-black bg-white px-3 py-3 shadow-[4px_4px_0_#000]"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/55">
                  {stat.label}
                </p>
                <p className="mt-1 text-sm font-extrabold text-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {(["answered", "unanswered"] as const).map((section) => {
              const sectionTopics = topics
                .map((topic) => ({
                  ...topic,
                  subtopics: (topic.subtopics ?? [])
                    .map((subtopic) => ({
                      ...subtopic,
                      questions: (subtopic.questions ?? []).filter((q) =>
                        section === "answered" ? q.answered : !q.answered
                      ),
                    }))
                    .filter((subtopic) => subtopic.questions.length > 0),
                }))
                .filter((topic) => topic.subtopics.length > 0);

              if (sectionTopics.length === 0) return null;

              return (
                <div key={section} className="space-y-6">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide text-black">
                    {section === "answered" ? "Answered" : "Unanswered"}
                  </h2>

                  {sectionTopics.map((topic) => (
                    <section key={`${section}-${topic.id}`} className="space-y-3">
                      <h3 className="border-b-2 border-black pb-2 text-xs font-extrabold uppercase tracking-wide text-black/80">
                        {topic.topicName}
                      </h3>

                      {topic.subtopics.map((subtopic) => (
                        <div key={subtopic.id} className="space-y-3 pl-0 sm:pl-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wide text-black/60">
                            {subtopic.subtopicName}
                          </h4>

                          {subtopic.questions.map((q, index) => (
                            <article
                              key={q.id}
                              className="border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000]"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-black">
                                  <span className="mr-2 text-black/45">
                                    Q{index + 1}.
                                  </span>
                                  {q.question}
                                </p>
                                <span
                                  className={`shrink-0 border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase ${
                                    q.answered
                                      ? "bg-[#16A34A] text-white"
                                      : "bg-[#FFF7D6] text-black"
                                  }`}
                                >
                                  {q.answered
                                    ? `${formatScore(q.result?.obtainedMarks ?? 0)}/${formatScore(q.totalMarks)}`
                                    : "Unanswered"}
                                </span>
                              </div>

                              {q.answered && q.result ? (
                                <div className="mt-3 space-y-2 border-t border-black/15 pt-3 text-sm">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                                      Your answer
                                    </p>
                                    <p className="mt-0.5 text-black">
                                      {q.result.userAnswer}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                                      Ideal answer
                                    </p>
                                    <p className="mt-0.5 text-black">{q.idealAnswer}</p>
                                  </div>
                                  {q.result.shortcomings ? (
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                                        Feedback
                                      </p>
                                      <p className="mt-0.5 text-black/80">
                                        {q.result.shortcomings}
                                      </p>
                                    </div>
                                  ) : null}
                                  <p className="text-[10px] text-black/45">
                                    Submitted {formatDate(q.result.createdAt)}
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3 border-t border-black/15 pt-3 text-sm">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-black/50">
                                    Ideal answer
                                  </p>
                                  <p className="mt-0.5 text-black/70">{q.idealAnswer}</p>
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
