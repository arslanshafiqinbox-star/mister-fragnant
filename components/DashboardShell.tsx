"use client";

import { useState } from "react";
import { DashboardCourseProvider } from "@/components/DashboardCourseContext";
import SubjectSidebar from "@/components/SubjectSidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  return (
    <DashboardCourseProvider
      value={{ selectedCourseId, setSelectedCourseId }}
    >
      <div className="-mx-4 -mt-8 flex min-h-[calc(100vh-5rem)] flex-col border-t-2 border-black bg-[#F2F0E4] sm:-mx-6 lg:flex-row lg:items-stretch">
        <SubjectSidebar
          open={open}
          onClose={() => setOpen(false)}
          onSelectCourse={setSelectedCourseId}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2  px-4 py-2 text-sm font-bold text-black"
              aria-label="Open menu"
            >
              <span aria-hidden>☰</span>
              {/* <span>Menu</span> */}
            </button>
          )}
          {children}
        </main>
      </div>
    </DashboardCourseProvider>
  );
}
