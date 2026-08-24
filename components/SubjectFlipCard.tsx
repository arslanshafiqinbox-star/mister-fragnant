import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Calculator,
  Dna,
  FlaskConical,
  Leaf,
  Microscope,
  Sigma,
  Zap,
} from "lucide-react";

export type SubjectCourse = {
  id: string;
  title: string;
  level: "GCSE" | "A LEVEL";
  description: string;
  price: string;
  icon: LucideIcon;
  backColor: string;
  href: string;
};

type SubjectFlipCardProps = {
  course: SubjectCourse;
};

export default function SubjectFlipCard({ course }: SubjectFlipCardProps) {
  const Icon = course.icon;
  const levelClass =
    course.level === "GCSE"
      ? "bg-[#7C3AED] text-white"
      : "bg-[#EA580C] text-white";

  return (
    <div className="group h-[15.5rem] [perspective:1200px] sm:h-[14.5rem]">
      <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front */}
        <article className="absolute inset-0 flex flex-col border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] [backface-visibility:hidden]">
          <span
            className={`inline-flex w-fit px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelClass}`}
          >
            {course.level}
          </span>
          <h3 className="mt-4 text-xl font-extrabold text-black">
            {course.title}
          </h3>
          <p className="mt-3 flex-1 text-xs text-black/65">
            {course.description}
          </p>
          <p className="mt-4 text-xs font-extrabold text-black">{course.price}</p>
        </article>

        {/* Back */}
        <Link
          href={course.href}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 border-2 border-black shadow-[6px_6px_0_#000] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ backgroundColor: course.backColor }}
        >
          <Icon className="h-14 w-14 text-white" strokeWidth={1.75} />
          <span className="text-sm font-extrabold uppercase  text-white">
            View course
          </span>
        </Link>
      </div>
    </div>
  );
}

export const SUBJECT_COURSES: SubjectCourse[] = [
  {
    id: "gcse-maths",
    title: "Maths",
    level: "GCSE",
    description:
      "Number, algebra, geometry, statistics and probability — Foundation and Higher tiers.",
    price: "£9/mo",
    icon: Calculator,
    backColor: "#1D4ED8",
    href: "/auth/register",
  },
  {
    id: "gcse-biology",
    title: "Biology",
    level: "GCSE",
    description:
      "Cell biology, genetics, ecology and human biology — exam-style questions with mark schemes.",
    price: "£9/mo",
    icon: Leaf,
    backColor: "#16A34A",
    href: "/auth/register",
  },
  {
    id: "gcse-chemistry",
    title: "Chemistry",
    level: "GCSE",
    description:
      "Atomic structure, bonding, quantitative chemistry and organic chemistry.",
    price: "£9/mo",
    icon: FlaskConical,
    backColor: "#EAB308",
    href: "/auth/register",
  },
  {
    id: "gcse-physics",
    title: "Physics",
    level: "GCSE",
    description:
      "Forces, energy, waves, electricity and magnetism — with worked solutions.",
    price: "£9/mo",
    icon: Zap,
    backColor: "#DC2626",
    href: "/auth/register",
  },
  {
    id: "alevel-maths",
    title: "Maths",
    level: "A LEVEL",
    description:
      "Pure, mechanics and statistics — past-paper style questions with full solutions.",
    price: "£9/mo",
    icon: Sigma,
    backColor: "#9333EA",
    href: "/auth/register",
  },
  {
    id: "alevel-biology",
    title: "Biology",
    level: "A LEVEL",
    description:
      "Biological molecules, cells, genetics and ecosystems — A Level standard.",
    price: "£9/mo",
    icon: Dna,
    backColor: "#0D9488",
    href: "/auth/register",
  },
  {
    id: "alevel-chemistry",
    title: "Chemistry",
    level: "A LEVEL",
    description:
      "Physical, inorganic and organic chemistry — with mark scheme breakdowns.",
    price: "£9/mo",
    icon: Microscope,
    backColor: "#F97316",
    href: "/auth/register",
  },
  {
    id: "alevel-physics",
    title: "Physics",
    level: "A LEVEL",
    description:
      "Mechanics, fields, waves and nuclear — exam-style with model answers.",
    price: "£9/mo",
    icon: Atom,
    backColor: "#2563EB",
    href: "/auth/register",
  },
];
