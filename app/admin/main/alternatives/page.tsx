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
  adminLabel,
} from "@/components/admin/AdminUi";

type NamedEntity = { id: string; name: string };

type FragranceSideForm = {
  name: string;
  brand: string;
  amount: string;
  currency: string;
  size: string;
  notes: string[];
};

type AlternativeComparison = {
  closeness: string;
  comparison: {
    fragrance1: {
      name: string;
      brand: string;
      price: { amount: number; currency: string; size: string };
      notes: string[];
    };
    fragrance2: {
      name: string;
      brand: string;
      price: { amount: number; currency: string; size: string };
      notes: string[];
    };
  };
  review: {
    summary: string;
    performance: string;
    disclaimer: string;
  };
};

type AlternativeRow = {
  id: string;
  name: string;
  scent_type: string[];
  occasion: string[];
  comparison: Partial<AlternativeComparison> & Record<string, unknown>;
  created_at: string;
};

type Mode = "create" | "edit" | "delete" | null;

type FormState = {
  name: string;
  scent_type: string[];
  occasion: string[];
  closeness: string;
  fragrance1: FragranceSideForm;
  fragrance2: FragranceSideForm;
  summary: string;
  performance: string;
  disclaimer: string;
};

function emptyFragrance(): FragranceSideForm {
  return {
    name: "",
    brand: "",
    amount: "",
    currency: "USD",
    size: "100ml",
    notes: [""],
  };
}

const empty: FormState = {
  name: "",
  scent_type: [],
  occasion: [],
  closeness: "",
  fragrance1: emptyFragrance(),
  fragrance2: emptyFragrance(),
  summary: "",
  performance: "",
  disclaimer: "",
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function sideFromData(raw: unknown): FragranceSideForm {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyFragrance();
  }
  const d = raw as {
    name?: unknown;
    brand?: unknown;
    price?: unknown;
    notes?: unknown;
  };
  const price =
    d.price && typeof d.price === "object" && !Array.isArray(d.price)
      ? (d.price as {
          amount?: unknown;
          currency?: unknown;
          size?: unknown;
        })
      : {};
  const notes = Array.isArray(d.notes)
    ? d.notes.filter((n): n is string => typeof n === "string")
    : [];

  return {
    name: typeof d.name === "string" ? d.name : "",
    brand: typeof d.brand === "string" ? d.brand : "",
    amount:
      typeof price.amount === "number"
        ? String(price.amount)
        : typeof price.amount === "string"
          ? price.amount
          : "",
    currency: typeof price.currency === "string" ? price.currency : "USD",
    size: typeof price.size === "string" ? price.size : "100ml",
    notes: notes.length > 0 ? notes : [""],
  };
}

function closenessInputValue(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw !== "string") return "";
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*10$/i);
  if (match) return match[1];
  const n = Number(raw.trim());
  return Number.isFinite(n) ? String(n) : "";
}

function formFromRow(row: AlternativeRow): FormState {
  const c = row.comparison ?? {};
  const pair =
    c.comparison && typeof c.comparison === "object" && !Array.isArray(c.comparison)
      ? (c.comparison as { fragrance1?: unknown; fragrance2?: unknown })
      : {};
  const review =
    c.review && typeof c.review === "object" && !Array.isArray(c.review)
      ? (c.review as {
          summary?: unknown;
          performance?: unknown;
          disclaimer?: unknown;
        })
      : {};

  return {
    name: row.name ?? "",
    scent_type: row.scent_type ?? [],
    occasion: row.occasion ?? [],
    closeness: closenessInputValue(c.closeness),
    fragrance1: sideFromData(pair.fragrance1),
    fragrance2: sideFromData(pair.fragrance2),
    summary: typeof review.summary === "string" ? review.summary : "",
    performance:
      typeof review.performance === "string" ? review.performance : "",
    disclaimer: typeof review.disclaimer === "string" ? review.disclaimer : "",
  };
}

function buildSide(side: FragranceSideForm, label: string) {
  const notes = side.notes.map((n) => n.trim()).filter(Boolean);
  if (!side.name.trim()) throw new Error(`${label} name is required.`);
  if (!side.brand.trim()) throw new Error(`${label} brand is required.`);
  const amount = Number(side.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} price amount must be a non-negative number.`);
  }
  if (!side.currency.trim()) throw new Error(`${label} currency is required.`);
  if (!side.size.trim()) throw new Error(`${label} size is required.`);
  if (notes.length === 0) throw new Error(`${label} needs at least one note.`);

  return {
    name: side.name.trim(),
    brand: side.brand.trim(),
    price: {
      amount,
      currency: side.currency.trim(),
      size: side.size.trim(),
    },
    notes,
  };
}

function FragranceSideFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FragranceSideForm;
  onChange: (next: FragranceSideForm) => void;
}) {
  return (
    <div className="space-y-3 border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
      <p className={adminLabel}>{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input
            className={adminInput}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Aventus"
            required
          />
        </Field>
        <Field label="Brand">
          <input
            className={adminInput}
            value={value.brand}
            onChange={(e) => onChange({ ...value, brand: e.target.value })}
            placeholder="Creed"
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Price amount">
          <input
            type="number"
            min={0}
            step={0.01}
            className={adminInput}
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            placeholder="435"
            required
          />
        </Field>
        <Field label="Currency">
          <input
            className={adminInput}
            value={value.currency}
            onChange={(e) => onChange({ ...value, currency: e.target.value })}
            placeholder="USD"
            required
          />
        </Field>
        <Field label="Size">
          <input
            className={adminInput}
            value={value.size}
            onChange={(e) => onChange({ ...value, size: e.target.value })}
            placeholder="100ml"
            required
          />
        </Field>
      </div>
      <Field label="Notes">
        <div className="space-y-2">
          {value.notes.map((note, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={adminInput}
                value={note}
                onChange={(e) => {
                  const notes = [...value.notes];
                  notes[index] = e.target.value;
                  onChange({ ...value, notes });
                }}
                placeholder="Pineapple"
              />
              <button
                type="button"
                className={`${adminBtn} bg-white`}
                onClick={() =>
                  onChange({
                    ...value,
                    notes:
                      value.notes.length === 1
                        ? [""]
                        : value.notes.filter((_, i) => i !== index),
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
              onChange({ ...value, notes: [...value.notes, ""] })
            }
          >
            Add note
          </button>
        </div>
      </Field>
    </div>
  );
}

export default function AdminAlternativesPage() {
  const [rows, setRows] = useState<AlternativeRow[]>([]);
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<AlternativeRow | null>(null);
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
      const [aRes, sRes, oRes] = await Promise.all([
        fetch("/api/alternative"),
        fetch("/api/scent-type"),
        fetch("/api/occasion"),
      ]);
      const [aJson, sJson, oJson] = await Promise.all([
        aRes.json(),
        sRes.json(),
        oRes.json(),
      ]);
      if (!aJson.ok) throw new Error(aJson.message || "Failed to load");
      setRows(aJson.rows ?? []);
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

  function openEdit(row: AlternativeRow) {
    setSelected(row);
    setForm(formFromRow(row));
    setFormError(null);
    setMode("edit");
  }

  function openDelete(row: AlternativeRow) {
    setSelected(row);
    setFormError(null);
    setMode("delete");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (!form.closeness.trim()) throw new Error("Closeness is required.");
      const closenessNum = Number(form.closeness);
      if (
        !Number.isFinite(closenessNum) ||
        closenessNum < 0 ||
        closenessNum > 10
      ) {
        throw new Error("Closeness must be a number from 0 to 10.");
      }
      if (!form.summary.trim()) throw new Error("Review summary is required.");
      if (!form.performance.trim()) {
        throw new Error("Review performance is required.");
      }
      if (!form.disclaimer.trim()) {
        throw new Error("Review disclaimer is required.");
      }

      const payload = {
        name: form.name.trim(),
        scent_type: form.scent_type,
        occasion: form.occasion,
        comparison: {
          closeness: `${closenessNum}/10`,
          comparison: {
            fragrance1: buildSide(form.fragrance1, "Fragrance 1"),
            fragrance2: buildSide(form.fragrance2, "Fragrance 2"),
          },
          review: {
            summary: form.summary.trim(),
            performance: form.performance.trim(),
            disclaimer: form.disclaimer.trim(),
          },
        },
      };

      const res = await fetch("/api/alternative", {
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
        `/api/alternative?id=${encodeURIComponent(selected.id)}`,
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
        title="Alternatives"
        subtitle="Name, scent types, occasions, and structured fragrance comparison."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={`${adminBtn} bg-black text-white`}
          >
            Add alternative
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black bg-neutral-50 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Closeness</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Scent types</th>
                <th className="px-4 py-3">Occasions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-neutral-400">
                    No alternatives yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const pair =
                    row.comparison?.comparison &&
                    typeof row.comparison.comparison === "object"
                      ? (row.comparison.comparison as {
                          fragrance1?: { name?: string };
                          fragrance2?: { name?: string };
                        })
                      : {};
                  const pairLabel = [
                    pair.fragrance1?.name,
                    pair.fragrance2?.name,
                  ]
                    .filter(Boolean)
                    .join(" vs ");

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-neutral-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.75rem]">
                        {typeof row.comparison?.closeness === "string"
                          ? row.comparison.closeness
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {pairLabel || "—"}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {mode === "create" || mode === "edit" ? (
        <AdminModal
          title={mode === "edit" ? "Edit alternative" : "Add alternative"}
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

            <Field label="Closeness (out of 10)">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                className={adminInput}
                value={form.closeness}
                onChange={(e) =>
                  setForm({ ...form, closeness: e.target.value })
                }
                placeholder="8"
                required
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Enter a number up to 10 — saved as e.g. 8/10.
              </p>
            </Field>

            <FragranceSideFields
              label="Fragrance 1"
              value={form.fragrance1}
              onChange={(fragrance1) => setForm({ ...form, fragrance1 })}
            />

            <FragranceSideFields
              label="Fragrance 2"
              value={form.fragrance2}
              onChange={(fragrance2) => setForm({ ...form, fragrance2 })}
            />

            <Field label="Review summary">
              <textarea
                className={`${adminInput} min-h-[100px] resize-y`}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                required
              />
            </Field>
            <Field label="Review performance">
              <textarea
                className={`${adminInput} min-h-[80px] resize-y`}
                value={form.performance}
                onChange={(e) =>
                  setForm({ ...form, performance: e.target.value })
                }
                required
              />
            </Field>
            <Field label="Review disclaimer">
              <textarea
                className={`${adminInput} min-h-[80px] resize-y`}
                value={form.disclaimer}
                onChange={(e) =>
                  setForm({ ...form, disclaimer: e.target.value })
                }
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
        <AdminModal title="Delete alternative" onClose={() => setMode(null)}>
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
