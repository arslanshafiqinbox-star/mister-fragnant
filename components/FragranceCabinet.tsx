"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
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

function EmptyBottle() {
  return (
    <svg
      viewBox="0 0 90 140"
      className="h-40 w-[6.5rem] rotate-[18deg]"
      aria-hidden
    >
      <rect
        x="34"
        y="8"
        width="22"
        height="14"
        rx="2"
        fill="#F5C400"
        stroke="#111"
        strokeWidth="3"
      />
      <rect
        x="38"
        y="22"
        width="14"
        height="8"
        fill="#F5C400"
        stroke="#111"
        strokeWidth="3"
      />
      <path
        d="M24 32H66L70 120C70 128 64 134 56 134H34C26 134 20 128 20 120L24 32Z"
        fill="#F5C400"
        stroke="#111"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="34"
        y="58"
        width="22"
        height="16"
        fill="#fff"
        stroke="#111"
        strokeWidth="2.6"
      />
      <line
        x1="38"
        y1="66"
        x2="52"
        y2="66"
        stroke="#111"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
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
      className={`shrink-0 border-2 border-black px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] transition-colors sm:text-[0.7rem] ${
        active
          ? "bg-black text-white"
          : "bg-white text-black hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
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
  const [sortMode, setSortMode] = useState<"az" | "rated">("az");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
      if (sortMode === "az") {
        const byName = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
        if (byName !== 0) return byName;
        return a.brand.localeCompare(b.brand, undefined, {
          sensitivity: "base",
        });
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
    sortMode,
  ]);

  useEffect(() => {
    if (openId && !filtered.some((f) => f.id === openId)) {
      setOpenId(null);
    }
  }, [filtered, openId]);

  return (
    <section id="cabinet" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
          Mister Fragrant&apos;s Cabinet
        </h2>

        <div className="mt-10 border-2 border-black bg-white">
          <div className="flex flex-col gap-3 border-b-2 border-black px-4 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
            <label className="sr-only" htmlFor="cabinet-search">
              Search by scent name or brand
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                id="cabinet-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by scent name or brand"
                className="w-full border-2 border-black bg-white py-2 pl-10 pr-3 text-[0.9rem] text-black outline-none placeholder:text-neutral-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="ml-auto inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] text-black sm:ml-4"
                aria-expanded={filtersOpen}
              >
                Filters
                {filtersOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="grid grid-cols-1 gap-6 border-b-2 border-black px-4 py-5 sm:px-5 lg:grid-cols-2">
              <div>
                <p className="mb-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
                  Choose a scent type
                </p>
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
              <div>
                <p className="mb-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
                  Choose an occasion
                </p>
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
              <div>
                <p className="mb-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
                  Choose a gender
                </p>
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
              <div>
                <p className="mb-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
                  Choose a strength
                </p>
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
            </div>
          ) : null}

          {error ? (
            <p className="px-4 py-8 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="px-4 py-16 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
              Loading fragrances…
            </p>
          ) : (
            <div className="grid min-h-[28rem] lg:h-[min(36rem,70vh)] lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
              <div className="flex min-h-[22rem] flex-col border-b-2 border-black lg:border-b-0 lg:border-r-2">
                <p className="px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
                  {filtered.length} fragrance{filtered.length === 1 ? "" : "s"}
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-8 font-[family-name:var(--font-geist-mono)] text-sm text-neutral-400">
                      No fragrances match these filters.
                    </p>
                  ) : (
                    filtered.map((fragrance) => {
                      const active = openId === fragrance.id;
                      return (
                        <button
                          key={fragrance.id}
                          type="button"
                          onClick={() =>
                            setOpenId((id) =>
                              id === fragrance.id ? null : fragrance.id
                            )
                          }
                          className={`flex w-full items-center justify-between gap-4 border-t px-5 py-4 text-left transition-colors ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-neutral-200 bg-white text-black hover:bg-[#f7f7f5]"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-[family-name:var(--font-hero-serif)] text-[1.2rem] font-medium leading-tight tracking-[-0.02em]">
                              {fragrance.name}
                            </span>
                            <span
                              className={`mt-1 block truncate text-[0.8rem] ${
                                active ? "text-neutral-400" : "text-neutral-400"
                              }`}
                            >
                              {fragrance.brand}
                            </span>
                          </span>
                          <span
                            className={`mb-0.5 mr-0.5 shrink-0 border-2 px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.8rem] leading-none ${
                              active
                                ? "border-white text-white shadow-[2px_2px_0_#fff]"
                                : "border-black bg-white text-black shadow-[2px_2px_0_#000]"
                            }`}
                          >
                            {fragrance.average_rating == null
                              ? "—"
                              : fragrance.average_rating.toFixed(1)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="relative min-h-[22rem]">
                {openId ? (
                  <FragranceDetailPopup
                    embedded
                    fragranceId={openId}
                    onClose={() => setOpenId(null)}
                    onReviewPosted={async () => {
                      const catalogRes = await fetch("/api/fragrance/catalog");
                      const catalogJson =
                        (await catalogRes.json()) as ListResponse<FragranceRow>;
                      if (catalogJson.ok) setFragrances(catalogJson.rows ?? []);
                    }}
                  />
                ) : (
                  <div className="flex h-full min-h-[22rem] flex-col items-center justify-center px-6 text-center">
                    <EmptyBottle />
                    <h3 className="mt-8 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,3vw,2.35rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
                      Pick a fragrance
                    </h3>
                    <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-neutral-400">
                      Choose one from the list to read its reviews and add your
                      own.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
