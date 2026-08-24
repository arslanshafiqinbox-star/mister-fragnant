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

type NamedEntity = { id: string; name: string };
type AssociateLink = { name: string; link: string };

type FragranceRow = {
  id: string;
  name: string;
  brand: string;
  occasion: string[];
  scent_type: string[];
  associate_links: AssociateLink[];
};

type Mode = "create" | "edit" | "delete" | null;

type FormState = {
  name: string;
  brand: string;
  scent_type: string[];
  occasion: string[];
  associate_links: AssociateLink[];
};

const empty: FormState = {
  name: "",
  brand: "",
  scent_type: [],
  occasion: [],
  associate_links: [{ name: "", link: "" }],
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function AdminFragnancesPage() {
  const [rows, setRows] = useState<FragranceRow[]>([]);
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<FragranceRow | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nameById = useCallback(
    (ids: string[], list: NamedEntity[]) =>
      ids
        .map((id) => list.find((x) => x.id === id)?.name)
        .filter(Boolean)
        .join(", ") || "—",
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, sRes, oRes] = await Promise.all([
        fetch("/api/fragrance"),
        fetch("/api/scent-type"),
        fetch("/api/occasion"),
      ]);
      const [fJson, sJson, oJson] = await Promise.all([
        fRes.json(),
        sRes.json(),
        oRes.json(),
      ]);
      if (!fJson.ok) throw new Error(fJson.message || "Failed to load");
      setRows(fJson.rows ?? []);
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

  function openEdit(row: FragranceRow) {
    setSelected(row);
    setForm({
      name: row.name,
      brand: row.brand,
      scent_type: row.scent_type,
      occasion: row.occasion,
      associate_links:
        row.associate_links.length > 0
          ? row.associate_links
          : [{ name: "", link: "" }],
    });
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: FragranceRow) {
    setSelected(row);
    setFormError(null);
    setMode("delete");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const links = form.associate_links.filter(
        (l) => l.name.trim() && l.link.trim()
      );
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        scent_type: form.scent_type,
        occasion: form.occasion,
        associate_links: links,
      };
      const res = await fetch("/api/fragrance", {
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
        `/api/fragrance?id=${encodeURIComponent(selected.id)}`,
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
        title="Fragnances"
        subtitle="Manage fragrance catalog entries."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add fragrance
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Scent type</th>
                <th className="px-4 py-3">Occasion</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-neutral-400">
                    No fragrances yet.
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
                      {row.brand || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {nameById(row.scent_type, scentTypes)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {nameById(row.occasion, occasions)}
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
          title={mode === "edit" ? "Edit fragrance" : "Add fragrance"}
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
            <Field label="Brand (optional)">
              <input
                className={adminInput}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </Field>

            <Field label="Scent type">
              <div className="flex flex-wrap gap-2">
                {scentTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        scent_type: toggleId(form.scent_type, item.id),
                      })
                    }
                    className={`${adminBtn} ${
                      form.scent_type.includes(item.id)
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Occasion">
              <div className="flex flex-wrap gap-2">
                {occasions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        occasion: toggleId(form.occasion, item.id),
                      })
                    }
                    className={`${adminBtn} ${
                      form.occasion.includes(item.id)
                        ? "bg-black text-white"
                        : "bg-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Associate links">
              <div className="space-y-2">
                {form.associate_links.map((link, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      className={adminInput}
                      placeholder="Store name"
                      value={link.name}
                      onChange={(e) => {
                        const next = [...form.associate_links];
                        next[index] = { ...next[index], name: e.target.value };
                        setForm({ ...form, associate_links: next });
                      }}
                    />
                    <input
                      className={adminInput}
                      placeholder="https://…"
                      value={link.link}
                      onChange={(e) => {
                        const next = [...form.associate_links];
                        next[index] = { ...next[index], link: e.target.value };
                        setForm({ ...form, associate_links: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={`${adminBtn} bg-white`}
                  onClick={() =>
                    setForm({
                      ...form,
                      associate_links: [
                        ...form.associate_links,
                        { name: "", link: "" },
                      ],
                    })
                  }
                >
                  Add link
                </button>
              </div>
            </Field>

            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}
            <SubmitRow onCancel={() => setMode(null)} busy={busy} />
          </form>
        </AdminModal>
      ) : null}

      {mode === "delete" && selected ? (
        <AdminModal title="Delete fragrance" onClose={() => setMode(null)}>
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
