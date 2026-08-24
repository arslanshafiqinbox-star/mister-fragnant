"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tracker = {
  id: string;
  reminder: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayFromIso(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    const match = date.match(/^\d{4}-(\d{2})-(\d{2})/);
    return match ? Number(match[2]) : 0;
  }
  return d.getUTCDate();
}

function isMockReminder(reminder: string) {
  return /mock|exam/i.test(reminder);
}

export default function StudyPlanner() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [dayInput, setDayInput] = useState("");
  const [tagline, setTagline] = useState("");
  const [eventType, setEventType] = useState<"study" | "mock">("study");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [editReminder, setEditReminder] = useState("");
  const [editDay, setEditDay] = useState("");
  const [modalError, setModalError] = useState("");
  const [isModalSaving, setIsModalSaving] = useState(false);

  const today = now.getDate();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();
  const monthLabel = `${MONTH_NAMES[month]} ${year}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fetchTrackers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trackers?year=${year}&month=${month + 1}`,
        { headers: authHeaders() }
      );
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load calendar.");
      }

      setTrackers(
        Array.isArray(result?.data?.trackers) ? result.data.trackers : []
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load calendar."
      );
      setTrackers([]);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const cells: (number | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month, year, daysInMonth]);

  function getTrackersForDay(day: number) {
    return trackers.filter((t) => dayFromIso(t.date) === day);
  }

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const day = Number(dayInput);
    if (!day || day < 1 || day > daysInMonth || !tagline.trim()) return;

    const reminderBase = tagline.trim();
    const reminder =
      eventType === "mock" && !isMockReminder(reminderBase)
        ? `Mock: ${reminderBase}`
        : reminderBase;
    const date = `${year}-${pad2(month + 1)}-${pad2(day)}`;

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trackers`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ reminder, date }),
        }
      );
      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to add reminder.");
      }

      setDayInput("");
      setTagline("");
      await fetchTrackers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to add reminder."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openTracker(tracker: Tracker) {
    setSelectedTracker(tracker);
    setEditReminder(tracker.reminder);
    setEditDay(String(dayFromIso(tracker.date)));
    setModalError("");
  }

  function closeTrackerModal() {
    if (isModalSaving) return;
    setSelectedTracker(null);
    setEditReminder("");
    setEditDay("");
    setModalError("");
  }

  async function handleUpdate() {
    if (!selectedTracker) return;

    const day = Number(editDay);
    const reminder = editReminder.trim();
    if (!reminder) {
      setModalError("Reminder is required.");
      return;
    }
    if (!day || day < 1 || day > daysInMonth) {
      setModalError(`Day must be between 1 and ${daysInMonth}.`);
      return;
    }

    const date = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    setIsModalSaving(true);
    setModalError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trackers/${selectedTracker.id}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ reminder, date }),
        }
      );
      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to update reminder.");
      }

      setSelectedTracker(null);
      setEditReminder("");
      setEditDay("");
      setModalError("");
      await fetchTrackers();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to update reminder."
      );
    } finally {
      setIsModalSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedTracker) return;

    setIsModalSaving(true);
    setModalError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/trackers/${selectedTracker.id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Failed to delete reminder.");
      }

      setSelectedTracker(null);
      setEditReminder("");
      setEditDay("");
      await fetchTrackers();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to delete reminder."
      );
    } finally {
      setIsModalSaving(false);
    }
  }

  return (
    <section className="w-full max-w-[540px] border-2 border-black bg-white p-3 shadow-[4px_4px_0_#000]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-extrabold text-black">Study planner</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="border-2 border-black bg-white px-1.5 py-0.5 text-[9px] font-bold"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="border-2 border-black bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="border-2 border-black bg-white px-1.5 py-0.5 text-[9px] font-bold"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="mb-2 text-[10px] text-black/60">Loading calendar...</p>
      ) : null}
      {errorMessage ? (
        <p className="mb-2 text-[10px] text-[#DC2626]">{errorMessage}</p>
      ) : null}

      <div className="grid grid-cols-7 border-2 border-black">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-r border-black py-0.5 text-center text-[8px] font-bold text-black last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-x-2 border-b-2 border-black">
        {calendarCells.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[2.1rem] border-b border-r border-black bg-white last:border-r-0"
              />
            );
          }
          const dayTrackers = getTrackersForDay(day);
          const isToday = isCurrentMonth && day === today;
          return (
            <div
              key={day}
              className={`relative flex min-h-[2.1rem] flex-col border-b border-r border-black p-0.5 last:border-r-0 ${
                isToday ? "bg-[#FACC15]" : "bg-white"
              }`}
            >
              <span className="text-[8px] font-bold leading-none text-black">
                {day}
              </span>
              <div className="mt-auto space-y-px">
                {dayTrackers.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    title="Edit reminder"
                    onClick={() => openTracker(ev)}
                    className={`block w-full truncate px-0.5 py-px text-center text-[6px] font-extrabold uppercase leading-tight text-white ${
                      isMockReminder(ev.reminder)
                        ? "bg-[#DC2626]"
                        : "bg-[#1D4ED8]"
                    }`}
                  >
                    {ev.reminder}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-semibold text-black">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 shrink-0 bg-[#DC2626]" /> Mock exam
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 shrink-0 bg-[#1D4ED8]" /> Study session
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 shrink-0 border border-black bg-[#FACC15]" />{" "}
          Today
        </span>
      </div>

      <form onSubmit={handleAdd} className="mt-2 flex items-center gap-1.5">
        <input
          value={dayInput}
          onChange={(e) => setDayInput(e.target.value)}
          type="number"
          min={1}
          max={daysInMonth}
          placeholder="Day"
          aria-label="Day"
          className="h-7 w-11 shrink-0 border-2 border-black bg-white px-1 text-[10px] outline-none placeholder:text-black/50"
        />
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Reminder tagline, e.g. Revise algebra"
          className="h-7 min-w-0 flex-1 border-2 border-black bg-white px-1.5 text-[10px] outline-none placeholder:text-black/40"
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as "study" | "mock")}
          aria-label="Event type"
          className="h-7 w-[4.5rem] shrink-0 border-2 border-black bg-white px-1 text-[10px] outline-none"
        >
          <option value="study">Study</option>
          <option value="mock">Mock</option>
        </select>
        <button
          type="submit"
          disabled={isSaving}
          className="h-7 shrink-0 border-2 border-black bg-white px-2.5 text-[9px] font-extrabold uppercase shadow-[2px_2px_0_#000] disabled:opacity-50"
        >
          {isSaving ? "..." : "Add"}
        </button>
      </form>

      {selectedTracker ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeTrackerModal}
        >
          <div
            className="w-full max-w-sm border-2 border-black bg-white p-4 shadow-[8px_8px_0_#000]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold uppercase text-black">
                Edit reminder
              </h3>
              <button
                type="button"
                onClick={closeTrackerModal}
                disabled={isModalSaving}
                className="text-sm font-bold leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className="mt-3 block text-[10px] font-bold uppercase text-black">
              Day
              <input
                type="number"
                min={1}
                max={daysInMonth}
                value={editDay}
                onChange={(e) => setEditDay(e.target.value)}
                className="mt-1 h-9 w-full border-2 border-black px-2 text-sm outline-none focus:bg-[#FFF7D6]"
              />
            </label>

            <label className="mt-3 block text-[10px] font-bold uppercase text-black">
              Reminder
              <input
                value={editReminder}
                onChange={(e) => setEditReminder(e.target.value)}
                className="mt-1 h-9 w-full border-2 border-black px-2 text-sm outline-none focus:bg-[#FFF7D6]"
              />
            </label>

            {modalError ? (
              <p className="mt-2 text-xs text-[#DC2626]">{modalError}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isModalSaving}
                className="border-2 border-black bg-[#DC2626] px-3 py-1.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#000] disabled:opacity-50"
              >
                {isModalSaving ? "..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isModalSaving}
                className="border-2 border-black bg-[#1D4ED8] px-3 py-1.5 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#000] disabled:opacity-50"
              >
                {isModalSaving ? "..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
