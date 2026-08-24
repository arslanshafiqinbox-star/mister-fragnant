"use client";

import { useState, type FormEvent, type ReactNode } from "react";

export const adminBtn =
  "inline-flex items-center justify-center border border-black px-3 py-1.5 font-[family-name:var(--font-geist-mono)] text-[0.65rem] font-medium uppercase tracking-[0.1em] shadow-[2px_2px_0_#000] transition-[transform,box-shadow] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:opacity-50";

export const adminInput =
  "w-full border border-black bg-white px-3 py-2 text-sm text-black outline-none placeholder:text-neutral-400";

export const adminLabel =
  "mb-1.5 block font-[family-name:var(--font-geist-mono)] text-[0.6rem] font-medium uppercase tracking-[0.12em] text-neutral-500";

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-hero-serif)] text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.02em] text-black">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdminModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-[family-name:var(--font-hero-serif)] text-xl text-black">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-black shadow-[2px_2px_0_#000]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminConfirmDelete({
  label,
  onCancel,
  onConfirm,
  busy,
}: {
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Delete <strong className="text-black">{label}</strong>? This cannot be
        undone.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className={`${adminBtn} bg-white`}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`${adminBtn} bg-black text-white`}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={adminLabel}>{label}</label>
      {children}
    </div>
  );
}

export function useCrudForm<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = useState(initial);

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function reset(next: T = initial) {
    setValues(next);
  }

  return { values, setValues, setField, reset };
}

export function SubmitRow({
  onCancel,
  busy,
  label = "Save",
}: {
  onCancel: () => void;
  busy?: boolean;
  label?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="button" onClick={onCancel} className={`${adminBtn} bg-white`}>
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className={`${adminBtn} bg-black text-white`}
      >
        {busy ? "Saving…" : label}
      </button>
    </div>
  );
}

export type { FormEvent };
