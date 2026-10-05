"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

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
  gender: string[];
  strength: string[];
  comparison: AlternativeComparison;
};

type ListResponse = {
  ok: boolean;
  rows?: AlternativeRow[];
  message?: string;
};

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

function closenessScore(value?: string) {
  if (!value) return -1;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : -1;
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
        <article className="max-h-[85vh] overflow-y-auto border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8">
          <span className="inline-block border-2 border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[3px_3px_0_#000]">
            Closeness: {closeness}
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.6rem,4vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
            {title}
          </h2>

          <div className="mt-8 overflow-x-auto border-2 border-black">
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
                      className="border-2 border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.08em] text-black"
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
                      className="border-2 border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.08em] text-black"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"az" | "rated">("az");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const aRes = await fetch("/api/alternative");
        const aJson = (await aRes.json()) as ListResponse;

        if (!aJson.ok) throw new Error(aJson.message || "Failed to load");
        if (!cancelled) {
          setRows(aJson.rows ?? []);
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
    const q = search.trim().toLowerCase();
    const next = rows.filter((row) => {
      if (!q) return true;
      const pair = row.comparison?.comparison;
      const hay = [
        row.name,
        pair?.fragrance1?.name,
        pair?.fragrance1?.brand,
        pair?.fragrance2?.name,
        pair?.fragrance2?.brand,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    next.sort((a, b) => {
      if (sortMode === "rated") {
        return (
          closenessScore(b.comparison?.closeness) -
          closenessScore(a.comparison?.closeness)
        );
      }
      const aName = (
        a.comparison?.comparison?.fragrance1?.name || a.name
      ).toLowerCase();
      const bName = (
        b.comparison?.comparison?.fragrance1?.name || b.name
      ).toLowerCase();
      return aName.localeCompare(bName);
    });

    return next;
  }, [rows, search, sortMode]);

  const openRow = useMemo(
    () => rows.find((r) => r.id === openId) ?? null,
    [rows, openId]
  );

  return (
    <section id="alternatives" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
          Mister Fragrant&apos;s Alternatives
        </h2>
        <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-neutral-500">
          Closeness scores are editorial opinion, based on wearing both, not
          laboratory comparisons or claims of identical formulation.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="alternatives-search">
            Search by scent name or brand
          </label>
          <div className="relative min-w-0 sm:max-w-md sm:flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              id="alternatives-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by scent name or brand"
              className="w-full border-2 border-black bg-white py-2 pl-10 pr-3 text-[0.9rem] text-black outline-none placeholder:text-neutral-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortMode("az")}
              className={`border-2 border-black px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] ${
                sortMode === "az" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              A–Z
            </button>
            <button
              type="button"
              onClick={() => setSortMode("rated")}
              className={`border-2 border-black px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] ${
                sortMode === "rated"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              Top rated
            </button>
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
            No alternatives match this search.
          </p>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="mt-8 max-h-[min(32rem,62vh)] overflow-y-auto border-t border-black">
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
                    <span className="mb-0.5 mr-0.5 shrink-0 border-2 border-black bg-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium text-black shadow-[3px_3px_0_#000]">
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
