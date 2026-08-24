import Link from "next/link";

export type DashboardSubject = {
  id: string;
  name: string;
  level: string;
  topics: string;
  progress: number;
  progressColor: string;
};

export default function DashboardSubjectCard({
  subject,
}: {
  subject: DashboardSubject;
}) {
  return (
    <article className="border-2 border-black bg-white p-4 shadow-[6px_6px_0_#000] sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-extrabold text-black">{subject.name}</h3>
        <span className="bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          {subject.level}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(["Foundation", "Higher"] as const).map((option) => (
          <span
            key={option}
            className="border border-black/20 bg-[#F2F0E4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/70"
          >
            {option}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs text-black/65 sm:text-sm">{subject.topics}</p>

      <div className="mt-3 h-3 border-2 border-black bg-white">
        <div
          className="h-full transition-all"
          style={{
            width: `${subject.progress}%`,
            backgroundColor: subject.progressColor,
          }}
        />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-black">
        {subject.progress}% complete
      </p>

      <Link
        href={`/dashboard/study?subject=${encodeURIComponent(subject.id)}`}
        className="mt-4 inline-flex w-full items-center justify-center border-2 border-black bg-[#1D4ED8] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000]"
      >
        Start studying
      </Link>
    </article>
  );
}
