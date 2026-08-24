"use client";

import { useEffect, useMemo, useState } from "react";

type FilmDetails = {
  brand?: string;
  location?: { city?: string; country?: string };
  date?: string;
  duration?: string;
  url?: string;
  description?: string;
};

type FilmRow = {
  id: string;
  name: string;
  details: FilmDetails;
  created_at: string;
};

type FilmListResponse = {
  ok: boolean;
  rows?: FilmRow[];
  message?: string;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string, max = 140) {
  const plain = looksLikeHtml(value) ? stripHtml(value) : value.trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trim()}…`;
}

function formatFilmDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function locationLine(details: FilmDetails) {
  const brand = details.brand?.trim() || "";
  const city = details.location?.city?.trim() || "";
  const country = details.location?.country?.trim() || "";
  const place = [city, country].filter(Boolean).join(", ");
  if (brand && place) return `${brand} — ${place}`;
  return brand || place || "";
}

/** Extract a YouTube video id from watch / share / embed / shorts URLs. */
function youtubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

function FilmBody({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="film-html space-y-3 text-[0.95rem] leading-relaxed text-neutral-600 [&_a]:underline [&_h1]:font-[family-name:var(--font-hero-serif)] [&_h1]:text-2xl [&_h1]:text-black [&_h2]:font-[family-name:var(--font-hero-serif)] [&_h2]:text-xl [&_h2]:text-black [&_h3]:font-[family-name:var(--font-hero-serif)] [&_h3]:text-lg [&_h3]:text-black [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-black"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-neutral-600">
      {content}
    </p>
  );
}

function MediaPanel({
  latest,
  url,
  title,
}: {
  latest?: boolean;
  url?: string;
  title?: string;
}) {
  const embedSrc = url ? youtubeEmbedUrl(url) : null;

  return (
    <div
      className="relative aspect-[16/9] w-full border-b border-black bg-black"
      style={
        embedSrc
          ? undefined
          : {
              backgroundImage:
                "repeating-linear-gradient(-45deg, #e8e8e8 0 1px, #f3f3f3 1px 14px)",
            }
      }
    >
      {embedSrc ? (
        <iframe
          src={embedSrc}
          title={title ? `${title} — YouTube` : "YouTube video"}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}

      {latest && !embedSrc ? (
        <span className="absolute bottom-3 right-4 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.14em] text-neutral-400">
          Latest episode
        </span>
      ) : null}
    </div>
  );
}

function FeaturedCard({
  film,
  latest,
}: {
  film: FilmRow;
  latest?: boolean;
}) {
  const details = film.details ?? {};
  const description = details.description ?? "";
  const dateLabel = details.date ? formatFilmDate(details.date) : "";
  const duration = details.duration ?? "";
  const meta = [dateLabel, duration].filter(Boolean).join(" · ");
  const place = locationLine(details);

  return (
    <article className="overflow-hidden border border-black bg-white shadow-[4px_4px_0_#000]">
      <MediaPanel latest={latest} url={details.url} title={film.name} />

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          {latest ? (
            <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
              Latest episode
            </span>
          ) : (
            <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
              Episode
            </span>
          )}
          {meta ? (
            <span className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
              {meta}
            </span>
          ) : null}
        </div>

        <h3 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
          {film.name}
        </h3>

        {description ? (
          <p className="mt-4 max-w-3xl text-[0.9rem] leading-relaxed text-neutral-600">
            {excerpt(description, 180)}
          </p>
        ) : null}

        {place ? (
          <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
            {place}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function FilmPopup({
  film,
  onClose,
}: {
  film: FilmRow;
  onClose: () => void;
}) {
  const details = film.details ?? {};

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

  const dateLabel = details.date ? formatFilmDate(details.date) : "";
  const duration = details.duration ?? "";
  const meta = [dateLabel, duration].filter(Boolean).join(" · ");
  const place = locationLine(details);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={film.name}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close popup"
        onClick={onClose}
      />

      <article className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border border-black bg-white shadow-[5px_5px_0_#000]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border border-black bg-white font-[family-name:var(--font-geist-mono)] text-sm text-black shadow-[2px_2px_0_#000] transition hover:bg-black hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <div className="overflow-y-auto">
          <MediaPanel url={details.url} title={film.name} />

          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-3 pr-10">
              <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
                Episode
              </span>
              {meta ? (
                <span className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                  {meta}
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
              {film.name}
            </h2>

            {details.description ? (
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <FilmBody content={details.description} />
              </div>
            ) : null}

            {place ? (
              <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                {place}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

export default function FragranceFilms() {
  const [films, setFilms] = useState<FilmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/film");
        const json = (await res.json()) as FilmListResponse;

        if (!json.ok) {
          throw new Error(json.message || "Failed to load films");
        }

        if (!cancelled) {
          setFilms(json.rows ?? []);
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
  }, []);

  const featured = films[0] ?? null;
  const archive = films.slice(1);
  const openFilm = useMemo(
    () => films.find((f) => f.id === openId) ?? null,
    [films, openId]
  );

  return (
    <section id="films" className="scroll-mt-[4.25rem] bg-[#fafafa] px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant Films
          </h2>
          <p className="max-w-[20rem] text-[0.75rem] leading-relaxed text-neutral-500 sm:pb-1 sm:text-right sm:text-[0.8rem]">
            Behind the scenes at the houses, factories, and shows that make the
            bottle. New episodes regularly, nothing ever taken down.
          </p>
        </div>

        {error ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading films…
          </p>
        ) : null}

        {!loading && !error && films.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            No films yet.
          </p>
        ) : null}

        {!loading && featured ? (
          <div className="mt-12">
            <FeaturedCard film={featured} latest />
          </div>
        ) : null}

        {!loading && archive.length > 0 ? (
          <div className="mt-16">
            <h3 className="inline-block border-b border-black pb-1 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-black">
              Archive
            </h3>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archive.map((film) => {
                const details = film.details ?? {};
                const description = details.description ?? "";
                return (
                  <button
                    key={film.id}
                    type="button"
                    onClick={() => setOpenId(film.id)}
                    className="group flex h-full flex-col border border-black bg-white p-5 text-left shadow-[3px_3px_0_#000] transition-colors hover:bg-white sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400">
                        {details.duration || "—"}
                      </span>
                      <time
                        dateTime={details.date || film.created_at}
                        className="shrink-0 font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400"
                      >
                        {details.date
                          ? formatFilmDate(details.date)
                          : formatFilmDate(film.created_at)}
                      </time>
                    </div>

                    <h4 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[1.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-black transition-transform duration-200 group-hover:translate-x-1 sm:text-[1.35rem]">
                      {film.name}
                    </h4>

                    {description ? (
                      <p className="mt-3 flex-1 text-[0.8rem] leading-relaxed text-neutral-500">
                        {excerpt(description)}
                      </p>
                    ) : (
                      <span className="flex-1" />
                    )}

                    <span className="mt-6 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500 transition-colors group-hover:text-black">
                      Watch episode →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {openFilm ? (
        <FilmPopup film={openFilm} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  );
}
