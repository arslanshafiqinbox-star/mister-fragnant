"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#cabinet", id: "cabinet", label: "Cabinet" },
  { href: "/#favourites", id: "favourites", label: "Favourites" },
  { href: "/#alternatives", id: "alternatives", label: "Alternatives" },
  { href: "/#notes", id: "notes", label: "Notes" },
  { href: "/#films", id: "films", label: "Films" },
  { href: "/#add-scent", id: "add-scent", label: "Add a scent" },
];

export default function TopBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setActiveId(null);
      return;
    }

    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveId(hash);
        });
      }
    }

    const sections = navLinks
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  function linkClass(id: string) {
    const active = pathname === "/" && activeId === id;
    return [
      "nav-underline relative pb-1 font-[family-name:var(--font-geist-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#3a3a3a] transition-colors lg:text-[0.75rem]",
      "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:bg-black after:transition-transform after:duration-300 after:ease-out after:content-['']",
      active
        ? "text-black after:scale-x-100"
        : "after:scale-x-0 hover:text-black hover:after:scale-x-100",
    ].join(" ");
  }

  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) {
    setIsOpen(false);

    if (pathname !== "/") return;

    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${id}`);
    setActiveId(id);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 bg-white">
      <div className="mx-auto flex h-[4.25rem] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="shrink-0 text-sm font-medium uppercase tracking-[0.12em] text-[#3a3a3a] sm:text-xs"
        >
          Mister Fragrant
        </Link>

        <nav className="hidden items-center gap-5 md:flex lg:gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.id)}
              className={linkClass(link.id)}
              aria-current={activeId === link.id ? "location" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[#3a3a3a] md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <nav className="flex flex-col gap-4 border-t border-[#3a3a3a] px-5 py-5 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.id)}
              className={`${linkClass(link.id)} w-fit`}
              aria-current={activeId === link.id ? "location" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
