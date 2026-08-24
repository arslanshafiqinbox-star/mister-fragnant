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

type FragranceOption = { id: string; name: string; brand: string };

type ReviewRow = {
  id: string;
  fragrance_id: string;
  name: string;
  review: string;
  approval: boolean;
  rating: number;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

type FormState = {
  fragrance_id: string;
  name: string;
  review: string;
  rating: number;
  approval: boolean;
};

const empty: FormState = {
  fragrance_id: "",
  name: "",
  review: "",
  rating: 5,
  approval: false,
};

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [fragrances, setFragrances] = useState<FragranceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<ReviewRow | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fragranceLabel = useCallback(
    (id: string) => {
      const f = fragrances.find((x) => x.id === id);
      return f ? `${f.name}${f.brand ? ` — ${f.brand}` : ""}` : id.slice(0, 8);
    },
    [fragrances]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, fRes] = await Promise.all([
        fetch("/api/review"),
        fetch("/api/fragrance"),
      ]);
      const [rJson, fJson] = await Promise.all([rRes.json(), fRes.json()]);
      if (!rJson.ok) throw new Error(rJson.message || "Failed to load");
      setRows(rJson.rows ?? []);
      setFragrances(fJson.rows ?? []);
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
    setForm(empty);
    setSelected(null);
    setFormError(null);
    setMode("create");
  }

  function openEdit(row: ReviewRow) {
    setSelected(row);
    setForm({
      fragrance_id: row.fragrance_id,
      name: row.name,
      review: row.review,
      rating: row.rating,
      approval: row.approval,
    });
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: ReviewRow) {
    setSelected(row);
    setFormError(null);
    setMode("delete");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        fragrance_id: form.fragrance_id,
        name: form.name.trim(),
        review: form.review.trim(),
        rating: Number(form.rating),
        approval: form.approval,
      };
      const res = await fetch("/api/review", {
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

  async function toggleApproval(row: ReviewRow) {
    try {
      const res = await fetch("/api/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, approval: !row.approval }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove() {
    if (!selected) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(
        `/api/review?id=${encodeURIComponent(selected.id)}`,
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
        title="Reviews"
        subtitle="Moderate ratings and approve submissions."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add review
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
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Fragrance</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-400">
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {fragranceLabel(row.fragrance_id)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.name}</td>
                    <td className="px-4 py-3">{row.rating}/10</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] ${
                          row.approval ? "text-black" : "text-neutral-400"
                        }`}
                      >
                        {row.approval ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-neutral-600">
                      {row.review}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleApproval(row)}
                          className={`${adminBtn} ${
                            row.approval
                              ? "bg-white text-neutral-500"
                              : "bg-black text-white"
                          }`}
                        >
                          {row.approval ? "Unapprove" : "Approve"}
                        </button>
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
          title={mode === "edit" ? "Edit review" : "Add review"}
          onClose={() => setMode(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Fragrance">
              <select
                className={adminInput}
                value={form.fragrance_id}
                onChange={(e) =>
                  setForm({ ...form, fragrance_id: e.target.value })
                }
                required
              >
                <option value="">Choose…</option>
                {fragrances.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.brand ? ` — ${f.brand}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reviewer name">
              <input
                className={adminInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Rating (1–10)">
              <input
                type="number"
                min={1}
                max={10}
                className={adminInput}
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: Number(e.target.value) })
                }
                required
              />
            </Field>
            <Field label="Review">
              <textarea
                className={`${adminInput} min-h-[100px] resize-y`}
                value={form.review}
                onChange={(e) => setForm({ ...form, review: e.target.value })}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.approval}
                onChange={(e) =>
                  setForm({ ...form, approval: e.target.checked })
                }
              />
              Approved
            </label>
            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}
            <SubmitRow onCancel={() => setMode(null)} busy={busy} />
          </form>
        </AdminModal>
      ) : null}

      {mode === "delete" && selected ? (
        <AdminModal title="Delete review" onClose={() => setMode(null)}>
          {formError ? (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          ) : null}
          <AdminConfirmDelete
            label={`${selected.name} — ${selected.rating}/10`}
            onCancel={() => setMode(null)}
            onConfirm={() => void remove()}
            busy={busy}
          />
        </AdminModal>
      ) : null}
    </div>
  );
}
