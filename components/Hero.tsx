import Link from "next/link";

const actions = [
  { href: "/occasion", label: "Match a scent to the occasion" },
  { href: "/compare", label: "Compare fragrances side by side" },
  { href: "/reviews", label: "Read the reviews" },
  { href: "/buy", label: "Links to where to buy" },
];

export default function Hero() {
  return (
    <section className="flex min-h-[calc(100vh-4.25rem)] flex-col justify-center bg-white px-5 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8 -rotate-1 border border-black bg-white shadow-[3px_3px_0_#000] sm:mb-10">
          <div className="px-3 py-1 sm:px-4 ">
            <p className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.18em] text-black sm:text-[0.7rem]">
              Mister Fragrant
            </p>
          </div>
        </div>

        <h1 className="max-w-[14ch] font-[family-name:var(--font-hero-serif)] text-[clamp(2.75rem,8vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.02em] text-black">
          Stay cool. Smell great.
        </h1>

        <div className="mt-10 flex max-w-xl flex-col gap-3 sm:mt-12 sm:gap-3.5">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex w-full items-center gap-3 border-2 border-black bg-white px-4 py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] text-black shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] sm:w-auto sm:max-w-md sm:text-[0.7rem]"
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 bg-black"
                aria-hidden
              />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
