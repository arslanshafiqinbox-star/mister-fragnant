"use client";

import { useEffect, useMemo, useState } from "react";

type NamedEntity = {
  id: string;
  name: string;
};

type FragrancePrice = {
  amount: number;
  currency: string;
  size: string;
};

type FragranceSide = {
  name: string;
  brand: string;
  price: FragrancePrice;
  notes: string[];
};

type AlternativeComparison = {
  closeness?: string;
  comparison?: {
    fragrance1?: FragranceSide;
    fragrance2?: FragranceSide;
  };
  review?: {
    summary?: string;
    performance?: string;
    disclaimer?: string;
  };
};

type AlternativeRow = {
  id: string;
  name: string;
  scent_type: string[];
  occasion: string[];
  comparison: AlternativeComparison;
};

type ListResponse = {
  ok: boolean;
  rows?: AlternativeRow[];
  message?: string;
};

const ALL = "all";

function formatPrice(price?: FragrancePrice) {
  if (!price || typeof price.amount !== "number") return "—";
  const symbol = price.currency === "USD" ? "$" : `${price.currency} `;
  const amount = Number.isInteger(price.amount)
    ? String(price.amount)
    : price.amount.toFixed(2);
  return `${symbol}${amount} / ${price.size || "—"}`;
}

function closenessLabel(value?: string) {
  if (!value) return "—";
  return value.includes("/") ? value : `${value}/10`;
}

function AlternativeModal({
  row,
  onClose,
}: {
  row: AlternativeRow;
  onClose: () => void;
}) {
  const pair = row.comparison?.comparison;
  const f1 = pair?.fragrance1;
  const f2 = pair?.fragrance2;
  const review = row.comparison?.review;
  const closeness = closenessLabel(row.comparison?.closeness);
  const title =
    f1?.name && f2?.name
      ? `${f1.name} vs ${f2.name}`
      : row.name;

  const bodyText = [review?.summary, review?.performance]
    .map((t) => t?.trim())
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close popup"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl">
        <article className="max-h-[85vh] overflow-y-auto border border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8">
          <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[3px_3px_0_#000]">
            Closeness: {closeness}
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.6rem,4vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
            {title}
          </h2>

          <div className="mt-8 overflow-x-auto border border-black">
            <div className="grid min-w-[520px] grid-cols-[5.5rem_1fr_1fr]">
              <div className="border-b border-r border-black px-3 py-4 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400">
                Brand
              </div>
              <div className="border-b border-r border-black px-4 py-4">
                <p className="text-[0.75rem] text-neutral-400">{f1?.brand || "—"}</p>
                <p className="mt-1 font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium text-black sm:text-[1.15rem]">
                  {f1?.name || "—"}
                </p>
              </div>
              <div className="border-b border-black px-4 py-4">
                <p className="text-[0.75rem] text-neutral-400">{f2?.brand || "—"}</p>
                <p className="mt-1 font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium text-black sm:text-[1.15rem]">
                  {f2?.name || "—"}
                </p>
              </div>

              <div className="border-b border-r border-black px-3 py-4 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400">
                Price
              </div>
              <div className="border-b border-r border-black px-4 py-4 text-[0.9rem] text-black">
                {formatPrice(f1?.price)}
              </div>
              <div className="border-b border-black px-4 py-4 text-[0.9rem] text-black">
                {formatPrice(f2?.price)}
              </div>

              <div className="border-r border-black px-3 py-4 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400">
                Notes
              </div>
              <div className="border-r border-black px-4 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {(f1?.notes ?? []).map((note) => (
                    <span
                      key={`f1-${note}`}
                      className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.08em] text-black"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {(f2?.notes ?? []).map((note) => (
                    <span
                      key={`f2-${note}`}
                      className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.08em] text-black"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {bodyText ? (
            <p className="mt-8 text-[0.9rem] leading-relaxed text-neutral-700">
              {bodyText}
            </p>
          ) : null}

          {review?.disclaimer ? (
            <p className="mt-6 text-[0.75rem] italic leading-relaxed text-neutral-400">
              {review.disclaimer}
            </p>
          ) : null}
        </article>
      </div>
    </div>
  );
}

export default function FragranceAlternatives() {
  const [rows, setRows] = useState<AlternativeRow[]>([]);
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [aRes, sRes] = await Promise.all([
          fetch("/api/alternative"),
          fetch("/api/scent-type"),
        ]);
        const [aJson, sJson] = (await Promise.all([
          aRes.json(),
          sRes.json(),
        ])) as [ListResponse, ListResponse & { rows?: NamedEntity[] }];

        if (!aJson.ok) throw new Error(aJson.message || "Failed to load");
        if (!cancelled) {
          setRows(aJson.rows ?? []);
          setScentTypes(sJson.rows ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === ALL) return rows;
    return rows.filter((row) => (row.scent_type ?? []).includes(filter));
  }, [rows, filter]);

  const openRow = useMemo(
    () => rows.find((r) => r.id === openId) ?? null,
    [rows, openId]
  );

  return (
    <section id="alternatives" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Alternatives
          </h2>
          <p className="max-w-[18rem] text-[0.75rem] leading-relaxed text-neutral-500 sm:pt-2 sm:text-right sm:text-[0.8rem]">
            The real thing, and the closest thing to it for a fraction of the
            price. You decide which is worth it.
          </p>
        </div>

        <p className="mt-5 max-w-3xl text-[0.75rem] italic leading-relaxed text-neutral-400 sm:text-[0.8rem]">
          Not affiliated with or endorsed by any fragrance house. Closeness
          scores are editorial opinions based on wearing both — not laboratory
          comparisons.
        </p>

        <div className="mt-8">
          <p className="mb-3 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-400">
            Filter by type
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter(ALL)}
              className={`border border-black px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
                filter === ALL ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              All
            </button>
            {scentTypes.map((s) => {
              const active = filter === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFilter(s.id)}
                  className={`border border-black px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
                    active ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading alternatives…
          </p>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            No alternatives yet.
          </p>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="mt-8 border-t border-black">
            {filtered.map((row) => {
              const pair = row.comparison?.comparison;
              const f1 = pair?.fragrance1;
              const f2 = pair?.fragrance2;
              const closeness = closenessLabel(row.comparison?.closeness);

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className="group flex w-full flex-col gap-3 border-b border-black py-5 text-left transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-6"
                >
                  <div className="min-w-0">
                    <h3 className="font-[family-name:var(--font-hero-serif)] text-[1.15rem] font-medium leading-[1.2] tracking-[-0.01em] text-black transition-transform duration-200 group-hover:translate-x-1 sm:text-[1.35rem]">
                      {f1?.name || "—"} → {f2?.name || "—"}
                    </h3>
                    <p className="mt-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                      {f1?.brand || "—"} vs {f2?.brand || "—"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                      {formatPrice(f2?.price)}
                    </span>
                    <span className="shrink-0 border border-black bg-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium text-black shadow-[3px_3px_0_#000]">
                      {closeness}{" "}
                      <span className="font-normal text-neutral-500">close</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {openRow ? (
        <AlternativeModal row={openRow} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  );
}
