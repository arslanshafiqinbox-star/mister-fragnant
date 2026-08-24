"use client";

const RATING_KEYS = [
  { key: "projection", label: "Projection" },
  { key: "originality", label: "Originality" },
  { key: "value", label: "Value for money" },
] as const;

export type RatingBreakdown = {
  projection: number | null;
  originality: number | null;
  value: number | null;
};

export const emptyRatingBreakdown = (): RatingBreakdown => ({
  projection: 5,
  originality: 5,
  value: 5,
});

export function averageRating(breakdown: RatingBreakdown): number | null {
  const values = RATING_KEYS.map((r) => breakdown[r.key]).filter(
    (n): n is number => typeof n === "number"
  );
  if (values.length !== RATING_KEYS.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function postedRating(breakdown: RatingBreakdown): number | null {
  const avg = averageRating(breakdown);
  if (avg == null) return null;
  return Math.min(10, Math.max(1, avg));
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const current = value ?? 5;

  return (
    <div>
      <label className="mb-2 block font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={current}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="rating-slider min-w-0 flex-1"
        />
        <span className="w-4 shrink-0 text-right font-[family-name:var(--font-geist-mono)] text-[0.75rem] text-black">
          {current}
        </span>
      </div>
    </div>
  );
}

export default function RatingSegments({
  value,
  onChange,
}: {
  value: RatingBreakdown;
  onChange: (next: RatingBreakdown) => void;
}) {
  const overall = averageRating(value);

  return (
    <div className="space-y-5">
      {RATING_KEYS.map((row) => (
        <SliderRow
          key={row.key}
          label={row.label}
          value={value[row.key]}
          onChange={(n) => onChange({ ...value, [row.key]: n })}
        />
      ))}

      <div className="border-t border-dotted border-neutral-400 pt-3">
        <p className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.1em] text-neutral-500">
          Your overall rating:{" "}
          <span className="font-medium text-black">
            {overall == null ? "—" : overall.toFixed(1)}
          </span>
          <span className="text-neutral-400">/10</span>
        </p>
      </div>
    </div>
  );
}
