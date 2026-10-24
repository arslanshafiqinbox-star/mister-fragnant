export default function BottomBar() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-[#f7f7f5]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center gap-3 px-5 py-6 text-center font-[family-name:var(--font-geist-mono)] text-[0.58rem] font-medium uppercase tracking-[0.14em] text-neutral-400 sm:flex-row sm:justify-between sm:gap-6 sm:px-8 sm:py-7 sm:text-left lg:px-12">
        <p>© {year} Mister Fragrant</p>
        <a
          href="mailto:hello@misterfragrantreviews.com"
          className="normal-case tracking-normal text-neutral-500 hover:text-black"
        >
          hello@misterfragrantreviews.com
        </a>
        <p className="sm:text-right">Some links are affiliate links</p>
      </div>
    </footer>
  );
}
