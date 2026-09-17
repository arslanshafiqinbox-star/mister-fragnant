"use client";

import { useEffect, useState } from "react";

type Retailer = { name: string; url: string };

type SponsoredDetails = {
  brand?: string;
  description?: string;
  rating?: number;
  retailers?: Retailer[];
};

type PerfumeStatus = "sponsored" | "featured" | "both";

type SponsoredRow = {
  id: string;
  name: string;
  details: SponsoredDetails;
  status?: PerfumeStatus | null;
};

type ListResponse = {
  ok: boolean;
  rows?: SponsoredRow[];
  message?: string;
};

function htmlToPlain(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function DescriptionBody({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="space-y-3 text-[0.9rem] leading-relaxed text-neutral-600 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-black"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-[0.9rem] leading-relaxed text-neutral-600">
      {content}
    </p>
  );
}

function WhereToBuyModal({
  item,
  onClose,
}: {
  item: SponsoredRow;
  onClose: () => void;
}) {
  const brand = item.details?.brand?.trim() || "";
  const description = item.details?.description?.trim() || "";
  const retailers = (item.details?.retailers ?? []).filter(
    (r) => r?.name?.trim() && r?.url?.trim()
  );

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Where to buy ${item.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close popup"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl">
        <article className="max-h-[85vh] overflow-y-auto border border-black bg-white p-6 shadow-[6px_6px_0_#000] sm:p-8">
          <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black">
            Where to buy
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
            {item.name}
          </h2>

          <p className="mt-3 font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.08em] text-neutral-400">
            {brand ? `${brand} · ` : ""}
            choose a retailer
          </p>

          {description ? (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <DescriptionBody content={description} />
            </div>
          ) : null}

          {retailers.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
              {retailers.map((retailer) => (
                <a
                  key={`${retailer.name}-${retailer.url}`}
                  href={retailer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.1em] text-black underline underline-offset-4 transition-opacity hover:opacity-60"
                >
                  {retailer.name} ↗
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.1em] text-neutral-400">
              No retailers listed.
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

export default function SponsoredStrip() {
  const [item, setItem] = useState<SponsoredRow | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sponsored-perfume");
        const json = (await res.json()) as ListResponse;
        if (!json.ok || cancelled) return;
        const rows = json.rows ?? [];
        const withStatus = rows.find(
          (row) =>
            row.status === "sponsored" ||
            row.status === "featured" ||
            row.status === "both"
        );
        setItem(withStatus ?? rows[0] ?? null);
      } catch {
        if (!cancelled) setItem(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!item) return null;

  const brand = item.details?.brand?.trim() || "";
  const rating =
    typeof item.details?.rating === "number" ? item.details.rating : null;
  const status = item.status ?? null;
  const showSponsored = status === "sponsored" || status === "both" || status == null;
  const showFeatured = status === "featured" || status === "both";
  const caption =
    htmlToPlain(item.details?.description ?? "") ||
    "This week's most popular scent";

  return (
    <section className="bg-white px-5 py-15 pb-30 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 border border-black bg-white px-4 py-3.5 shadow-[3px_3px_0_#000] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-4">
          {showSponsored ? (
            <span className="inline-flex w-fit shrink-0 bg-yellow-400 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.1em] text-black">
              Sponsored
            </span>
          ) : null}
          {showFeatured ? (
            <span className="inline-flex w-fit shrink-0 bg-[#98FF98] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.1em] text-black">
              Featured
            </span>
          ) : null}

    

          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium leading-none tracking-[-0.01em] text-black sm:text-[1.15rem]">
              {item.name}
            </span>
            {brand ? (
              <span className="text-[0.8rem] text-neutral-400">{brand}</span>
            ) : null}
          </div>

          <span className="hidden text-neutral-300 lg:inline" aria-hidden>
            ·
          </span>

          <p className="text-[0.75rem] text-neutral-400 sm:text-[0.8rem]">
            {caption}
          </p>

          {rating != null ? (
            <>
              <span className="hidden text-neutral-300 sm:inline" aria-hidden>
                ·
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[0.75rem] text-black sm:text-[0.8rem]">
                {Number.isInteger(rating) ? rating : rating.toFixed(1)}
                <span className="text-neutral-400">/10</span>
              </span>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 border border-black bg-black px-5 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-white shadow-[5px_5px_0_#cfcfcf] transition-[transform,box-shadow] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0_#cfcfcf] sm:w-auto"
        >
          Shop now ↗
        </button>
      </div>

      {open ? (
        <WhereToBuyModal item={item} onClose={() => setOpen(false)} />
      ) : null}
    </section>
  );
}
