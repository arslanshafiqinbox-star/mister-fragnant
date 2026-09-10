"use client";

import { useEffect, useMemo, useState } from "react";
import FragranceDetailPopup from "@/components/FragranceDetailPopup";

type NamedEntity = {
  id: string;
  name: string;
  description?: string | null;
};

type AssociateLink = {
  name: string;
  link: string;
};

type ReviewItem = {
  name: string;
  review: string;
  rating: number;
};

type FragranceDetail = {
  id: string;
  name: string;
  brand: string;
  occasion: NamedEntity[];
  scent_type: NamedEntity[];
  gender: NamedEntity[];
  strength: NamedEntity[];
  approx_price?: string | null;
  associate_links: AssociateLink[];
};

type FavouriteRow = {
  fragrance: FragranceDetail;
  total_votes: number;
  average_rating: number | null;
  reviews: ReviewItem[];
};

type TopResponse = {
  ok: boolean;
  count?: number;
  rows?: FavouriteRow[];
  message?: string;
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
      className={`shrink-0 border border-black px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] ${
        active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

export default function FragranceFavourites() {
  const [rows, setRows] = useState<FavouriteRow[]>([]);
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [genders, setGenders] = useState<NamedEntity[]>([]);
  const [strengths, setStrengths] = useState<NamedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scentFilter, setScentFilter] = useState(ALL);
  const [occasionFilter, setOccasionFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [strengthFilter, setStrengthFilter] = useState(ALL);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [topRes, scentRes, occasionRes, genderRes, strengthRes] =
        await Promise.all([
          fetch("/api/fragrance/top"),
          fetch("/api/scent-type"),
          fetch("/api/occasion"),
          fetch("/api/gender"),
          fetch("/api/strength"),
        ]);
      const [topJson, scentJson, occasionJson, genderJson, strengthJson] =
        (await Promise.all([
          topRes.json(),
          scentRes.json(),
          occasionRes.json(),
          genderRes.json(),
          strengthRes.json(),
        ])) as [
          TopResponse,
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
          ListResponse<NamedEntity>,
        ];

      if (!topJson.ok) {
        throw new Error(topJson.message || "Failed to load favourites");
      }

      setRows(topJson.rows ?? []);
      setScentTypes(scentJson.rows ?? []);
      setOccasions(occasionJson.rows ?? []);
      setGenders(genderJson.rows ?? []);
      setStrengths(strengthJson.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const f = row.fragrance;
      if (
        scentFilter !== ALL &&
        !(f.scent_type ?? []).some((s) => s.id === scentFilter)
      ) {
        return false;
      }
      if (
        occasionFilter !== ALL &&
        !(f.occasion ?? []).some((o) => o.id === occasionFilter)
      ) {
        return false;
      }
      if (
        genderFilter !== ALL &&
        !(f.gender ?? []).some((g) => g.id === genderFilter)
      ) {
        return false;
      }
      if (
        strengthFilter !== ALL &&
        !(f.strength ?? []).some((s) => s.id === strengthFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, scentFilter, occasionFilter, genderFilter, strengthFilter]);

  const openRow = useMemo(
    () => rows.find((r) => r.fragrance.id === openId) ?? null,
    [rows, openId]
  );

  return (
    <section id="favourites" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Favourites
          </h2>
          <p className="max-w-[16rem] text-[0.75rem] leading-relaxed text-neutral-500 sm:pt-2 sm:text-right sm:text-[0.8rem]">
            Ranked live by community rating. Highest score, top of the list.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border border-black bg-white px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500">
              Scent type
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
              Occasion
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
              Gender
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
              Strength
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
        </div>

        {error ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading favourites…
          </p>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            No rated fragrances match these filters.
          </p>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <ol className="mt-10 list-none">
            {filtered.map((row, index) => {
              const fragrance = row.fragrance;
              const rank = String(index + 1).padStart(2, "0");
              const score =
                row.average_rating == null
                  ? "— / 10"
                  : `${row.average_rating.toFixed(1)} / 10`;
              const isOpen = openId === fragrance.id;

              return (
                <li
                  key={fragrance.id}
                  className="border-b border-neutral-200 first:border-t first:border-neutral-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(fragrance.id)}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-4 bg-transparent py-5 text-left transition-colors hover:bg-[#f7f7f5] sm:gap-6"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white font-[family-name:var(--font-geist-mono)] text-[0.75rem] font-bold text-black shadow-[3px_3px_0_#000] sm:h-10 sm:w-10 sm:text-[0.8rem]">
                      {rank}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span className="font-[family-name:var(--font-hero-serif)] text-[1.15rem] font-medium leading-tight tracking-[-0.01em] text-black transition-transform duration-200 group-hover:translate-x-1.5 sm:text-[1.35rem]">
                          {fragrance.name}
                        </span>
                        <span className="ml-0.5 text-[0.7rem] text-neutral-400 transition-colors group-hover:text-neutral-500 sm:text-[0.75rem]">
                          {fragrance.brand}
                        </span>
                      </p>
                    </div>

                    <span className="shrink-0 border-2 border-black bg-white px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-bold tracking-wide text-black shadow-[3px_3px_0_#000] sm:px-3.5 sm:text-[0.8rem]">
                      {score}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>

      {openRow ? (
        <FragranceDetailPopup
          row={openRow}
          onClose={() => setOpenId(null)}
          onReviewPosted={() => void load()}
        />
      ) : null}
    </section>
  );
}
