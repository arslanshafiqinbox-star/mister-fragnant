"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export type CourseTier = {
  id: string;
  course_name: string;
  domain_id: string;
  domain_name: string;
  total_subtopics: number;
  completed_subtopics: number;
  progress_percentage: number;
};

export type TopicItem = {
  id: string;
  topic_name: string;
  course_id: string;
  course_name: string;
};

export type SubtopicItem = {
  id: string;
  subtopic_name: string;
  topic_id: string;
  topic_name: string;
};

const tierBtn =
  "flex-1 border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase transition sm:text-xs";

function authHeaders() {
  const accessToken =
    typeof window !== "undefined"
      ? sessionStorage.getItem("accessToken")
      : null;
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

type StudyQuizSidebarProps = {
  domainId: string;
  selectedCourseId: string | null;
  onCourseChange: (course: CourseTier) => void;
  selectedTopicId: string | null;
  onTopicChange: (topic: TopicItem) => void;
  selectedSubtopicId: string | null;
  onSubtopicChange: (subtopic: SubtopicItem | null) => void;
  onSubtopicQueueChange?: (queue: SubtopicItem[]) => void;
  onAllSubtopicsComplete?: (done: boolean) => void;
};

export default function StudyQuizSidebar({
  domainId,
  selectedCourseId,
  onCourseChange,
  selectedTopicId,
  onTopicChange,
  selectedSubtopicId,
  onSubtopicChange,
  onSubtopicQueueChange,
  onAllSubtopicsComplete,
}: StudyQuizSidebarProps) {
  const [courses, setCourses] = useState<CourseTier[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [subtopicsByTopic, setSubtopicsByTopic] = useState<
    Record<string, SubtopicItem[]>
  >({});
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [topicsError, setTopicsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
      if (!domainId) return;
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses?domainId=${encodeURIComponent(domainId)}`,
          { headers: authHeaders() }
        );
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load tiers.");
        }

        const fetched: CourseTier[] = Array.isArray(result?.data?.courses)
          ? result.data.courses
          : [];

        if (!isMounted) return;
        setCourses(fetched);
        if (fetched.length > 0) {
          const alreadySelected = fetched.find((c) => c.id === selectedCourseId);
          if (!alreadySelected) {
            onCourseChange(fetched[0]);
          }
        }
      } catch (error) {
        if (isMounted) {
          setCoursesError(
            error instanceof Error ? error.message : "Unable to load tiers."
          );
          setCourses([]);
        }
      } finally {
        if (isMounted) setCoursesLoading(false);
      }
    }

    fetchCourses();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchTopics() {
      if (!selectedCourseId) {
        setTopics([]);
        return;
      }

      setTopicsLoading(true);
      setTopicsError("");
      setSubtopicsByTopic({});

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/topics?courseId=${encodeURIComponent(selectedCourseId)}`,
          { headers: authHeaders() }
        );
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load topics.");
        }

        const fetched: TopicItem[] = Array.isArray(result?.data?.topics)
          ? result.data.topics
          : [];

        if (!isMounted) return;
        setTopics(fetched);

        if (fetched.length > 0) {
          const alreadySelected = fetched.find((t) => t.id === selectedTopicId);
          if (!alreadySelected) {
            onTopicChange(fetched[0]);
          }
        } else {
          onTopicChange({
            id: "",
            topic_name: "",
            course_id: selectedCourseId,
            course_name: "",
          });
        }

        const subtopicEntries = await Promise.all(
          fetched.map(async (topic) => {
            try {
              const subRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subtopics?topicId=${encodeURIComponent(topic.id)}`,
                { headers: authHeaders() }
              );
              const subJson = await subRes.json();
              const list: SubtopicItem[] = Array.isArray(subJson?.data?.subtopics)
                ? subJson.data.subtopics
                : [];
              return [topic.id, list] as const;
            } catch {
              return [topic.id, []] as const;
            }
          })
        );

        if (isMounted) {
          const map = Object.fromEntries(subtopicEntries);
          setSubtopicsByTopic(map);

          const flatQueue = fetched.flatMap((topic) => map[topic.id] ?? []);
          onSubtopicQueueChange?.(flatQueue);

          let completedIds = new Set<string>();
          try {
            const progressRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/progress/subtopics?courseId=${encodeURIComponent(selectedCourseId)}`,
              { headers: authHeaders() }
            );
            const progressJson = await progressRes.json();
            if (progressRes.ok && progressJson?.success) {
              const progressList = Array.isArray(progressJson?.data?.subtopics)
                ? progressJson.data.subtopics
                : [];
              completedIds = new Set(
                progressList
                  .filter(
                    (item: { completed?: boolean; subtopicId?: string }) =>
                      item.completed && item.subtopicId
                  )
                  .map(
                    (item: { subtopicId: string }) => item.subtopicId
                  )
              );
            }
          } catch {
            // Fall back to first subtopic if progress fetch fails
          }

          if (!isMounted) return;

          const resumeSubtopic =
            flatQueue.find((s) => !completedIds.has(s.id)) ?? null;
          const allDone = flatQueue.length > 0 && resumeSubtopic === null;

          if (resumeSubtopic) {
            const topic =
              fetched.find((t) => t.id === resumeSubtopic.topic_id) ?? {
                id: resumeSubtopic.topic_id,
                topic_name: resumeSubtopic.topic_name,
                course_id: selectedCourseId,
                course_name: "",
              };
            onTopicChange(topic);
            onSubtopicChange(resumeSubtopic);
            onAllSubtopicsComplete?.(false);
          } else if (allDone) {
            if (fetched[0]) onTopicChange(fetched[0]);
            onSubtopicChange(null);
            onAllSubtopicsComplete?.(true);
          } else {
            onSubtopicChange(null);
            onAllSubtopicsComplete?.(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setTopicsError(
            error instanceof Error ? error.message : "Unable to load topics."
          );
          setTopics([]);
        }
      } finally {
        if (isMounted) setTopicsLoading(false);
      }
    }

    fetchTopics();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-b-2 border-black bg-white lg:h-auto lg:min-h-full lg:w-64 lg:border-b-0 lg:border-r-2">
      <div className="border-b-2 border-black px-3 py-4">
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#000]"
        >
          ← Subjects
        </Link>
      </div>

      <div className="border-b-2 border-black p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-black/60">
          Tier
        </p>
        {coursesLoading ? (
          <p className="text-xs text-black/60">Loading tiers...</p>
        ) : coursesError ? (
          <p className="text-xs text-[#DC2626]">{coursesError}</p>
        ) : courses.length === 0 ? (
          <p className="text-xs text-black/60">No tiers found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => onCourseChange(course)}
                className={`${tierBtn} ${
                  selectedCourseId === course.id
                    ? "bg-[#DC2626] text-white shadow-[2px_2px_0_#000]"
                    : "bg-white text-black"
                }`}
              >
                {course.course_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-black/60">
          Topics
        </p>
        {topicsLoading ? (
          <p className="text-xs text-black/60">Loading topics...</p>
        ) : topicsError ? (
          <p className="text-xs text-[#DC2626]">{topicsError}</p>
        ) : topics.length === 0 ? (
          <p className="text-xs text-black/60">No topics for this tier.</p>
        ) : (
          <ul className="space-y-2">
            {topics.map((topic) => {
              const isActive = topic.id === selectedTopicId;
              const subtopics = subtopicsByTopic[topic.id] ?? [];
              return (
                <li key={topic.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onTopicChange(topic);
                      const subs = subtopicsByTopic[topic.id] ?? [];
                      onSubtopicChange(subs[0] ?? null);
                    }}
                    className={`flex w-full items-center justify-between border-2 border-black px-2.5 py-2 text-left text-xs font-bold transition ${
                      isActive
                        ? "bg-[#1D4ED8] text-white shadow-[2px_2px_0_#000]"
                        : "bg-white text-black hover:bg-[#FFF7D6]"
                    }`}
                  >
                    <span>{topic.topic_name}</span>
                    <span className={isActive ? "text-white/90" : "text-black/50"}>
                      {subtopics.length}
                    </span>
                  </button>
                  {isActive && subtopics.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 border-l-2 border-black/20 pl-3">
                      {subtopics.map((sub) => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => onSubtopicChange(sub)}
                            className={`w-full text-left text-[11px] transition ${
                              selectedSubtopicId === sub.id
                                ? "font-bold text-[#1D4ED8]"
                                : "text-black/70 hover:text-black"
                            }`}
                          >
                            {sub.subtopic_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export function useStudyParams() {
  const searchParams = useSearchParams();
  const domainId = searchParams.get("subject") ?? "";
  return { domainId };
}
