"use client";

import { useEffect, useState, type FormEvent } from "react";
import RatingSegments, {
  emptyRatingBreakdown,
  postedRating,
  type RatingBreakdown,
} from "@/components/RatingSegments";

type NamedEntity = {
  id: string;
  name: string;
  description: string | null;
};

type ListResponse = {
  ok: boolean;
  rows?: NamedEntity[];
  message?: string;
};

type FragranceCreateResponse = {
  ok: boolean;
  row?: { id: string };
  message?: string;
};

type ReviewCreateResponse = {
  ok: boolean;
  message?: string;
};

const lineInput =
  "w-full border-0 border-b border-black bg-transparent pb-2 font-[family-name:var(--font-geist-sans)] text-[0.95rem] text-black outline-none placeholder:text-neutral-400";

const fieldLabel =
  "mb-2 block font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-neutral-500";

function AddFragranceModal({ onClose }: { onClose: () => void }) {
  const [scentTypes, setScentTypes] = useState<NamedEntity[]>([]);
  const [occasions, setOccasions] = useState<NamedEntity[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [scentTypeId, setScentTypeId] = useState("");
  const [occasionId, setOccasionId] = useState("");
  const [breakdown, setBreakdown] = useState<RatingBreakdown>(
    emptyRatingBreakdown
  );
  const [review, setReview] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [scentRes, occasionRes] = await Promise.all([
          fetch("/api/scent-type"),
          fetch("/api/occasion"),
        ]);
        const scentJson = (await scentRes.json()) as ListResponse;
        const occasionJson = (await occasionRes.json()) as ListResponse;

        if (!scentJson.ok) {
          throw new Error(scentJson.message || "Failed to load scent types");
        }
        if (!occasionJson.ok) {
          throw new Error(occasionJson.message || "Failed to load occasions");
        }

        if (!cancelled) {
          setScentTypes(scentJson.rows ?? []);
          setOccasions(occasionJson.rows ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setOptionsError(
            e instanceof Error ? e.message : "Failed to load options"
          );
        }
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedReview = review.trim();

    if (!trimmedName) {
      setError("Scent name is required.");
      return;
    }
    if (!scentTypeId) {
      setError("Pick a scent type.");
      return;
    }
    const rating = postedRating(breakdown);
    if (rating == null) {
      setError("Rate projection, originality, and value.");
      return;
    }
    if (!trimmedReview) {
      setError("Write a short review.");
      return;
    }

    setSubmitting(true);

    try {
      const fragranceRes = await fetch("/api/fragrance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          brand: brand.trim(),
          scent_type: [scentTypeId],
          occasion: occasionId ? [occasionId] : [],
          associate_links: [],
        }),
      });
      const fragranceJson =
        (await fragranceRes.json()) as FragranceCreateResponse;

      if (!fragranceJson.ok || !fragranceJson.row?.id) {
        throw new Error(
          fragranceJson.message || "Could not create fragrance"
        );
      }

      const fragranceId = fragranceJson.row.id;

      const reviewRes = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fragrance_id: fragranceId,
          name: reviewerName.trim() || "Anonymous",
          review: trimmedReview,
          rating,
        }),
      });
      const reviewJson = (await reviewRes.json()) as ReviewCreateResponse;

      if (!reviewJson.ok) {
        throw new Error(
          reviewJson.message ||
            "Fragrance created, but review could not be posted"
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Add a fragrance"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden border border-black bg-white shadow-[6px_6px_0_#000]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border border-black bg-white font-[family-name:var(--font-geist-mono)] text-sm text-black shadow-[2px_2px_0_#000] transition hover:bg-black hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          {success ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center py-10 text-center">
              <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
                Submitted
              </span>
              <h2 className="mt-6 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,4vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
                Your addition is forwarded to mediator.
              </h2>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-neutral-500">
                A moderator will review the fragrance and your rating before
                they appear on the site.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 bg-black px-5 py-3 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#000] transition-[transform,box-shadow] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#000]"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
                Not on here yet?
              </span>

              <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.85rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
                Add a fragrance.
              </h2>

              <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-neutral-500">
                Name, type, rating, and review are all required. Brand is the
                only optional field.
              </p>

              {optionsError ? (
                <p className="mt-6 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
                  {optionsError}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-8 space-y-7">
                <div>
                  <label htmlFor="add-scent-name" className={fieldLabel}>
                    Scent name
                  </label>
                  <input
                    id="add-scent-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Midnight Amber"
                    className={lineInput}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
                  <div>
                    <label htmlFor="add-brand" className={fieldLabel}>
                      Brand (optional)
                    </label>
                    <input
                      id="add-brand"
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Independent"
                      className={lineInput}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-scent-type" className={fieldLabel}>
                      Scent type
                    </label>
                    <select
                      id="add-scent-type"
                      value={scentTypeId}
                      onChange={(e) => setScentTypeId(e.target.value)}
                      className={`${lineInput} appearance-none pr-6`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%23000' stroke-width='1.5' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.25rem center",
                      }}
                    >
                      <option value="">Choose…</option>
                      {scentTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="add-occasion" className={fieldLabel}>
                    Occasion (optional)
                  </label>
                  <select
                    id="add-occasion"
                    value={occasionId}
                    onChange={(e) => setOccasionId(e.target.value)}
                    className={`${lineInput} appearance-none pr-6`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%23000' stroke-width='1.5' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.25rem center",
                    }}
                  >
                    <option value="">Choose…</option>
                    {occasions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className={fieldLabel}>Your rating</p>
                  <RatingSegments value={breakdown} onChange={setBreakdown} />
                </div>

                <div>
                  <label htmlFor="add-reviewer" className={fieldLabel}>
                    Your name (optional)
                  </label>
                  <input
                    id="add-reviewer"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Anonymous"
                    className={lineInput}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="add-review" className={fieldLabel}>
                    Your review
                  </label>
                  <textarea
                    id="add-review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="What does it smell like? When would you wear it?"
                    rows={4}
                    className="w-full resize-y border border-black bg-white px-3 py-3 font-[family-name:var(--font-geist-sans)] text-[0.95rem] text-black outline-none placeholder:text-neutral-400"
                  />
                </div>

                {error ? (
                  <p className="font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || Boolean(optionsError)}
                  className="w-full bg-black py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_#a3a3a3] transition-[transform,box-shadow,opacity] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#a3a3a3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit fragrance"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddFragrance() {
  const [open, setOpen] = useState(false);

  return (
    <section id="add-scent" className="relative scroll-mt-[4.25rem] overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="inline-block border border-black bg-white px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#000]">
          Missing something?
        </span>

        <h2 className="mt-6 font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
          Add the fragrance you can&apos;t find here.
        </h2>

        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-neutral-500 sm:text-[1.05rem]">
          Add it, rate it — tell us what it smells like.
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-9 bg-black px-6 py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_#a3a3a3] transition-[transform,box-shadow] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#a3a3a3]"
        >
          Add a fragrance +
        </button>
      </div>

      {open ? <AddFragranceModal onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
