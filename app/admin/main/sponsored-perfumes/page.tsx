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

type NamedEntity = { id: string; name: string };

type Retailer = { name: string; url: string };

type SponsoredDetails = {
  brand: string;
  description: string;
  rating: number;
  retailers: Retailer[];
};

type SponsoredPerfumeRow = {
  id: string;
  name: string;
  scent_type: string[];
  occasion: string[];
  details: Partial<SponsoredDetails> & Record<string, unknown>;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

type FormState = {
  name: string;
  scent_type: string[];
  occasion: string[];
  brand: string;
  description: string;
  rating: string;
  retailers: Retailer[];
};

const empty: FormState = {
  name: "",
  scent_type: [],
  occasion: [],
  brand: "",
  description: "",
  rating: "",
  retailers: [{ name: "", url: "" }],
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function detailsFromRow(row: SponsoredPerfumeRow): FormState {
  const d = row.details ?? {};
  const retailersRaw = Array.isArray(d.retailers) ? d.retailers : [];
  const retailers = retailersRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as { name?: unknown; url?: unknown };
      return {
        name: typeof r.name === "string" ? r.name : "",
        url: typeof r.url === "string" ? r.url : "",
      };
    })
    .filter((x): x is Retailer => x != null);

  return {
    name: row.name ?? "",
    scent_type: row.scent_type ?? [],
    occasion: row.occasion ?? [],
    brand: typeof d.brand === "string" ? d.brand : "",
    description: typeof d.description === "string" ? d.description : "",
    rating:
      typeof d.rating === "number"
        ? String(d.rating)
        : typeof d.rating === "string"
          ? d.rating
          : "",
    retailers: retailers.length > 0 ? retailers : [{ name: "", url: "" }],
  };
}

export default function AdminSponsoredPerfumesPage() {
  const [rows, setRows] = useState<SponsoredPerfumeRow[]>([]);
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<SponsoredPerfumeRow | null>(null);
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
      const [pRes, sRes, oRes] = await Promise.all([
        fetch("/api/sponsored-perfume"),
        fetch("/api/scent-type"),
        fetch("/api/occasion"),
      ]);
      const [pJson, sJson, oJson] = await Promise.all([
        pRes.json(),
        sRes.json(),
        oRes.json(),
      ]);
      if (!pJson.ok) throw new Error(pJson.message || "Failed to load");
      setRows(pJson.rows ?? []);
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

  function openEdit(row: SponsoredPerfumeRow) {
    setSelected(row);
    setForm(detailsFromRow(row));
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: SponsoredPerfumeRow) {
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
    const rating = Number(form.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      setFormError("Rating must be a number between 0 and 10.");
      return;
    }
    const retailers = form.retailers
      .map((r) => ({ name: r.name.trim(), url: r.url.trim() }))
      .filter((r) => r.name || r.url);
    if (retailers.length === 0) {
      setFormError("Add at least one retailer.");
      return;
    }
    if (retailers.some((r) => !r.name || !r.url)) {
      setFormError("Each retailer needs a name and URL.");
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        scent_type: form.scent_type,
        occasion: form.occasion,
        details: {
          brand: form.brand.trim(),
          description: form.description,
          rating,
          retailers,
        },
      };
      const res = await fetch("/api/sponsored-perfume", {
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
        `/api/sponsored-perfume?id=${encodeURIComponent(selected.id)}`,
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
        title="Sponsored perfumes"
        subtitle="Name, scent types, occasions, brand, rating, HTML description, and retailers."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add sponsored
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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Scent types</th>
                <th className="px-4 py-3">Occasions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-400">
                    No sponsored perfumes yet.
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
                      {typeof row.details?.brand === "string"
                        ? row.details.brand
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.75rem]">
                      {typeof row.details?.rating === "number"
                        ? row.details.rating
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {nameById(row.scent_type ?? [], scentTypes)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {nameById(row.occasion ?? [], occasions)}
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
          title={
            mode === "edit" ? "Edit sponsored perfume" : "Add sponsored perfume"
          }
          onClose={() => setMode(null)}
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Name">
              <input
                className={adminInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Lumière No. 7"
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

            <Field label="Rating (0–10)">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                className={adminInput}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="9.2"
                required
              />
            </Field>

            <Field label="Scent types">
              <div className="flex flex-wrap gap-2">
                {scentTypes.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    No scent types yet — add them under Scents & Occasions.
                  </p>
                ) : (
                  scentTypes.map((item) => (
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
                  ))
                )}
              </div>
            </Field>

            <Field label="Occasions">
              <div className="flex flex-wrap gap-2">
                {occasions.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    No occasions yet — add them under Scents & Occasions.
                  </p>
                ) : (
                  occasions.map((item) => (
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
                  ))
                )}
              </div>
            </Field>

            <Field label="Description (HTML)">
              <HtmlEditor
                value={form.description}
                onChange={(description) => setForm({ ...form, description })}
                placeholder="Write the sponsored perfume description…"
                minHeight="200px"
              />
            </Field>

            <Field label="Retailers">
              <div className="space-y-2">
                {form.retailers.map((retailer, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                    <input
                      className={adminInput}
                      placeholder="FragranceX"
                      value={retailer.name}
                      onChange={(e) => {
                        const next = [...form.retailers];
                        next[index] = { ...next[index], name: e.target.value };
                        setForm({ ...form, retailers: next });
                      }}
                    />
                    <input
                      className={adminInput}
                      placeholder="https://…"
                      value={retailer.url}
                      onChange={(e) => {
                        const next = [...form.retailers];
                        next[index] = { ...next[index], url: e.target.value };
                        setForm({ ...form, retailers: next });
                      }}
                    />
                    <button
                      type="button"
                      className={`${adminBtn} bg-white`}
                      onClick={() =>
                        setForm({
                          ...form,
                          retailers:
                            form.retailers.length === 1
                              ? [{ name: "", url: "" }]
                              : form.retailers.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={`${adminBtn} bg-white`}
                  onClick={() =>
                    setForm({
                      ...form,
                      retailers: [...form.retailers, { name: "", url: "" }],
                    })
                  }
                >
                  Add retailer
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
        <AdminModal
          title="Delete sponsored perfume"
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
