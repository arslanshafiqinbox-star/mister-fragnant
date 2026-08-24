type FeatureCard = {
  tag: string;
  title: string;
  description: string;
};

const FEATURES: FeatureCard[] = [
  {
    tag: "Quiz",
    title: "Topic quizzes",
    description:
      "Every question is free text, by topic. Flag tricky ones, change your answer, submit whenever you're ready.",
  },
  {
    tag: "AI",
    title: "AI marking",
    description:
      "Answers are read for meaning, not just keywords — marked against the real scheme with partial credit, an explanation of what you got right or missed, and the model answer that would've scored full marks.",
  },
  {
    tag: "Help",
    title: "AI assistant",
    description:
      "Stuck mid-quiz? Open the assistant for a nudge in the right direction — it won't hand you the answer, just enough to get you unstuck.",
  },
  {
    tag: "Exam",
    title: "Practice exams",
    description:
      "Full, timed papers covering every topic in the subject, marked the same examiner-accurate way as the quizzes.",
  },
];

export default function FeaturesOffer() {
  return (
    <section className="border-t-2 border-black bg-[#F2F0E4] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#DC2626]">
            Features we offer
          </p>
          <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-tight text-black sm:text-4xl">
            Practice, marked properly
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article
              key={feature.tag}
              className="flex min-h-[15rem] flex-col border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] transition-all duration-300 ease-out hover:-rotate-2 hover:bg-[#FFF7D6] hover:shadow-[8px_8px_0_#000] sm:min-h-[16rem]"
            >
              <span className="inline-flex w-fit border border-black bg-[#FACC15] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                {feature.tag}
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-black">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-black/80">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
