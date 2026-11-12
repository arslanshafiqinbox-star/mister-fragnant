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
          ? "bg-brand-red text-black"
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

  useEffect(() => {
    if (!openId || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    document.getElementById("cabinet")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [openId]);

  return (
    <section id="cabinet" className="scroll-mt-[4.25rem] bg-brand-blue px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <h2 className="five-title relative z-10 mb-4 ml-2 inline-block cursor-default border-[3px] border-black bg-brand-cream px-5 py-2.5 font-[family-name:var(--font-hero-serif)] text-[1.45rem] font-semibold leading-none tracking-[-0.02em] text-black shadow-[5px_5px_0_#000] sm:mb-5 sm:px-6 sm:text-[1.85rem]">
          Mister Fragrant&apos;s Cabinet
        </h2>

        <div className="border-[3px] border-black bg-brand-cream shadow-[6px_6px_0_#000]">
          <div
            className={`flex-col gap-3 border-b-2 border-black px-4 py-4 sm:flex-row sm:items-center sm:gap-3 sm:px-5 ${
              openId ? "hidden lg:flex" : "flex"
            }`}
          >
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
                  sortMode === "az" ? "bg-brand-red text-black" : "bg-white text-black"
                }`}
              >
                A–Z
              </button>
              <button
                type="button"
                onClick={() => setSortMode("rated")}
                className={`border-2 border-black px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] ${
                  sortMode === "rated"
                    ? "bg-brand-red text-black"
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
            <div
              className={`grid-cols-1 gap-6 border-b-2 border-black px-4 py-5 sm:px-5 lg:grid-cols-2 ${
                openId ? "hidden lg:grid" : "grid"
              }`}
            >
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
            <div
              className={`grid lg:h-[min(38rem,72vh)] lg:grid-cols-[minmax(16.5rem,19.5rem)_minmax(0,1fr)] ${
                openId ? "h-auto" : "h-[min(32rem,62vh)]"
              }`}
            >
              <div
                className={`h-full min-h-0 flex-col border-b-2 border-black lg:border-b-0 lg:border-r-2 ${
                  openId ? "hidden lg:flex" : "flex"
                }`}
              >
                <p className="shrink-0 px-4 py-3 font-[family-name:var(--font-geist-mono)] text-[0.62rem] uppercase tracking-[0.1em] text-neutral-400">
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
                          onClick={() => setOpenId(fragrance.id)}
                          className={`flex w-full items-center justify-between gap-3 border-t px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-black/10 bg-brand-cream text-black hover:bg-white"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium leading-tight tracking-[-0.02em]">
                              {fragrance.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[0.72rem] text-neutral-400">
                              {fragrance.brand}
                            </span>
                          </span>
                          <span
                            className={`mb-0.5 mr-0.5 shrink-0 border-2 bg-brand-red px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.72rem] leading-none text-black ${
                              active
                                ? "border-white shadow-[2px_2px_0_#fff]"
                                : "border-black shadow-[2px_2px_0_#000]"
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

              <div
                className={`relative min-h-0 ${
                  openId
                    ? "max-lg:h-auto max-lg:overflow-visible lg:h-full lg:overflow-hidden"
                    : "hidden h-full overflow-hidden lg:block"
                }`}
              >
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
                  <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto px-6 text-center">
                    <h3 className="font-[family-name:var(--font-hero-serif)] text-[clamp(1.65rem,2.8vw,2.15rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
                      Browse reviews. Add your rating.
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-neutral-400">
                      Pick a fragrance to get started.
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
