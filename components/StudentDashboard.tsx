"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudyPlanner from "@/components/StudyPlanner";
import DashboardSubjectCard, {
  type DashboardSubject,
} from "@/components/DashboardSubjectCard";

type Domain = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  total_subtopics: number;
  completed_subtopics: number;
  progress_percentage: number;
};

const PROGRESS_COLORS = ["#1D4ED8", "#16A34A", "#EAB308", "#DC2626", "#7C3AED"];

function mapDomainToSubject(domain: Domain, index: number): DashboardSubject {
  const topicCount = domain.total_subtopics ?? 0;
  return {
    id: domain.id,
    name: domain.name,
    level: "GCSE",
    topics:
      topicCount === 1
        ? "1 topic · quizzes & practice exams"
        : `${topicCount} topics · quizzes & practice exams`,
    progress: Math.round(domain.progress_percentage ?? 0),
    progressColor: PROGRESS_COLORS[index % PROGRESS_COLORS.length],
  };
}

export default function StudentDashboard() {
  const [subjects, setSubjects] = useState<DashboardSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDomains() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const accessToken = sessionStorage.getItem("accessToken");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/domains`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load subjects.");
        }

        const domains: Domain[] = Array.isArray(result?.data?.domains)
          ? result.data.domains
          : [];

        if (isMounted) {
          setSubjects(domains.map(mapDomainToSubject));
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to fetch subjects."
          );
          setSubjects([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDomains();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
            Your subjects
          </h1>
          <p className="mt-1 text-sm text-black/65">
            All-access plan — every subject unlocked
          </p>
        </div>
        <Link
          href="/dashboard/results"
          className="border-2 border-black bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000] sm:text-xs"
        >
          View results history
        </Link>
      </div>

      <StudyPlanner />

      {isLoading ? (
        <p className="text-sm text-black/65">Loading subjects...</p>
      ) : errorMessage ? (
        <p className="text-sm text-[#DC2626]">{errorMessage}</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-black/65">No subjects available yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {subjects.map((subject) => (
            <DashboardSubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
