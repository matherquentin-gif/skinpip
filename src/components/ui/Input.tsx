import { clsx } from "clsx";

/** Shared text-input styling so every form field looks and focuses the same. */
export function inputClasses(className?: string) {
  return clsx(
    "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] outline-none transition-colors focus:border-[var(--border-focus)]",
    className,
  );
}
