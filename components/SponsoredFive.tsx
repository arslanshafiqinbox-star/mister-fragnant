"use client";

import { useEffect, useState } from "react";
import {
  WhereToBuyModal,
  type SponsoredRow,
} from "@/components/SponsoredStrip";

type ListResponse = {
  ok: boolean;
  rows?: SponsoredRow[];
  message?: string;
};

function shopButtonClass(wide: boolean) {
  return [
    "inline-flex items-center justify-center gap-2 bg-black px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] font-medium uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#d4d4d4] transition-colors hover:bg-brand-red hover:text-black",
    wide ? "w-full" : "shrink-0",
  ].join(" ");
}

function FiveCard({
  item,
  index,
  featured,
  onShop,
}: {
  item: SponsoredRow;
  index: number;
  featured?: boolean;
  onShop: () => void;
}) {
  const brand = item.details?.brand?.trim() || "";
  const rating =
    typeof item.details?.rating === "number" ? item.details.rating : null;
  const status = item.status ?? null;
  const showAd = status === "sponsored" || status === "both";
  const showFeatured = status === "featured" || status === "both";
  const rank = item.rank ?? index + 1;
  const ratingLabel =
    rating == null
      ? null
      : Number.isInteger(rating)
        ? String(rating)
        : rating.toFixed(1);

  return (
    <article
      className={`flex h-full flex-col border-2 border-black bg-brand-cream p-4 shadow-[4px_4px_0_#000] ${
        featured ? "p-6 sm:p-8" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {showAd ? (
            <span className="inline-flex bg-brand-yellow px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.1em] text-black">
              Ad
            </span>
          ) : null}
          {showFeatured ? (
            <span className="inline-flex bg-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.1em] text-white">
              Featured
            </span>
          ) : null}
        </div>
        <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
          #{rank}
        </span>
      </div>

      <h3
        className={`mt-4 font-[family-name:var(--font-hero-serif)] font-medium leading-[1.08] tracking-[-0.03em] text-black ${
          featured
            ? "mt-10 text-[clamp(2.4rem,4.5vw,4.25rem)]"
            : "text-[1.35rem] sm:text-[1.5rem]"
        }`}
      >
        {item.name}
      </h3>
      {brand ? (
        <p className={`mt-1.5 text-neutral-400 ${featured ? "text-[1rem]" : "text-[0.85rem]"}`}>
          {brand}
        </p>
      ) : null}

      {featured ? (
        <div className="mt-auto flex items-end justify-between gap-4 pt-10">
          <p className="text-[0.9rem] text-neutral-400">
            Rated{" "}
            <span className="font-medium text-black">
              {ratingLabel ?? "—"}
            </span>
            {ratingLabel ? "/10" : ""}
          </p>
          <button
            type="button"
            onClick={onShop}
            className={shopButtonClass(false)}
          >
            Shop now ↗
          </button>
        </div>
      ) : (
        <div className="mt-auto pt-6">
          <p className="mb-4 text-[0.8rem] text-neutral-400">
            Rated{" "}
            <span className="font-medium text-black">{ratingLabel ?? "—"}</span>
            {ratingLabel ? "/10" : ""}
          </p>
          <button type="button" onClick={onShop} className={shopButtonClass(true)}>
            Shop now ↗
          </button>
        </div>
      )}
    </article>
  );
}

export default function SponsoredFive() {
  const [rows, setRows] = useState<SponsoredRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sponsored-perfume");
        const json = (await res.json()) as ListResponse;
        if (!json.ok || cancelled) return;
        const sorted = [...(json.rows ?? [])].sort((a, b) => {
          const ar =
            a.rank != null && a.rank >= 1 ? a.rank : Number.POSITIVE_INFINITY;
          const br =
            b.rank != null && b.rank >= 1 ? b.rank : Number.POSITIVE_INFINITY;
          return ar - br;
        });
        setRows(sorted.slice(0, 5));
      } catch {
        if (!cancelled) setRows([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return null;

  const [lead, ...rest] = rows;
  const openItem = rows.find((row) => row.id === openId) ?? null;

  return (
    <section className="bg-brand-blue px-5 pb-12 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <h2 className="five-title relative z-10 mb-4 ml-2 inline-block cursor-default border-[3px] border-black bg-brand-cream px-5 py-2.5 font-[family-name:var(--font-hero-serif)] text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-black shadow-[5px_5px_0_#000] sm:mb-5 sm:px-6 sm:text-[1.65rem]">
          Mister Fragrant&apos;s Five
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <FiveCard
            item={lead}
            index={0}
            featured
            onShop={() => setOpenId(lead.id)}
          />
          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rest.map((item, index) => (
                <FiveCard
                  key={item.id}
                  item={item}
                  index={index + 1}
                  onShop={() => setOpenId(item.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {openItem ? (
        <WhereToBuyModal item={openItem} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  );
}
