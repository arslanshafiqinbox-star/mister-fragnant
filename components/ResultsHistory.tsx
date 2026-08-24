"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ResultCourse = {
  courseId: string;
  courseName: string;
  domainId: string;
  domainName: string;
  typeExam?: string;
  examType?: string;
};

const actionBtn =
  "inline-flex shrink-0 items-center justify-center border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-[3px_3px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:opacity-60";

const retakeBtn = `${actionBtn} bg-white text-black`;
const viewBtn = `${actionBtn} bg-[#1D4ED8] text-white`;

export default function ResultsHistory() {
  const router = useRouter();
  const [courses, setCourses] = useState<ResultCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retakingId, setRetakingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/results/courses`,
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
            result?.error || result?.message || "Failed to load results."
          );
        }

        const list: ResultCourse[] = Array.isArray(result?.data?.courses)
          ? result.data.courses
          : [];

        if (isMounted) setCourses(list);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load results."
          );
          setCourses([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRetake(course: ResultCourse) {
    if (retakingId) return;

    setRetakingId(course.courseId);
    setErrorMessage("");

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/results/courses/${encodeURIComponent(course.courseId)}`,
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
      setRetakingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000]"
      >
        ← Subjects
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
          Results history
        </h1>
        <p className="mt-1 text-sm text-black/65">
          Courses you&apos;ve practised — pick one to review or retake.
        </p>
      </div>

      {errorMessage && !isLoading ? (
        <p className="text-sm text-[#DC2626]">{errorMessage}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-black/65">Loading results...</p>
      ) : courses.length === 0 && !errorMessage ? (
        <p className="text-sm text-black/65">No results yet. Complete a quiz to see them here.</p>
      ) : courses.length > 0 ? (
        <div className="overflow-x-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-black">
                {["Subject", "Tier", "Type exam", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-wide text-black last:pr-0 sm:text-xs"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.courseId}
                  className="border-b border-black/15 last:border-b-0"
                >
                  <td className="py-3.5 pr-4 text-sm text-black">
                    {course.domainName}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-black">
                    {course.courseName}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-black">
                    {course.typeExam || course.examType || "Quiz"}
                  </td>
                  <td className="py-3.5 pr-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block pr-[3px] pb-[3px]">
                        <button
                          type="button"
                          disabled={retakingId === course.courseId}
                          onClick={() => handleRetake(course)}
                          className={retakeBtn}
                        >
                          {retakingId === course.courseId
                            ? "Resetting..."
                            : "Retake"}
                        </button>
                      </span>
                      <span className="inline-block pr-[3px] pb-[3px]">
                        <Link
                          href={`/dashboard/results/${encodeURIComponent(course.courseId)}`}
                          className={viewBtn}
                        >
                          View
                        </Link>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
