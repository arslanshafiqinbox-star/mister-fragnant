import Link from "next/link";

const STEPS = [
  {
    number: 1,
    title: "Create your free account",
    description:
      "Sign up with your email — no card needed yet. You'll land straight on your dashboard.",
  },
  {
    number: 2,
    title: "Pick a single subject or go all access",
    description:
      "Choose one subject at GCSE or A Level, or unlock every subject and every tier with all access. Cancel any time.",
  },
  {
    number: 3,
    title: "Get unlimited practice, marked instantly",
    description:
      "Select your tier — Foundation or Higher, AS Level or A Level — and your quizzes and practice exams load to match. Every question is free text: it's read for meaning and marked AI-side against real mark schemes, with a model answer shown for full marks, an AI assistant on hand if you get stuck, and a full results history so you can track improvement over time.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-t-2 border-black bg-[#F2F0E4] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC2626] sm:text-xs">
            How it works
          </p>
          <h2 className="mt-2 text-xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-2xl lg:text-3xl">
            Register, choose a plan, start practising
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
            Here&apos;s exactly what happens from sign up to your first quiz.
          </p>
        </div>

        <div className="divide-y pt-5 divide-dashed divide-black/40 border-t border-dashed border-black/40">
          {STEPS.map((step) => (
            <article
              key={step.number}
              className="flex gap-4 py-6 first:pt-0 sm:gap-6 sm:py-8"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-[#FACC15] text-lg font-extrabold text-black shadow-[3px_3px_0_#000] sm:h-12 sm:w-12 sm:text-xl">
                {step.number}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-base font-extrabold text-black sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-black/75 sm:text-sm">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center border-2 border-black bg-[#1D4ED8] px-6 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] sm:px-7 sm:text-xs"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
