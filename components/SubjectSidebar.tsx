"use client";

import { useEffect, useMemo, useState } from "react";

type SubjectSidebarProps = {
  open: boolean;
  onClose: () => void;
  onSelectCourse: (courseId: string) => void;
};

type Course = {
  id: string;
  course_name: string;
  domain_id: string;
  domain_name: string;
  created_at: string;
  updated_at: string;
};

export default function SubjectSidebar({
  open,
  onClose,
  onSelectCourse,
}: SubjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const accessToken =
          typeof window !== "undefined"
            ? sessionStorage.getItem("accessToken")
            : null;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/courses`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Failed to load courses.");
        }

        const fetchedCourses: Course[] = Array.isArray(result?.data?.courses)
          ? result.data.courses
          : [];

        if (isMounted) {
          setCourses(fetchedCourses);
          if (fetchedCourses.length > 0) {
            const firstId = fetchedCourses[0].id;
            setSelectedSubject(firstId);
            onSelectCourse(firstId);
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to fetch courses."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [onSelectCourse]);

  const filteredSubjects = useMemo(
    () =>
      courses.filter((course) =>
        course.course_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim())
      ),
    [courses, searchQuery]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop on mobile: tap to close */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        aria-label="Close menu"
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] shrink-0 flex-col border-r-2 border-black bg-[#ffc928] lg:static lg:z-auto lg:h-full lg:w-64">
        <div className="flex items-center justify-between border-b-2 border-black p-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-black">
            Subjects
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded  m-1.5 text-black "
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none placeholder:text-black/50 focus:bg-[#fff7d6] focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-[#ffc928]"
              aria-label="Search subjects"
            />
          </div>
          <ul className="space-y-1 pr-1">
            {isLoading ? (
              <li className="py-2 text-sm text-black/70">Loading courses...</li>
            ) : errorMessage ? (
              <li className="py-2 text-sm text-red-700">{errorMessage}</li>
            ) : filteredSubjects.length === 0 ? (
              <li className="py-2 text-sm text-black/70">No subjects match.</li>
            ) : (
              filteredSubjects.map((subject) => (
                <li key={subject.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      onSelectCourse(subject.id);
                    }}
                    className={`w-full rounded-md border-2 border-black px-3 py-2 text-left text-sm font-semibold transition shadow-[2px_2px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                      selectedSubject === subject.id
                        ? "bg-[#27e4d7] text-black"
                        : "bg-white text-black hover:bg-[#fff7d6]"
                    }`}
                  >
                    {subject.course_name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
