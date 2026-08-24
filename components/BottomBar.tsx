import Link from "next/link";

export default function BottomBar() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:px-8 sm:py-14 lg:px-12">
        <div>
          <Link
            href="/"
            className="font-[family-name:var(--font-hero-serif)] text-[1.35rem] font-medium italic leading-none tracking-[-0.01em] text-neutral-800 sm:text-[1.5rem]"
          >
            Mister Fragrant
          </Link>
          <p className="mt-3 max-w-[18rem] text-[0.8rem] leading-relaxed text-neutral-500 sm:text-[0.85rem]">
            Find your next signature scent. Some links are affiliate links.
          </p>
        </div>

        <p className="font-[family-name:var(--font-geist-sans)] text-[0.75rem] text-neutral-400 sm:text-[0.8rem]">
          © {new Date().getFullYear()} — Vol. 01
        </p>
      </div>
    </footer>
  );
}
