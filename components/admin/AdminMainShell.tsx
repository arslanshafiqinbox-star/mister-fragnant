"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADMIN_EMAIL_KEY,
  clearAdminSession,
  isAdminSignedIn,
} from "@/lib/admin-session";

const navLinks = [
  { href: "/admin/main/blogs", label: "Blogs" },
  { href: "/admin/main/fragnances", label: "Fragnances" },
  { href: "/admin/main/reviews", label: "Reviews" },
  { href: "/admin/main/scents-and-occassions", label: "Scents & Occassions" },
  { href: "/admin/main/sponsored-perfumes", label: "Sponsored" },
  { href: "/admin/main/films", label: "Films" },
  { href: "/admin/main/alternatives", label: "Alternatives" },
  { href: "/admin/main/newsletter-emails", label: "Newsletter" },
];

export default function AdminMainShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminSignedIn()) {
      router.replace("/admin");
      return;
    }
    setEmail(sessionStorage.getItem(ADMIN_EMAIL_KEY));
    setReady(true);
  }, [router]);

  function signOut() {
    clearAdminSession();
    router.replace("/admin");
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="font-[family-name:var(--font-geist-mono)] text-sm uppercase tracking-[0.12em] text-neutral-400">
          Checking session…
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-black bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/main"
              className="font-[family-name:var(--font-hero-serif)] text-lg italic text-black"
            >
              Mister Fragrant
            </Link>
            <span className="border border-black px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.12em]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {email}
            </span>
            <Link
              href="/"
              className="font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] text-neutral-500 hover:text-black"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="border border-black bg-white px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.1em] shadow-[2px_2px_0_#000]"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 pb-3 sm:px-8">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 px-3 py-2 font-[family-name:var(--font-geist-mono)] text-[0.65rem] uppercase tracking-[0.12em] ${
                  active
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
