"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import RatingSegments, {
  emptyRatingBreakdown,
  postedRating,
  type RatingBreakdown,
} from "@/components/RatingSegments";

export type FragrancePopupNamedEntity = {
  id: string;
  name: string;
  description?: string | null;
};

export type FragrancePopupLink = {
  name: string;
  link: string;
};

export type FragrancePopupReview = {
  name: string;
  review: string;
  rating: number;
};

export type FragrancePopupRow = {
  fragrance: {
    id: string;
    name: string;
    brand: string;
    occasion: FragrancePopupNamedEntity[];
    scent_type: FragrancePopupNamedEntity[];
    gender: FragrancePopupNamedEntity[];
    strength: FragrancePopupNamedEntity[];
    approx_price?: string | null;
    associate_links: FragrancePopupLink[];
  };
  total_votes: number;
  average_rating: number | null;
  reviews: FragrancePopupReview[];
};

type SummaryResponse = {
  ok: boolean;
  fragrance?: FragrancePopupRow["fragrance"];
  total_votes?: number;
  average_rating?: number | null;
  reviews?: FragrancePopupReview[];
  message?: string;
};

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.1em] text-black">
      {children}
    </span>
  );
}

function MetaRow({
  label,
  items,
}: {
  label: string;
  items: FragrancePopupNamedEntity[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-[7.5rem] shrink-0 pt-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item.id}>{item.name}</Tag>
        ))}
      </div>
    </div>
  );
}

export default function FragranceDetailPopup({
  row: initialRow,
  fragranceId,
  onClose,
  onReviewPosted,
}: {
  row?: FragrancePopupRow;
  fragranceId?: string;
  onClose: () => void;
  onReviewPosted?: () => void;
}) {
  const id = fragranceId ?? initialRow?.fragrance.id;
  const [row, setRow] = useState<FragrancePopupRow | null>(initialRow ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialRow);

  const [breakdown, setBreakdown] = useState<RatingBreakdown>(
    emptyRatingBreakdown
  );
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    if (!initialRow) setLoading(true);

    try {
      const res = await fetch(
        `/api/review/summary?fragrance_id=${encodeURIComponent(id)}`
      );
      const json = (await res.json()) as SummaryResponse;
      if (!json.ok || !json.fragrance) {
        throw new Error(json.message || "Failed to load fragrance");
      }
      setRow({
        fragrance: json.fragrance,
        total_votes: json.total_votes ?? 0,
        average_rating: json.average_rating ?? null,
        reviews: json.reviews ?? [],
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, initialRow]);

  useEffect(() => {
    if (initialRow) {
      setRow(initialRow);
      setLoading(false);
    }
    if (id && !initialRow) {
      void loadSummary();
    }
  }, [id, initialRow, loadSummary]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    const rating = postedRating(breakdown);
    if (rating == null) {
      setSubmitMessage("Rate projection, originality, and value.");
      return;
    }
    if (!comment.trim()) {
      setSubmitMessage("Write a short review.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragrance_id: id,
          name: name.trim() || "Anonymous",
          review: comment.trim(),
          rating,
        }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };

      if (!json.ok) {
        throw new Error(json.message || "Could not post review");
      }

      setSubmitMessage("Review submitted — pending approval.");
      setName("");
      setComment("");
      setBreakdown(emptyRatingBreakdown());
      await loadSummary();
      onReviewPosted?.();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "Could not post review"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const fragrance = row?.fragrance;
  const reviews = row?.reviews ?? [];
  const total_votes = row?.total_votes ?? 0;
  const average_rating = row?.average_rating ?? null;
  const scentTypes = fragrance?.scent_type ?? [];
  const occasions = fragrance?.occasion ?? [];
  const genders = fragrance?.gender ?? [];
  const strengths = fragrance?.strength ?? [];
  const approxPrice = fragrance?.approx_price?.trim() || null;
  const links = fragrance?.associate_links ?? [];
  const primaryScent = scentTypes[0]?.name ?? "Uncategorized";
  const title = fragrance?.name ?? "Fragrance details";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-3 backdrop-blur-[1px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} details`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close popup"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden border border-black bg-white shadow-[5px_5px_0_#000]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center border border-black bg-white font-[family-name:var(--font-geist-mono)] text-sm text-black shadow-[2px_2px_0_#000] transition hover:bg-black hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        {loading && !row ? (
          <p className="px-8 py-16 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading…
          </p>
        ) : null}

        {loadError && !row ? (
          <p className="px-8 py-16 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {loadError}
          </p>
        ) : null}

        {fragrance ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2">
            <div className="flex flex-col border-b border-black p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0">
                  <span className="inline-block border border-black bg-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#000]">
                    {primaryScent}
                  </span>
                  <MetaRow label="Scent types" items={scentTypes} />
                  <MetaRow label="Occasions" items={occasions} />
                  <MetaRow label="Gender" items={genders} />
                  <MetaRow label="Strength" items={strengths} />
                  {approxPrice ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                      <span className="w-[7.5rem] shrink-0 pt-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400">
                        Approx. price
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <Tag>{approxPrice}</Tag>
                      </div>
                    </div>
                  ) : null}
                </div>
                <p className="shrink-0 pt-0.5 font-[family-name:var(--font-hero-serif)] leading-none">
                  <span className="text-[1.35rem] text-black sm:text-[1.5rem]">
                    {average_rating == null ? "—" : average_rating.toFixed(1)}
                  </span>
                  <span className="text-[0.85rem] text-neutral-400"> / 10</span>
                </p>
              </div>

              <div className="mt-10">
                <p className="text-[0.8rem] text-neutral-400">{fragrance.brand}</p>
                <h3 className="mt-2 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.08] tracking-[-0.02em] text-black">
                  {fragrance.name}
                </h3>
              </div>

              <div className="mt-auto border-t border-neutral-200 pt-7">
                <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.16em] text-neutral-400">
                  Where to buy
                </p>
                <p className="mt-2 max-w-sm text-[0.8rem] leading-relaxed text-neutral-500">
                  You can buy this scent directly through any of the retailers
                  below.
                </p>
                {links.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
                    {links.map((link) => {
                      const key = `${link.name}-${link.link}`;
                      const isActive = activeLink === key;
                      const href = link.link.startsWith("http")
                        ? link.link
                        : `https://${link.link}`;
                      return (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseDown={() => setActiveLink(key)}
                          onBlur={() => setActiveLink(null)}
                          className={`inline-flex items-center gap-1 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.1em] transition-colors ${
                            isActive
                              ? "bg-black px-1.5 py-0.5 text-white"
                              : "border-b border-black pb-0.5 text-black hover:opacity-55"
                          }`}
                        >
                          {link.name}
                          <span aria-hidden>↗</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.08em] text-neutral-400">
                    No retailer links yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3 pr-8">
                <span className="inline-block border border-black bg-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#000]">
                  Reviews
                </span>
                <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-400">
                  {total_votes.toLocaleString()} ratings
                  <span className="mx-1.5 text-neutral-300">·</span>
                  {reviews.length}
                </p>
              </div>

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                {reviews.length === 0 ? (
                  <p className="py-6 font-[family-name:var(--font-geist-mono)] text-sm text-neutral-400">
                    No approved reviews yet.
                  </p>
                ) : (
                  reviews.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="border-b border-neutral-200 py-4 first:pt-1 last:border-b-0"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[0.95rem] font-semibold text-black">
                          {item.name}
                        </p>
                        <span className="shrink-0 font-[family-name:var(--font-hero-serif)] text-[0.95rem] text-neutral-400">
                          {item.rating}/10
                        </span>
                      </div>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-neutral-600">
                        {item.review}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-5 border-t border-neutral-200 pt-5"
              >
                <RatingSegments value={breakdown} onChange={setBreakdown} />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  className="mt-5 w-full border-0 border-b border-black bg-transparent pb-2.5 text-[0.9rem] text-black outline-none placeholder:text-neutral-400"
                />

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What does it smell like?"
                  rows={3}
                  className="mt-4 w-full resize-none border border-black bg-white px-3 py-3 text-[0.9rem] leading-relaxed text-black outline-none placeholder:text-neutral-400"
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-black px-5 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Posting…" : "Post review"}
                  </button>
                  {submitMessage ? (
                    <p className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-500">
                      {submitMessage}
                    </p>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
