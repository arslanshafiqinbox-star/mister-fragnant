import AllAccessFlipCard from "@/components/AllAccessFlipCard";
import SubjectFlipCard, { SUBJECT_COURSES } from "@/components/SubjectFlipCard";

export default function PopularCourses() {
  return (
    <section className="bg-[#F2F0E4] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626]">
            Subjects &amp; pricing
          </p>
          <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-tight text-black sm:text-4xl">
            Every subject, clearly tiered
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-black/70 sm:text-base">
            Hover a card to flip it, click to see the full course and buy.
            £9/month per subject, or go all access below.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECT_COURSES.map((course) => (
            <SubjectFlipCard key={course.id} course={course} />
          ))}
        </div>

        <AllAccessFlipCard />
      </div>
    </section>
  );
}
