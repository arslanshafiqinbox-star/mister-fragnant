"use client";

import { useEffect, useState, type ReactNode } from "react";

type NamedEntity = {
  id: string;
  name: string;
  description?: string | null;
};

type AssociateLink = {
  name: string;
  link: string;
};

type SummaryFragrance = {
  id: string;
  name: string;
  brand: string;
  occasion: NamedEntity[];
  scent_type: NamedEntity[];
  associate_links: AssociateLink[];
};

type SummaryResponse = {
  ok: boolean;
  fragrance?: SummaryFragrance;
  total_votes?: number;
  average_rating?: number | null;
  message?: string;
};

type WhereToBuyPanelProps = {
  fragranceId: string;
  onClose: () => void;
};

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.08em] text-black">
      {children}
    </span>
  );
}

export default function WhereToBuyPanel({
  fragranceId,
  onClose,
}: WhereToBuyPanelProps) {
  const [fragrance, setFragrance] = useState<SummaryFragrance | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/review/summary?fragrance_id=${encodeURIComponent(fragranceId)}`
        );
        const json = (await res.json()) as SummaryResponse;

        if (!json.ok || !json.fragrance) {
          throw new Error(json.message || "Failed to load summary");
        }

        if (!cancelled) {
          setFragrance(json.fragrance);
          setAverageRating(json.average_rating ?? null);
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
  }, [fragranceId]);

  const scentTypes = fragrance?.scent_type ?? [];
  const occasions = fragrance?.occasion ?? [];
  const links = fragrance?.associate_links ?? [];
  const primaryScent = scentTypes[0]?.name ?? "Uncategorized";
  const ratingLabel =
    averageRating == null ? "— / 10" : `${averageRating.toFixed(1)} / 10`;

  return (
    <div
      className="w-full border border-black bg-white shadow-[3px_3px_0_#000]"
      role="region"
      aria-label={
        fragrance
          ? `Where to buy ${fragrance.name}`
          : "Where to buy"
      }
    >
      {loading ? (
        <p className="px-4 py-8 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400 sm:px-6">
          Loading…
        </p>
      ) : null}

      {error ? (
        <p className="px-4 py-8 font-[family-name:var(--font-geist-mono)] text-sm text-red-600 sm:px-6">
          {error}
        </p>
      ) : null}

      {!loading && !error && fragrance ? (
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
                {primaryScent}
              </span>
              {occasions.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {occasions.map((o) => (
                    <Tag key={o.id}>{o.name}</Tag>
                  ))}
                </div>
              ) : null}
            </div>
            <span className="shrink-0 font-[family-name:var(--font-hero-serif)] text-[1rem] text-neutral-500 sm:text-[1.1rem]">
              {ratingLabel}
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[0.75rem] text-neutral-500">{fragrance.brand}</p>
            <h3 className="mt-1.5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
              {fragrance.name}
            </h3>
            {scentTypes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scentTypes.map((s) => (
                  <Tag key={s.id}>{s.name}</Tag>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-400">
              Where to buy
            </p>
            <p className="mt-2 text-[0.8rem] text-neutral-500">
              You can buy this scent directly through any of the retailers
              below.
            </p>

            {links.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {links.map((link) => (
                  <a
                    key={`${link.name}-${link.link}`}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border-b border-black pb-0.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-60"
                  >
                    {link.name}
                    <span aria-hidden>↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.08em] text-neutral-400">
                No retailer links yet.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 bg-black py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
      >
        <span aria-hidden>▴</span>
        Close
        <span aria-hidden>▾</span>
      </button>
    </div>
  );
}
