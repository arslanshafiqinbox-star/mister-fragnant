import Link from "next/link";
import { Atom, Dna, FlaskConical, LineChart } from "lucide-react";

const FOOTER_ICONS = [LineChart, Dna, FlaskConical, Atom];

const COMPANY_LINKS = [
  { label: "About us", href: "/main/about" },
  { label: "Contact", href: "/main/contact" },
  { label: "FAQs", href: "/main/contact#faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/main/privacy-policy" },
  { label: "Terms of Service", href: "/main/terms-of-service" },
  { label: "Refund Policy", href: "/main/refund-policy" },
  { label: "Cookie Policy", href: "/main/cookie-policy" },
];

function FooterIconSlider() {
  const icons = [...FOOTER_ICONS, ...FOOTER_ICONS, ...FOOTER_ICONS];

  const strip = (stripId: string) => (
    <div className="footer-ticker-strip" aria-hidden={stripId === "b"}>
      {icons.map((Icon, index) => (
        <Icon
          key={`${stripId}-${index}`}
          className="h-7 w-7 shrink-0 text-[#FACC15] sm:h-8 sm:w-8"
          strokeWidth={1.75}
        />
      ))}
    </div>
  );

  return (
    <div className="footer-ticker-viewport border-b border-white/15 bg-black py-4">
      <div className="footer-ticker-track">
        {strip("a")}
        {strip("b")}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-block -rotate-2 border-2 border-black bg-[#FACC15] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-black sm:text-xs">
      {children}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-black text-white">
      <FooterIconSlider />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-start lg:gap-8">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                className="inline-block h-3 w-3 shrink-0 bg-[#DC2626]"
                style={{ transform: "rotate(12deg)" }}
                aria-hidden
              />
              <span className="text-sm font-extrabold uppercase tracking-wide sm:text-base">
                Grademark
              </span>
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-neutral-400 sm:text-sm">
              GCSE &amp; A Level practice, marked by AI. Practice papers — not
              real exams.
            </p>
          </div>

          {/* Company */}
          <div>
            <SectionLabel>Company</SectionLabel>
            <ul className="space-y-2 text-sm font-semibold sm:text-base">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white transition hover:text-[#FACC15]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <SectionLabel>Legal</SectionLabel>
            <ul className="space-y-2 text-sm font-semibold sm:text-base">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white transition hover:text-[#FACC15]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* EST badge */}
          <div className="hidden lg:flex lg:items-start lg:justify-end">
            <div className="flex h-24 w-24 rotate-6 items-center justify-center border-2 border-[#FACC15]">
              <span className="text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-[#FACC15]">
                Est.
                <br />
                2026
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-center text-[10px] text-neutral-500 sm:text-xs">
          © {new Date().getFullYear()} GradeMark Ltd · Registered in England
          &amp; Wales · Co. No. [placeholder]
        </div>
      </div>
    </footer>
  );
}
