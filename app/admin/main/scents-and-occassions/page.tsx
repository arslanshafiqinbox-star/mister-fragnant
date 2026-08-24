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

type EntityRow = {
  id: string;
  name: string;
  description: string | null;
};

type Tab = "scent_type" | "occasion";
type Mode = "create" | "edit" | "delete" | null;

const empty = { name: "", description: "" };

export default function AdminScentsOccassionsPage() {
  const [tab, setTab] = useState<Tab>("scent_type");
  const [scentTypes, setScentTypes] = useState<EntityRow[]>([]);
  const [occasions, setOccasions] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<EntityRow | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const apiPath = tab === "scent_type" ? "/api/scent-type" : "/api/occasion";
  const rows = tab === "scent_type" ? scentTypes : occasions;
  const label = tab === "scent_type" ? "Scent type" : "Occasion";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, oRes] = await Promise.all([
        fetch("/api/scent-type"),
        fetch("/api/occasion"),
      ]);
      const [sJson, oJson] = await Promise.all([sRes.json(), oRes.json()]);
      if (!sJson.ok) throw new Error(sJson.message || "Failed to load scent types");
      if (!oJson.ok) throw new Error(oJson.message || "Failed to load occasions");
      setScentTypes(sJson.rows ?? []);
      setOccasions(oJson.rows ?? []);
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

  function openEdit(row: EntityRow) {
    setSelected(row);
    setForm({
      name: row.name,
      description: row.description ?? "",
    });
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: EntityRow) {
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
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      const res = await fetch(apiPath, {
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
        `${apiPath}?id=${encodeURIComponent(selected.id)}`,
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
        title="Scents & Occassions"
        subtitle="Manage scent types and occasions used across the catalog."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add {label.toLowerCase()}
          </button>
        }
      />

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("scent_type")}
          className={`${adminBtn} ${
            tab === "scent_type" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Scent types
        </button>
        <button
          type="button"
          onClick={() => setTab("occasion")}
          className={`${adminBtn} ${
            tab === "occasion" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Occasions
        </button>
      </div>

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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-neutral-400">
                    No {label.toLowerCase()}s yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-200 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.description || "—"}
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
          title={mode === "edit" ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
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
            <Field label="Description (optional)">
              <textarea
                className={`${adminInput} min-h-[80px] resize-y`}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
        <AdminModal
          title={`Delete ${label.toLowerCase()}`}
          onClose={() => setMode(null)}
        >
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
