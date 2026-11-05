"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminConfirmDelete,
  AdminModal,
  AdminPageHeader,
  adminBtn,
} from "@/components/admin/AdminUi";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  topic?: string;
  message: string;
  created_at: string;
};

export default function AdminContactPage() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ContactRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact");
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

  async function remove() {
    if (!deleteRow) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(
        `/api/contact?id=${encodeURIComponent(deleteRow.id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Delete failed");
      setDeleteRow(null);
      setSelected(null);
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
        title="Contact messages"
        subtitle="Notes submitted from the contact form."
      />

      {loading ? (
        <p className="font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
          Loading…
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto border border-black bg-white shadow-[3px_3px_0_#000]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-400">
                    No messages yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{row.email}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.topic || "—"}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-neutral-600">
                      {row.message}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className={`${adminBtn} bg-white`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteRow(row);
                            setFormError(null);
                          }}
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

      {selected ? (
        <AdminModal title="Message" onClose={() => setSelected(null)}>
          <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-400">
            {selected.name} · {selected.email}
            {selected.topic ? ` · ${selected.topic}` : ""}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {formatDate(selected.created_at)}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-black">
            {selected.message}
          </p>
        </AdminModal>
      ) : null}

      {deleteRow ? (
        <AdminModal title="Delete message" onClose={() => setDeleteRow(null)}>
          {formError ? (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          ) : null}
          <AdminConfirmDelete
            label={deleteRow.name}
            onCancel={() => setDeleteRow(null)}
            onConfirm={() => void remove()}
            busy={busy}
          />
        </AdminModal>
      ) : null}
    </div>
  );
}
