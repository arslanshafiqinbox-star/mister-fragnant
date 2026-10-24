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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
        setRows((json.rows ?? []).slice(0, 5));
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

  const now = new Date();
  const period = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`.toUpperCase();
  const openItem = rows.find((row) => row.id === openId) ?? null;

  return (
    <section className="bg-white px-5 pb-12 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(1.85rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Five
          </h2>
          <span className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.14em] text-neutral-400">
            {period}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map((item, index) => {
            const brand = item.details?.brand?.trim() || "";
            const rating =
              typeof item.details?.rating === "number"
                ? item.details.rating
                : null;
            const status = item.status ?? null;
            const showSponsored =
              status === "sponsored" || status === "both" || status == null;
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
                key={item.id}
                className="flex flex-col border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {showSponsored ? (
                      <span className="inline-flex bg-yellow-400 px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.1em] text-black">
                        Sponsored
                      </span>
                    ) : null}
                    {showFeatured ? (
                      <span className="inline-flex bg-[#98FF98] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] font-medium uppercase tracking-[0.1em] text-black">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                    #{rank}
                  </span>
                </div>

                <h3 className="mt-4 font-[family-name:var(--font-hero-serif)] text-[1.45rem] font-medium leading-[1.1] tracking-[-0.02em] text-black">
                  {item.name}
                </h3>
                {brand ? (
                  <p className="mt-1.5 text-[0.85rem] text-neutral-400">
                    {brand}
                  </p>
                ) : null}

                <div className="mt-auto pt-8">
                  {ratingLabel ? (
                    <p className="mb-4 text-[0.8rem] text-neutral-400">
                      Rated{" "}
                      <span className="font-medium text-black">
                        {ratingLabel}
                      </span>
                      <span>/10</span>
                    </p>
                  ) : (
                    <p className="mb-4 text-[0.8rem] text-neutral-400">
                      Rated —
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenId(item.id)}
                    className="inline-flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.62rem] font-medium uppercase tracking-[0.12em] text-white shadow-[4px_4px_0_#d4d4d4] transition-[transform,box-shadow] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#d4d4d4]"
                  >
                    Shop now ↗
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {openItem ? (
        <WhereToBuyModal item={openItem} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  );
}
