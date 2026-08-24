"use client";

import { useEffect, useMemo, useState } from "react";

type BlogRow = {
  id: string;
  title: string;
  provider: string;
  description: string;
  author: string;
  sponsored?: boolean;
  created_at: string;
  updated_at: string;
};

type BlogListResponse = {
  ok: boolean;
  rows?: BlogRow[];
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

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SponsoredTag({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-block bg-yellow-400 font-[family-name:var(--font-geist-mono)]  uppercase tracking-[0.08em] text-neutral-500 ${
        size === "sm"
          ? "px-2 py-0.5 text-[0.55rem]"
          : "px-2.5 py-1 text-[0.65rem] shadow-[2px_2px_0_#000]"
      }`}
    >
      Sponsored
    </span>
  );
}

function BlogBody({ content }: { content: string }) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="blog-html space-y-4 text-[0.95rem] leading-relaxed text-neutral-700 [&_a]:underline [&_h1]:font-[family-name:var(--font-hero-serif)] [&_h1]:text-2xl [&_h1]:text-black [&_h2]:font-[family-name:var(--font-hero-serif)] [&_h2]:text-xl [&_h2]:text-black [&_h3]:font-[family-name:var(--font-hero-serif)] [&_h3]:text-lg [&_h3]:text-black [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-black"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="space-y-4 text-[0.95rem] leading-relaxed text-neutral-700">
      {content
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {para}
          </p>
        ))}
    </div>
  );
}

function BlogPopup({
  post,
  onClose,
}: {
  post: BlogRow;
  onClose: () => void;
}) {
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
      aria-label={post.title}
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

        <div className="overflow-y-auto p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 pr-10">
            {post.sponsored ? (
              <SponsoredTag />
            ) : (
              <span className="inline-block border border-black bg-white px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#000]">
                {post.provider}
              </span>
            )}
            <time
              dateTime={post.created_at}
              className="font-[family-name:var(--font-geist-mono)] text-[0.7rem] text-neutral-400"
            >
              {formatDate(post.created_at)}
            </time>
          </div>

          <h2 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.15] tracking-[-0.02em] text-black">
            {post.title}
          </h2>

          <p className="mt-3 font-[family-name:var(--font-geist-mono)] text-[0.7rem] uppercase tracking-[0.08em] text-neutral-400">
            By {post.author}
          </p>

          <div className="mt-8 border-t border-neutral-200 pt-8">
            <BlogBody content={post.description} />
          </div>
        </div>
      </article>
    </div>
  );
}

export default function FragranceNotes() {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/blog");
        const json = (await res.json()) as BlogListResponse;

        if (!json.ok) {
          throw new Error(json.message || "Failed to load notes");
        }

        if (!cancelled) {
          setPosts(json.rows ?? []);
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

  const openPost = useMemo(
    () => posts.find((p) => p.id === openId) ?? null,
    [posts, openId]
  );

  return (
    <section id="notes" className="scroll-mt-[4.25rem] bg-white px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mister Fragrant&apos;s Notes
          </h2>
          <p className="max-w-[18rem] text-[0.75rem] leading-relaxed text-neutral-500 sm:pt-2 sm:text-right sm:text-[0.8rem]">
            Notes on fragrance — how to wear it, how to buy it, and how to talk
            about it.
          </p>
        </div>

        {error ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            Loading notes…
          </p>
        ) : null}

        {!loading && !error && posts.length === 0 ? (
          <p className="mt-10 font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.1em] text-neutral-400">
            No notes yet.
          </p>
        ) : null}

        {!loading && posts.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setOpenId(post.id)}
                className="group flex h-full flex-col border border-black bg-white p-5 text-left shadow-[3px_3px_0_#000] transition-colors hover:bg-[#f7f7f5] sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  {post.sponsored ? (
                    <SponsoredTag size="sm" />
                  ) : (
                    <span className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-400">
                      {post.provider}
                    </span>
                  )}
                  <time
                    dateTime={post.created_at}
                    className="shrink-0 text-[0.7rem] text-neutral-400"
                  >
                    {formatDate(post.created_at)}
                  </time>
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-hero-serif)] text-[1.25rem] font-medium leading-[1.2] tracking-[-0.01em] text-black transition-transform duration-200 group-hover:translate-x-1 sm:text-[1.35rem]">
                  {post.title}
                </h3>

                <p className="mt-3 flex-1 text-[0.8rem] leading-relaxed text-neutral-500">
                  {excerpt(post.description)}
                </p>

                <span className="mt-6 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-neutral-500 transition-colors group-hover:text-black">
                  Read the post →
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {openPost ? (
        <BlogPopup post={openPost} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  );
}
