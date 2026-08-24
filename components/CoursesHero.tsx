import Link from "next/link";

export default function CoursesHero() {
  return (
    <section className="border-b-2 border-black bg-[#F2F0E4] px-6 py-14 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626]">
          Courses
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold uppercase leading-tight text-black sm:text-4xl lg:text-5xl">
          Pick a subject. Practice smart.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/75 sm:text-base">
          Browse GCSE and A Level subjects below. Flip any card to preview, then
          view the full course when you&apos;re ready.
        </p>
        <Link
          href="/auth/register"
          className="mt-8 inline-flex items-center justify-center border-2 border-black bg-[#1D4ED8] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] sm:text-sm"
        >
          Get started
        </Link>
      </div>
    </section>
  );
}
