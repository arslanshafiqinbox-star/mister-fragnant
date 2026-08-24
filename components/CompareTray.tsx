"use client";

import { useEffect, useState, type ReactNode } from "react";

export type CompareItem = {
  id: string;
  name: string;
  brand: string;
  occasion: { id: string; name: string }[];
  scent_type: { id: string; name: string }[];
  total_votes: number;
  average_rating: number | null;
};

/** Toggle selection; max 2 with FIFO when adding a third. */
export function toggleCompareSelection(
  list: CompareItem[],
  item: CompareItem
): CompareItem[] {
  if (list.some((x) => x.id === item.id)) {
    return list.filter((x) => x.id !== item.id);
  }
  if (list.length < 2) return [...list, item];
  return [list[1], item];
}

function TagList({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <span className="text-[0.85rem] text-neutral-400">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="border border-black px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.08em] text-black"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CompareRow({
  label,
  left,
  right,
  last,
}: {
  label: string;
  left: ReactNode;
  right: ReactNode;
  last?: boolean;
}) {
  const edge = last ? "" : "border-b";
  return (
    <>
      <div
        className={`${edge} border-r border-black px-3 py-4 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-400`}
      >
        {label}
      </div>
      <div className={`${edge} border-r border-black px-4 py-4`}>{left}</div>
      <div className={`${edge} border-black px-4 py-4`}>{right}</div>
    </>
  );
}

function CompareModal({
  items,
  onClose,
}: {
  items: [CompareItem, CompareItem];
  onClose: () => void;
}) {
  const [a, b] = items;

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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Compare 2 scents"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close compare"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl">
        <article className="relative max-h-[85vh] overflow-y-auto border border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center border border-black bg-white font-[family-name:var(--font-geist-mono)] text-sm text-black shadow-[2px_2px_0_#000] transition hover:bg-black hover:text-white sm:right-4 sm:top-4"
            aria-label="Close"
          >
            ×
          </button>

          <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[3px_3px_0_#000]">
            Side by side
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.6rem,4vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
            Compare 2 Scents
          </h2>

          <div className="mt-8 overflow-x-auto border border-black">
            <div className="grid min-w-[520px] grid-cols-[5.5rem_1fr_1fr]">
              <CompareRow
                label="Scent"
                left={
                  <>
                    <p className="text-[0.75rem] text-neutral-400">{a.brand}</p>
                    <p className="mt-1 font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium text-black sm:text-[1.15rem]">
                      {a.name}
                    </p>
                  </>
                }
                right={
                  <>
                    <p className="text-[0.75rem] text-neutral-400">{b.brand}</p>
                    <p className="mt-1 font-[family-name:var(--font-hero-serif)] text-[1.05rem] font-medium text-black sm:text-[1.15rem]">
                      {b.name}
                    </p>
                  </>
                }
              />

              <CompareRow
                label="Type"
                left={
                  <p className="text-[0.9rem] text-black">
                    {a.scent_type.map((s) => s.name).join(", ") || "—"}
                  </p>
                }
                right={
                  <p className="text-[0.9rem] text-black">
                    {b.scent_type.map((s) => s.name).join(", ") || "—"}
                  </p>
                }
              />

              <CompareRow
                label="Occasion"
                left={<TagList labels={a.occasion.map((o) => o.name)} />}
                right={<TagList labels={b.occasion.map((o) => o.name)} />}
              />

              <CompareRow
                label="Rating"
                left={
                  <p className="text-[0.9rem] text-black">
                    <span className="font-[family-name:var(--font-hero-serif)] text-[1.15rem]">
                      {a.average_rating == null
                        ? "—"
                        : a.average_rating.toFixed(1)}
                    </span>
                    <span className="text-neutral-400"> / 10</span>
                    <span className="mt-1 block font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.08em] text-neutral-400">
                      {a.total_votes.toLocaleString()} ratings
                    </span>
                  </p>
                }
                right={
                  <p className="text-[0.9rem] text-black">
                    <span className="font-[family-name:var(--font-hero-serif)] text-[1.15rem]">
                      {b.average_rating == null
                        ? "—"
                        : b.average_rating.toFixed(1)}
                    </span>
                    <span className="text-neutral-400"> / 10</span>
                    <span className="mt-1 block font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.08em] text-neutral-400">
                      {b.total_votes.toLocaleString()} ratings
                    </span>
                  </p>
                }
              />

              <CompareRow
                label="Reviews"
                last
                left={
                  <p className="text-[0.9rem] text-black">
                    {a.total_votes.toLocaleString()}{" "}
                    {a.total_votes === 1 ? "review" : "reviews"}
                  </p>
                }
                right={
                  <p className="text-[0.9rem] text-black">
                    {b.total_votes.toLocaleString()}{" "}
                    {b.total_votes === 1 ? "review" : "reviews"}
                  </p>
                }
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function CompareTray({
  items,
  onRemove,
  onClear,
}: {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (items.length === 0) return null;

  const canCompare = items.length === 2;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-5">
        <div className="pointer-events-auto flex w-full max-w-4xl flex-col gap-3 bg-black px-4 py-3.5 shadow-[8px_8px_0_#6b6b6b] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.16em] text-neutral-400">
              Comparing
            </span>
            {items.map((item) => (
              <span
                key={item.id}
                className="inline-flex max-w-full items-center gap-2 border border-white px-2.5 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-white"
              >
                <span className="truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 text-white/70 transition hover:text-white"
                  aria-label={`Remove ${item.name} from compare`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                onClear();
              }}
              className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.14em] text-neutral-400 underline underline-offset-4 transition hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!canCompare}
              onClick={() => setModalOpen(true)}
              className="group relative isolate overflow-hidden border border-white bg-black px-4 py-2.5 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#fff] transition-[transform,box-shadow,color] duration-200 enabled:hover:translate-x-[1px] enabled:hover:translate-y-[1px] enabled:hover:text-black enabled:hover:shadow-[2px_2px_0_#fff] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-enabled:group-hover:scale-x-100"
              />
              Compare →
            </button>
          </div>
        </div>
      </div>

      {modalOpen && canCompare ? (
        <CompareModal
          items={[items[0], items[1]]}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
}
