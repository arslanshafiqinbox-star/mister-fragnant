"use client";

import { createContext, useContext } from "react";

type DashboardCourseContextValue = {
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string) => void;
};

const DashboardCourseContext = createContext<DashboardCourseContextValue | null>(
  null
);

export function DashboardCourseProvider({
  value,
  children,
}: {
  value: DashboardCourseContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardCourseContext.Provider value={value}>
      {children}
    </DashboardCourseContext.Provider>
  );
}

export function useDashboardCourse() {
  const context = useContext(DashboardCourseContext);
  if (!context) {
    throw new Error(
      "useDashboardCourse must be used within DashboardCourseProvider"
    );
  }
  return context;
}
