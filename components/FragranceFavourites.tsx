"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import RatingSegments, {
  emptyRatingBreakdown,
  postedRating,
  type RatingBreakdown,
} from "@/components/RatingSegments";

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

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.1em] text-black">
      {children}
    </span>
  );
}

function FavouritePopup({
  row,
  onClose,
  onReviewPosted,
}: {
  row: FavouriteRow;
  onClose: () => void;
  onReviewPosted: () => void;
}) {
  const { fragrance, reviews, total_votes, average_rating } = row;
  const scentTypes = fragrance.scent_type ?? [];
  const occasions = fragrance.occasion ?? [];
  const links = fragrance.associate_links ?? [];
  const primaryScent = scentTypes[0]?.name ?? "Uncategorized";

  const [breakdown, setBreakdown] = useState<RatingBreakdown>(emptyRatingBreakdown);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<string | null>(null);

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
          fragrance_id: fragrance.id,
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
      onReviewPosted();
    } catch (err) {
      setSubmitMessage(
        err instanceof Error ? err.message : "Could not post review"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-3 backdrop-blur-[1px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${fragrance.name} details`}
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

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2">
          {/* Left — fragrance */}
          <div className="flex flex-col border-b border-black p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="min-w-0">
                <span className="inline-block border border-black bg-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#000]">
                  {primaryScent}
                </span>
                {occasions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {occasions.map((o) => (
                      <Tag key={o.id}>{o.name}</Tag>
                    ))}
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
              {scentTypes.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {scentTypes.map((s) => (
                    <Tag key={s.id}>{s.name}</Tag>
                  ))}
                </div>
              ) : null}
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

          {/* Right — reviews */}
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
      </div>
    </div>
  );
}

export default function FragranceFavourites() {
  const [rows, setRows] = useState<FavouriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fragrance/top");
      const json = (await res.json()) as TopResponse;

      if (!json.ok) {
        throw new Error(json.message || "Failed to load favourites");
      }

      setRows(json.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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

        {!loading && !error && rows.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            No rated fragrances yet.
          </p>
        ) : null}

        {!loading && rows.length > 0 ? (
          <ol className="mt-10 list-none">
            {rows.map((row, index) => {
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
        <FavouritePopup
          row={openRow}
          onClose={() => setOpenId(null)}
          onReviewPosted={() => void load()}
        />
      ) : null}
    </section>
  );
}
