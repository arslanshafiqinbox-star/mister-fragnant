import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Cloud,
  Dna,
  FileText,
  FlaskConical,
  LineChart,
  Pencil,
  Timer,
} from "lucide-react";

type FeatureItem = {
  label: string;
  icon: LucideIcon;
};

const TOP_FEATURES: FeatureItem[] = [
  { label: "QUIZ", icon: FileText },
  { label: "AI MARKING", icon: Pencil },
  { label: "ASSISTANT", icon: Cloud },
  { label: "EXAM", icon: Timer },
];

const BOTTOM_SUBJECTS: FeatureItem[] = [
  { label: "MATHS", icon: LineChart },
  { label: "BIOLOGY", icon: Dna },
  { label: "CHEMISTRY", icon: FlaskConical },
  { label: "PHYSICS", icon: Atom },
];

function IconRow({ items }: { items: FeatureItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {items.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center gap-2.5 text-center"
        >
          <Icon
            className="h-10 w-10 text-white sm:h-11 sm:w-11"
            strokeWidth={1.5}
          />
          <span className="text-[9px] font-extrabold uppercase leading-tight tracking-[0.12em] text-white sm:text-[10px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AllAccessFlipCard() {
  return (
    <div className="group mt-6 h-[12rem] [perspective:1200px] sm:h-[13.5rem]">
      <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front — All access */}
        <article className="absolute inset-0 flex flex-col justify-between border-2 border-black bg-[#1D4ED8] p-5 shadow-[6px_6px_0_#000] [backface-visibility:hidden] sm:px-8 sm:py-6">
          <div>
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
              All access
            </h3>
            <p className="mt-2 max-w-xl text-sm font-medium text-white/95 sm:text-base">
              Every subject, every tier, unlimited everything.
            </p>
          </div>
          <p className="text-2xl font-extrabold text-white sm:text-3xl">£19/mo</p>
        </article>

        {/* Back — red icon grid (reference layout) */}
        <Link
          href="/auth/register"
          className="absolute inset-0 flex flex-col justify-center border-2 border-black bg-[#DC2626] px-3 py-4 shadow-[6px_6px_0_#000] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:px-6 sm:py-5"
        >
          <div className="flex flex-1 flex-col justify-center gap-4 sm:gap-5">
            <IconRow items={TOP_FEATURES} />
            <div className="mx-1 border-t border-dashed border-white sm:mx-2" />
            <IconRow items={BOTTOM_SUBJECTS} />
          </div>
        </Link>
      </div>
    </div>
  );
}
