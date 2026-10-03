import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import SponsoredStrip from "@/components/SponsoredStrip";

const actions = [
  { href: "/#cabinet", label: "Match a scent to the occasion" },
  { href: "/#notes", label: "Read and write reviews" },
  { href: "/#alternatives", label: "Find cheaper alternatives" },
  { href: "/#cabinet", label: "Links to where to buy" },
];

function Stamp({
  className,
  rotate = "10deg",
  alt = "Mister Fragrant postage stamp",
}: {
  className?: string;
  rotate?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/stamp.png"
      alt={alt}
      width={420}
      height={520}
      priority
      className={`stamp-inset object-contain ${className ?? ""}`}
      style={{ "--stamp-rot": rotate } as CSSProperties}
    />
  );
}

export default function Hero() {
  return (
    <section className="bg-white px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pb-20 lg:pt-10">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex items-start justify-between gap-8">
          <h1 className="font-[family-name:var(--font-hero-serif)] text-[clamp(2.85rem,6.2vw,5.75rem)] font-medium leading-[0.95] tracking-[-0.03em] text-black">
            <span className="block">Stay cool.</span>
            <span className="block">Smell great.</span>
          </h1>

          <Stamp className="mt-1 hidden w-[13.5rem] shrink-0 drop-shadow-[3px_8px_10px_rgba(0,0,0,0.16)] lg:block" />
        </div>

        <div className="mt-8 flex justify-center lg:hidden">
          <Stamp
            alt=""
            rotate="5deg"
            className="w-[12rem] drop-shadow-[3px_8px_10px_rgba(0,0,0,0.16)]"
          />
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:mt-12 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex h-full flex-col gap-3">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex h-full w-full flex-1 items-center gap-3 border-2 border-black bg-white px-4 py-3.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.08em] text-black shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] sm:text-[0.7rem]"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 bg-black"
                  aria-hidden
                />
                {action.label}
              </Link>
            ))}
          </div>

          <div className="flex h-full min-w-0 flex-col">
            <SponsoredStrip compact />
          </div>
        </div>
      </div>
    </section>
  );
}
