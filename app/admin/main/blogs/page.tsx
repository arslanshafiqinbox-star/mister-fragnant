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

type BlogRow = {
  id: string;
  title: string;
  provider: string;
  description: string;
  author: string;
  sponsored: boolean;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

const empty = {
  title: "",
  provider: "",
  description: "",
  author: "",
  sponsored: false,
};

export default function AdminBlogsPage() {
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<BlogRow | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blog");
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
    setForm(empty);
    setSelected(null);
    setFormError(null);
    setMode("create");
  }

  function openEdit(row: BlogRow) {
    setSelected(row);
    setForm({
      title: row.title,
      provider: row.provider,
      description: row.description,
      author: row.author,
      sponsored: Boolean(row.sponsored),
    });
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: BlogRow) {
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
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/blog", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit" && selected
            ? { id: selected.id, ...form }
            : form
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
        `/api/blog?id=${encodeURIComponent(selected.id)}`,
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
        title="Blogs"
        subtitle="Mister Fragrant's notes — create, edit, delete."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add blog
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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Sponsored</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-neutral-400">
                    No blogs yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.provider}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{row.author}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] ${
                          row.sponsored ? "text-black" : "text-neutral-400"
                        }`}
                      >
                        {row.sponsored ? "Yes" : "No"}
                      </span>
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
          title={mode === "edit" ? "Edit blog" : "Add blog"}
          onClose={() => setMode(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Title">
              <input
                className={adminInput}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Field>
            <Field label="Provider">
              <input
                className={adminInput}
                value={form.provider}
                onChange={(e) =>
                  setForm({ ...form, provider: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Author">
              <input
                className={adminInput}
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.sponsored}
                onChange={(e) =>
                  setForm({ ...form, sponsored: e.target.checked })
                }
              />
              <span className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
                Sponsored
              </span>
            </label>
            <Field label="Description (HTML)">
              <HtmlEditor
                value={form.description}
                onChange={(description) => setForm({ ...form, description })}
                placeholder="Write the note — bold, lists, links…"
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
        <AdminModal title="Delete blog" onClose={() => setMode(null)}>
          {formError ? (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          ) : null}
          <AdminConfirmDelete
            label={selected.title}
            onCancel={() => setMode(null)}
            onConfirm={() => void remove()}
            busy={busy}
          />
        </AdminModal>
      ) : null}
    </div>
  );
}
