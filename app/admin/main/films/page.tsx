"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminConfirmDelete,
  AdminModal,
  AdminPageHeader,
  Field,
  SubmitRow,
  adminBtn,
  adminInput,
} from "@/components/admin/AdminUi";
import HtmlEditor, { htmlIsEmpty } from "@/components/admin/HtmlEditor";

type FilmDetails = {
  brand: string;
  location: { city: string; country: string };
  date: string;
  duration: string;
  url: string;
  description: string;
};

type FilmRow = {
  id: string;
  name: string;
  details: Partial<FilmDetails> & Record<string, unknown>;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

type FilmForm = {
  name: string;
  brand: string;
  city: string;
  country: string;
  date: string;
  duration: string;
  url: string;
  description: string;
};

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YouTube-style: `9:47` (m:ss) or `1:09:47` (h:mm:ss) */
function normalizeDuration(raw: string): { value?: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "Duration is required." };

  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return { error: "Use m:ss or h:mm:ss (e.g. 9:47 or 1:09:47)." };
  }
  if (!parts.every((p) => /^\d+$/.test(p))) {
    return { error: "Duration must use digits only (e.g. 9:47)." };
  }

  const nums = parts.map((p) => Number(p));
  if (parts.length === 2) {
    const [mins, secs] = nums;
    if (secs > 59) return { error: "Seconds must be 0–59." };
    return { value: `${mins}:${String(secs).padStart(2, "0")}` };
  }

  const [hrs, mins, secs] = nums;
  if (mins > 59) return { error: "Minutes must be 0–59." };
  if (secs > 59) return { error: "Seconds must be 0–59." };
  return {
    value: `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
  };
}

function emptyForm(): FilmForm {
  return {
    name: "",
    brand: "",
    city: "",
    country: "",
    date: todayIsoDate(),
    duration: "",
    url: "",
    description: "",
  };
}

function detailsFromForm(form: FilmForm, duration: string): FilmDetails {
  return {
    brand: form.brand.trim(),
    location: {
      city: form.city.trim(),
      country: form.country.trim(),
    },
    date: form.date,
    duration,
    url: form.url.trim(),
    description: form.description,
  };
}

function formFromRow(row: FilmRow): FilmForm {
  const d = row.details ?? {};
  const location =
    d.location && typeof d.location === "object" && !Array.isArray(d.location)
      ? (d.location as { city?: string; country?: string })
      : {};
  return {
    name: row.name ?? "",
    brand: typeof d.brand === "string" ? d.brand : "",
    city: typeof location.city === "string" ? location.city : "",
    country: typeof location.country === "string" ? location.country : "",
    date: typeof d.date === "string" && d.date ? d.date : todayIsoDate(),
    duration: typeof d.duration === "string" ? d.duration : "",
    url: typeof d.url === "string" ? d.url : "",
    description: typeof d.description === "string" ? d.description : "",
  };
}

function locationLabel(details: FilmRow["details"]) {
  const loc = details?.location;
  if (!loc || typeof loc !== "object" || Array.isArray(loc)) return "—";
  const city = typeof loc.city === "string" ? loc.city : "";
  const country = typeof loc.country === "string" ? loc.country : "";
  if (city && country) return `${city}, ${country}`;
  return city || country || "—";
}

export default function AdminFilmsPage() {
  const [rows, setRows] = useState<FilmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<FilmRow | null>(null);
  const [form, setForm] = useState<FilmForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/film");
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Failed to load");
      setRows(json.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setSelected(null);
    setFormError(null);
    setMode("create");
  }

  function openEdit(row: FilmRow) {
    setSelected(row);
    setForm(formFromRow(row));
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: FilmRow) {
    setSelected(row);
    setFormError(null);
    setMode("delete");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (htmlIsEmpty(form.description)) {
      setFormError("Description is required.");
      return;
    }
    const durationParsed = normalizeDuration(form.duration);
    if (durationParsed.error || !durationParsed.value) {
      setFormError(durationParsed.error || "Invalid duration.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        details: detailsFromForm(form, durationParsed.value),
      };
      const res = await fetch("/api/film", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit" && selected
            ? { id: selected.id, ...payload }
            : payload
        ),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Save failed");
      setMode(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(
        `/api/film?id=${encodeURIComponent(selected.id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Delete failed");
      setMode(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Films"
        subtitle="Brand, location, date, duration, URL, and HTML description."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add film
          </button>
        }
      />

      {loading ? (
        <p className="font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
          Loading…
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto border border-black bg-white shadow-[3px_3px_0_#000]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-400">
                    No films yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      {typeof row.details?.brand === "string"
                        ? row.details.brand
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {locationLabel(row.details)}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.75rem]">
                      {typeof row.details?.date === "string"
                        ? row.details.date
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.75rem]">
                      {typeof row.details?.duration === "string"
                        ? row.details.duration
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className={`${adminBtn} bg-white`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDelete(row)}
                          className={`${adminBtn} bg-white`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {mode === "create" || mode === "edit" ? (
        <AdminModal
          title={mode === "edit" ? "Edit film" : "Add film"}
          onClose={() => setMode(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Name">
              <input
                className={adminInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Brand">
              <input
                className={adminInput}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Maison Verlaine"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <input
                  className={adminInput}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Paris"
                  required
                />
              </Field>
              <Field label="Country">
                <input
                  className={adminInput}
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="France"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  className={adminInput}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Duration">
                <input
                  className={adminInput}
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  placeholder="9:47 or 1:09:47"
                  inputMode="numeric"
                  required
                />
                <p className="mt-1.5 text-xs text-neutral-500">
                  YouTube-style: minutes:seconds or hours:minutes:seconds.
                </p>
              </Field>
            </div>
            <Field label="URL">
              <input
                type="url"
                className={adminInput}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
                required
              />
            </Field>
            <Field label="Description (HTML)">
              <HtmlEditor
                value={form.description}
                onChange={(description) => setForm({ ...form, description })}
                placeholder="Write the film description — bold, lists, links…"
                minHeight="220px"
              />
            </Field>
            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}
            <SubmitRow onCancel={() => setMode(null)} busy={busy} />
          </form>
        </AdminModal>
      ) : null}

      {mode === "delete" && selected ? (
        <AdminModal title="Delete film" onClose={() => setMode(null)}>
          {formError ? (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          ) : null}
          <AdminConfirmDelete
            label={selected.name}
            onCancel={() => setMode(null)}
            onConfirm={() => void remove()}
            busy={busy}
          />
        </AdminModal>
      ) : null}
    </div>
  );
}
