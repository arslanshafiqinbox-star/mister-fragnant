import Link from "next/link";

export default function BottomBar() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-2 border-black bg-brand-blue">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-3 px-5 py-6 text-center font-[family-name:var(--font-geist-mono)] text-[0.58rem] font-medium uppercase tracking-[0.14em] text-brand-cream/70 sm:flex-row sm:justify-between sm:gap-6 sm:px-8 sm:py-7 sm:text-left lg:px-12">
        <p>© {year} Mister Fragrant</p>
        <Link href="/contact" className="hover:text-brand-cream">
          Contact us
        </Link>
        <p className="sm:text-right">Some links are affiliate links</p>
      </div>
    </footer>
  );
}
