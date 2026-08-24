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

type NewsletterRow = {
  id: string;
  email: string;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

export default function AdminNewsletterEmailsPage() {
  const [rows, setRows] = useState<NewsletterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<NewsletterRow | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter-email");
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
    setEmail("");
    setSelected(null);
    setFormError(null);
    setMode("create");
  }

  function openEdit(row: NewsletterRow) {
    setSelected(row);
    setEmail(row.email);
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: NewsletterRow) {
    setSelected(row);
    setFormError(null);
    setMode("delete");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/newsletter-email", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit" && selected
            ? { id: selected.id, email: email.trim() }
            : { email: email.trim() }
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
        `/api/newsletter-email?id=${encodeURIComponent(selected.id)}`,
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

  function formatDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      <AdminPageHeader
        title="Newsletter emails"
        subtitle="Subscribers from the landing page signup."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add email
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
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-neutral-400">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.email}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(row.created_at)}
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
          title={mode === "edit" ? "Edit email" : "Add email"}
          onClose={() => setMode(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                className={adminInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
        <AdminModal title="Delete email" onClose={() => setMode(null)}>
          {formError ? (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          ) : null}
          <AdminConfirmDelete
            label={selected.email}
            onCancel={() => setMode(null)}
            onConfirm={() => void remove()}
            busy={busy}
          />
        </AdminModal>
      ) : null}
    </div>
  );
}
