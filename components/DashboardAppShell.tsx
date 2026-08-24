"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navBtn =
  "inline-flex items-center justify-center border-2 border-black bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-[3px_3px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#000] sm:px-4 sm:text-xs";

export default function DashboardAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isStudyRoute = pathname?.startsWith("/dashboard/study");
  const [initials, setInitials] = useState("DS");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw) as {
        firstName?: string;
        lastName?: string;
      };
      const first = user.firstName?.charAt(0) ?? "";
      const last = user.lastName?.charAt(0) ?? "";
      if (first || last) setInitials(`${first}${last}`.toUpperCase());
    } catch {
      /* keep default */
    }
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    router.push("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F0E4] font-sans">
      <header className="shrink-0 border-b-2 border-black bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3 shrink-0 bg-[#DC2626]"
              style={{ transform: "rotate(12deg)" }}
              aria-hidden
            />
            <span className="text-sm font-extrabold uppercase tracking-wide text-black">
              Grademark
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/dashboard" className={`${navBtn} bg-[#FFF7D6]`}>
              Dashboard
            </Link>
            <span className={`${navBtn} gap-1.5 bg-white`}>
              <span className="flex h-5 w-5 items-center justify-center border border-black bg-[#FACC15] text-[10px] font-extrabold">
                {initials}
              </span>
              All access
            </span>
            <button type="button" onClick={handleLogout} className={navBtn}>
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main
        className={
          isStudyRoute
            ? "flex min-h-0 flex-1 flex-col"
            : "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
        }
      >
        {children}
      </main>
    </div>
  );
}
