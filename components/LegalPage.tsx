import Link from "next/link";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export default function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <section className="bg-[#F2F0E4] py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/"
          className="inline-flex items-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000]"
        >
          ← Home
        </Link>

        <div className="mt-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC2626] sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-xs text-black/55">Last updated: {updated}</p>
          <p className="mt-4 text-sm leading-relaxed text-black/75">{intro}</p>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="border-2 border-black bg-white p-5 shadow-[4px_4px_0_#000]"
            >
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-black">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-2 text-sm leading-relaxed text-black/75"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
