"use client";

import { useEffect, useMemo, useState } from "react";
import ReviewsPanel from "@/components/ReviewsPanel";
import WhereToBuyPanel from "@/components/WhereToBuyPanel";
import CompareTray, {
  toggleCompareSelection,
  type CompareItem,
} from "@/components/CompareTray";

type NamedEntity = {
  id: string;
  name: string;
  description: string | null;
};

type AssociateLink = {
  name: string;
  link: string;
};

type FragranceRow = {
  id: string;
  name: string;
  brand: string;
  occasion: NamedEntity[];
  scent_type: NamedEntity[];
  associate_links: AssociateLink[];
  total_votes: number;
  average_rating: number | null;
};

type ListResponse<T> = {
  ok: boolean;
  rows?: T[];
  message?: string;
};

const ALL = "all";

function RatingDisplay({ rating }: { rating: number | null }) {
  return (
    <span className="font-[family-name:var(--font-hero-serif)] leading-none">
      <span className="text-[0.95rem] text-black">
        {rating == null ? "—" : rating.toFixed(1)}
      </span>
      <span className="text-[0.7rem] text-neutral-400"> / 10</span>
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 border border-black px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] transition-colors sm:text-[0.7rem] ${
        active
          ? "bg-black text-white"
          : "bg-white text-black hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

function toggleId(set: Set<string>, id: string) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function FragranceCard({
  fragrance,
  reviewsOpen,
  buyOpen,
  compareSelected,
  onToggleReviews,
  onToggleBuy,
  onToggleCompare,
}: {
  fragrance: FragranceRow;
  reviewsOpen: boolean;
  buyOpen: boolean;
  compareSelected: boolean;
  onToggleReviews: () => void;
  onToggleBuy: () => void;
  onToggleCompare: () => void;
}) {
  const scentLabel = fragrance.scent_type[0]?.name ?? "Uncategorized";
  const btnBase =
    "inline-flex items-center gap-1 border border-black px-2 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.06em] shadow-[2px_2px_0_#000] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000]";

  return (
    <article className="flex h-full flex-col border border-black bg-white p-3.5 shadow-[3px_3px_0_#000] sm:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400">
          {scentLabel}
        </span>
        <RatingDisplay rating={fragrance.average_rating} />
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <p className="text-[0.7rem] text-neutral-500">{fragrance.brand}</p>
        <h3 className="mt-1.5 font-[family-name:var(--font-hero-serif)] text-[1.25rem] font-medium leading-[1.15] tracking-[-0.02em] text-black sm:text-[1.35rem]">
          {fragrance.name}
        </h3>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleReviews}
          aria-expanded={reviewsOpen}
          className={`${btnBase} bg-black text-white`}
        >
          {reviewsOpen ? "Hide reviews" : "See reviews"} ({fragrance.total_votes})
          <span aria-hidden className="text-[0.5rem]">
            {reviewsOpen ? "▴" : "▾"}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleBuy}
          aria-expanded={buyOpen}
          className={`${btnBase} ${
            buyOpen ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          Where to buy
          <span aria-hidden>{buyOpen ? "▴" : "↗"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareSelected}
          className={`${btnBase} ${
            compareSelected
              ? "bg-black text-white"
              : "bg-white text-black shadow-[1.5px_1.5px_0_#000]"
          }`}
        >
          {compareSelected ? "✓ Compare" : "+ Compare"}
        </button>
      </div>
    </article>
  );
}

export default function FragranceCabinet() {
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [fragrances, setFragrances] = useState<FragranceRow[]>([]);
  const [search, setSearch] = useState("");
  const [scentFilter, setScentFilter] = useState(ALL);
  const [occasionFilter, setOccasionFilter] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviewsIds, setOpenReviewsIds] = useState<Set<string>>(
    () => new Set()
  );
  const [openBuyIds, setOpenBuyIds] = useState<Set<string>>(() => new Set());
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  function toCompareItem(fragrance: FragranceRow): CompareItem {
    return {
      id: fragrance.id,
      name: fragrance.name,
      brand: fragrance.brand,
      occasion: fragrance.occasion,
      scent_type: fragrance.scent_type,
      total_votes: fragrance.total_votes,
      average_rating: fragrance.average_rating,
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [scentRes, occasionRes, catalogRes] = await Promise.all([
          fetch("/api/scent-type"),
          fetch("/api/occasion"),
          fetch("/api/fragrance/catalog"),
        ]);

        const [scentJson, occasionJson, catalogJson] = (await Promise.all([
          scentRes.json(),
          occasionRes.json(),
          catalogRes.json(),
        ])) as [
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<FragranceRow>,
        ];

        if (!scentJson.ok || !occasionJson.ok || !catalogJson.ok) {
          throw new Error(
            scentJson.message ||
              occasionJson.message ||
              catalogJson.message ||
              "Failed to load cabinet data"
          );
        }

        if (!cancelled) {
          setScentTypes(scentJson.rows ?? []);
          setOccasions(occasionJson.rows ?? []);
          setFragrances(catalogJson.rows ?? []);
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

    return fragrances.filter((f) => {
      if (q) {
        const haystack = `${f.name} ${f.brand}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (scentFilter !== ALL) {
        const match = f.scent_type.some((s) => s.id === scentFilter);
        if (!match) return false;
      }

      if (occasionFilter !== ALL) {
        const match = f.occasion.some((o) => o.id === occasionFilter);
        if (!match) return false;
      }

      return true;
    });
  }, [fragrances, search, scentFilter, occasionFilter]);

  return (
    <section id="cabinet" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Cabinet
          </h2>
          <p className="max-w-sm text-[0.8rem] leading-relaxed text-neutral-600 sm:pt-2 sm:text-right sm:text-[0.85rem]">
            Choose a scent type and/or an occasion to narrow things down, check
            out fragrance reviews, or find out where to buy it.
          </p>
        </div>

        <div className="mt-10 border border-black bg-white">
          <div className="border-b border-black px-4 py-4 sm:px-5">
            <label className="sr-only" htmlFor="cabinet-search">
              Search a scent or brand
            </label>
            <input
              id="cabinet-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search a scent or brand..."
              className="w-full border-0 border-b border-black bg-transparent pb-2 font-[family-name:var(--font-geist-sans)] text-[0.95rem] text-black outline-none placeholder:text-neutral-400"
            />
          </div>

          <div className="flex flex-col gap-5 px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
                Choose a scent type
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={scentFilter === ALL}
                  onClick={() => setScentFilter(ALL)}
                />
                {scentTypes.map((s) => (
                  <FilterChip
                    key={s.id}
                    label={s.name}
                    active={scentFilter === s.id}
                    onClick={() => setScentFilter(s.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
                Choose an occasion
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={occasionFilter === ALL}
                  onClick={() => setOccasionFilter(ALL)}
                />
                {occasions.map((o) => (
                  <FilterChip
                    key={o.id}
                    label={o.name}
                    active={occasionFilter === o.id}
                    onClick={() => setOccasionFilter(o.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-500">
            Loading fragrances…
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((fragrance) => {
              const reviewsOpen = openReviewsIds.has(fragrance.id);
              const buyOpen = openBuyIds.has(fragrance.id);
              const expanded = reviewsOpen || buyOpen;

              const cardProps = {
                fragrance,
                reviewsOpen,
                buyOpen,
                compareSelected: compareItems.some((c) => c.id === fragrance.id),
                onToggleReviews: () =>
                  setOpenReviewsIds((s) => toggleId(s, fragrance.id)),
                onToggleBuy: () =>
                  setOpenBuyIds((s) => toggleId(s, fragrance.id)),
                onToggleCompare: () =>
                  setCompareItems((list) =>
                    toggleCompareSelection(list, toCompareItem(fragrance))
                  ),
              };

              if (expanded) {
                return (
                  <div
                    key={fragrance.id}
                    className="col-span-full flex flex-col gap-3"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <FragranceCard {...cardProps} />
                    </div>
                    {reviewsOpen ? (
                      <ReviewsPanel
                        fragranceId={fragrance.id}
                        fragranceName={fragrance.name}
                        onClose={() =>
                          setOpenReviewsIds((s) => toggleId(s, fragrance.id))
                        }
                      />
                    ) : null}
                    {buyOpen ? (
                      <WhereToBuyPanel
                        fragranceId={fragrance.id}
                        onClose={() =>
                          setOpenBuyIds((s) => toggleId(s, fragrance.id))
                        }
                      />
                    ) : null}
                  </div>
                );
              }

              return <FragranceCard key={fragrance.id} {...cardProps} />;
            })}
          </div>
        )}

        {!loading && !error && filtered.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-500">
            No fragrances match these filters.
          </p>
        ) : null}
      </div>

      <CompareTray
        items={compareItems}
        onRemove={(id) =>
          setCompareItems((list) => list.filter((item) => item.id !== id))
        }
        onClear={() => setCompareItems([])}
      />
    </section>
  );
}
