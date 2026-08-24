const faqs = [
  {
    question: "How do I get started?",
    answer:
      "Create a free account, pick a subject or all-access plan, choose your tier, and start practising. Quizzes load to match Foundation, Higher, AS, or A Level.",
  },
  {
    question: "How does AI marking work?",
    answer:
      "You write free-text answers. They're marked against real mark schemes for meaning, not keywords — with a model answer, feedback, and an AI assistant if you get stuck.",
  },
  {
    question: "Can I track my progress?",
    answer:
      "Yes. Results history shows scores by course, answered vs unanswered questions, and feedback so you can see improvement over time.",
  },
  {
    question: "What if I’m not satisfied?",
    answer:
      "We offer a 14-day refund window for eligible plans. Contact support and we’ll help you sort it out.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="border-t-2 border-black bg-[#F2F0E4] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC2626] sm:text-xs">
            FAQ
          </p>
          <h2 className="mt-2 text-xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-2xl lg:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-black/70">
            Quick answers about plans, AI marking, and how Grademark works.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, index) => (
            <details
              key={item.question}
              className="group border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0_#000]"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold text-black">
                <span>{item.question}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-[#FACC15] text-xs font-bold">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>
              <p className="mt-2 border-t border-black/10 pt-2 text-sm leading-relaxed text-black/75">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
