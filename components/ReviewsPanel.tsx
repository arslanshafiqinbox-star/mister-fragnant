"use client";

import { useEffect, useState, type FormEvent } from "react";
import RatingSegments, {
  emptyRatingBreakdown,
  postedRating,
  type RatingBreakdown,
} from "@/components/RatingSegments";

type ReviewItem = {
  name: string;
  review: string;
  rating: number;
};

type SummaryResponse = {
  ok: boolean;
  fragrance?: {
    id: string;
    name: string;
    brand: string;
  };
  total_votes?: number;
  average_rating?: number | null;
  reviews?: ReviewItem[];
  message?: string;
};

type ReviewsPanelProps = {
  fragranceId: string;
  fragranceName: string;
  onClose: () => void;
};

export default function ReviewsPanel({
  fragranceId,
  fragranceName,
  onClose,
}: ReviewsPanelProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [breakdown, setBreakdown] = useState<RatingBreakdown>(
    emptyRatingBreakdown
  );
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  async function loadSummary() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/review/summary?fragrance_id=${encodeURIComponent(fragranceId)}`
      );
      const json = (await res.json()) as SummaryResponse;

      if (!json.ok) {
        throw new Error(json.message || "Failed to load reviews");
      }

      setReviews(json.reviews ?? []);
      setTotalVotes(json.total_votes ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragranceId]);

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
          fragrance_id: fragranceId,
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
      className="w-full border border-black bg-white shadow-[3px_3px_0_#000]"
      role="region"
      aria-label={`Reviews for ${fragranceName}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-black px-4 py-3 sm:px-5">
        <span className="bg-black px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white">
          Reviews
        </span>
        <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.08em] text-neutral-500 sm:text-[0.7rem]">
          {totalVotes.toLocaleString()} ratings
          <span className="mx-1.5 text-neutral-300">·</span>
          {reviews.length}
        </p>
      </div>

      <div className="px-4 py-2 sm:px-5">
        {loading ? (
          <p className="py-6 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading reviews…
          </p>
        ) : null}

        {error ? (
          <p className="py-6 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {!loading && !error && reviews.length === 0 ? (
          <p className="py-6 font-[family-name:var(--font-geist-mono)] text-sm text-neutral-400">
            No approved reviews yet. Be the first.
          </p>
        ) : null}

        {!loading && !error
          ? reviews.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="border-b border-neutral-200 py-4 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-[family-name:var(--font-geist-sans)] text-[0.9rem] font-semibold text-black">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[0.85rem] leading-relaxed text-neutral-700">
                      {item.review}
                    </p>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--font-hero-serif)] text-[0.95rem] text-neutral-500">
                    {item.rating}/10
                  </span>
                </div>
              </div>
            ))
          : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-black px-4 py-5 sm:px-5"
      >
        <RatingSegments value={breakdown} onChange={setBreakdown} />

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="mt-4 w-full border border-black bg-white px-3 py-2.5 text-[0.9rem] text-black outline-none placeholder:text-neutral-400"
        />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What does it smell like?"
          rows={3}
          className="mt-3 w-full resize-y border border-black bg-white px-3 py-2.5 text-[0.9rem] text-black outline-none placeholder:text-neutral-400"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-black px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.1em] text-white disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post review"}
          </button>
          {submitMessage ? (
            <p className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-600">
              {submitMessage}
            </p>
          ) : null}
        </div>
      </form>

      <button
        type="button"
        onClick={onClose}
        className="flex w-full items-center justify-center gap-2 bg-black py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
      >
        Close reviews
        <span aria-hidden>▴</span>
      </button>
    </div>
  );
}
