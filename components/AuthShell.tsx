import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthField({
  label,
  type = "text",
  name,
  placeholder,
}: {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[10px] font-bold uppercase tracking-[0.15em] text-black sm:text-xs"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="h-11 border-2 border-black bg-white px-3 text-sm outline-none placeholder:text-black/40 focus:bg-[#FFF7D6]"
      />
    </div>
  );
}

export function AuthPasswordToggle({
  id,
  name,
  label,
  placeholder,
  show,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-[0.15em] text-black sm:text-xs"
      >
        {label}
      </label>
      <div className="flex items-stretch border-2 border-black bg-white">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="h-11 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-black/40 focus:bg-[#FFF7D6]"
        />
        <button
          type="button"
          onClick={onToggle}
          className="border-l-2 border-black bg-[#FACC15] px-3 text-[10px] font-bold uppercase tracking-wide text-black transition hover:bg-[#FDE047] sm:text-xs"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#F2F0E4] font-sans">
      <header className="border-b-2 border-black bg-[#F2F0E4] px-4 py-4 sm:px-6">
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
      </header>

      <div className="flex items-center justify-center px-4 py-10 sm:py-14">
        <section className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0_#000] sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#DC2626] sm:text-xs">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-black sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-black/70">{subtitle}</p>
          {children}
          {footer ? (
            <div className="mt-6 border-t border-dashed border-black/30 pt-4">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
  type = "submit",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="mt-2 inline-flex w-full items-center justify-center border-2 border-black bg-[#1D4ED8] px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-[4px_4px_0_#000] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#000] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-bold text-black underline underline-offset-2">
      {children}
    </Link>
  );
}
