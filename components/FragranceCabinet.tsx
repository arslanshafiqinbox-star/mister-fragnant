"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CompareTray, {
  toggleCompareSelection,
  type CompareItem,
} from "@/components/CompareTray";
import FragranceDetailPopup from "@/components/FragranceDetailPopup";

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
  gender: NamedEntity[];
  strength: NamedEntity[];
  approx_price?: string | null;
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
const INITIAL_VISIBLE = 6;

type SortBy = "rating" | "price";

function parseApproxAmount(value?: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

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

function FragranceCard({
  fragrance,
  compareSelected,
  popupOpen,
  onOpenDetails,
  onToggleCompare,
}: {
  fragrance: FragranceRow;
  compareSelected: boolean;
  popupOpen: boolean;
  onOpenDetails: () => void;
  onToggleCompare: () => void;
}) {
  const scentLabel = fragrance.scent_type[0]?.name ?? "Uncategorized";
  const btnBase =
    "inline-flex items-center gap-1 border border-black px-2 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.06em] shadow-[2px_2px_0_#000] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000]";

  return (
    <article
      className="flex h-full cursor-pointer flex-col border border-black bg-white p-3.5 shadow-[3px_3px_0_#000] transition-colors hover:bg-[#f7f7f5] sm:p-4"
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-expanded={popupOpen}
    >
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
        <span className={`${btnBase} bg-black text-white`}>
          See reviews ({fragrance.total_votes})
          <span aria-hidden className="text-[0.5rem]">
            ↗
          </span>
        </span>

        <span className={`${btnBase} bg-white text-black`}>
          Where to buy
          <span aria-hidden>↗</span>
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare();
          }}
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
  const [genders, setGenders] = useState<NamedEntity[]>([]);
  const [strengths, setStrengths] = useState<NamedEntity[]>([]);
  const [fragrances, setFragrances] = useState<FragranceRow[]>([]);
  const [search, setSearch] = useState("");
  const [scentFilter, setScentFilter] = useState(ALL);
  const [occasionFilter, setOccasionFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [strengthFilter, setStrengthFilter] = useState(ALL);
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  function toCompareItem(fragrance: FragranceRow): CompareItem {
    return {
      id: fragrance.id,
      name: fragrance.name,
      brand: fragrance.brand,
      occasion: fragrance.occasion,
      scent_type: fragrance.scent_type,
      gender: fragrance.gender ?? [],
      strength: fragrance.strength ?? [],
      approx_price: fragrance.approx_price ?? null,
      total_votes: fragrance.total_votes,
      average_rating: fragrance.average_rating,
    };
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [scentRes, occasionRes, genderRes, strengthRes, catalogRes] =
        await Promise.all([
          fetch("/api/scent-type"),
          fetch("/api/occasion"),
          fetch("/api/gender"),
          fetch("/api/strength"),
          fetch("/api/fragrance/catalog"),
        ]);

      const [scentJson, occasionJson, genderJson, strengthJson, catalogJson] =
        (await Promise.all([
          scentRes.json(),
          occasionRes.json(),
          genderRes.json(),
          strengthRes.json(),
          catalogRes.json(),
        ])) as [
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<FragranceRow>,
        ];

      if (
        !scentJson.ok ||
        !occasionJson.ok ||
        !genderJson.ok ||
        !strengthJson.ok ||
        !catalogJson.ok
      ) {
        throw new Error(
          scentJson.message ||
            occasionJson.message ||
            genderJson.message ||
            strengthJson.message ||
            catalogJson.message ||
            "Failed to load cabinet data"
        );
      }

      setScentTypes(scentJson.rows ?? []);
      setOccasions(occasionJson.rows ?? []);
      setGenders(genderJson.rows ?? []);
      setStrengths(strengthJson.rows ?? []);
      setFragrances(catalogJson.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const next = fragrances.filter((f) => {
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

      if (genderFilter !== ALL) {
        const match = (f.gender ?? []).some((g) => g.id === genderFilter);
        if (!match) return false;
      }

      if (strengthFilter !== ALL) {
        const match = (f.strength ?? []).some((s) => s.id === strengthFilter);
        if (!match) return false;
      }

      return true;
    });

    return next.slice().sort((a, b) => {
      if (sortBy === "price") {
        const pa = parseApproxAmount(a.approx_price);
        const pb = parseApproxAmount(b.approx_price);
        if (pa == null && pb == null) {
          // fall through to rating
        } else if (pa == null) return 1;
        else if (pb == null) return -1;
        else if (pa !== pb) return pa - pb;
      }

      const ra = a.average_rating ?? -1;
      const rb = b.average_rating ?? -1;
      if (rb !== ra) return rb - ra;
      return b.total_votes - a.total_votes;
    });
  }, [
    fragrances,
    search,
    scentFilter,
    occasionFilter,
    genderFilter,
    strengthFilter,
    sortBy,
  ]);

  useEffect(() => {
    setShowAll(false);
  }, [search, scentFilter, occasionFilter, genderFilter, strengthFilter, sortBy]);

  const visible = showAll
    ? filtered
    : filtered.slice(0, INITIAL_VISIBLE);
  const canLoadMore = !showAll && filtered.length > INITIAL_VISIBLE;

  return (
    <section id="cabinet" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Cabinet
          </h2>
          <p className="max-w-sm text-[0.8rem] leading-relaxed text-neutral-600 sm:pt-2 sm:text-right sm:text-[0.85rem]">
            Choose a scent type, occasion, gender, or strength to narrow things
            down, check out fragrance reviews, or find out where to buy it.
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

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
                Choose a gender
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={genderFilter === ALL}
                  onClick={() => setGenderFilter(ALL)}
                />
                {genders.map((g) => (
                  <FilterChip
                    key={g.id}
                    label={g.name}
                    active={genderFilter === g.id}
                    onClick={() => setGenderFilter(g.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
                Choose a strength
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All"
                  active={strengthFilter === ALL}
                  onClick={() => setStrengthFilter(ALL)}
                />
                {strengths.map((s) => (
                  <FilterChip
                    key={s.id}
                    label={s.name}
                    active={strengthFilter === s.id}
                    onClick={() => setStrengthFilter(s.id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
                Sort by
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="Rating"
                  active={sortBy === "rating"}
                  onClick={() => setSortBy("rating")}
                />
                <FilterChip
                  label="Price"
                  active={sortBy === "price"}
                  onClick={() => setSortBy("price")}
                />
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
            {visible.map((fragrance) => (
              <FragranceCard
                key={fragrance.id}
                fragrance={fragrance}
                popupOpen={openId === fragrance.id}
                compareSelected={compareItems.some((c) => c.id === fragrance.id)}
                onOpenDetails={() => setOpenId(fragrance.id)}
                onToggleCompare={() =>
                  setCompareItems((list) =>
                    toggleCompareSelection(list, toCompareItem(fragrance))
                  )
                }
              />
            ))}
          </div>
        )}

        {!loading && !error && canLoadMore ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="border border-black bg-white px-5 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.1em] text-black shadow-[3px_3px_0_#000] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000]"
            >
              Load more
            </button>
          </div>
        ) : null}

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

      {openId ? (
        <FragranceDetailPopup
          fragranceId={openId}
          onClose={() => setOpenId(null)}
          onReviewPosted={async () => {
            const catalogRes = await fetch("/api/fragrance/catalog");
            const catalogJson =
              (await catalogRes.json()) as ListResponse<FragranceRow>;
            if (catalogJson.ok) setFragrances(catalogJson.rows ?? []);
          }}
        />
      ) : null}
    </section>
  );
}
