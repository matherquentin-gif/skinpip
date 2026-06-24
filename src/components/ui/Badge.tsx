"use client";
import { clsx } from "clsx";

type Variant = "accent" | "muted" | "gain" | "loss" | "warn" | "phase";

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<Variant, string> = {
  accent: "bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]",
  muted:  "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]",
  gain:   "bg-[rgba(37,229,154,0.10)] text-[var(--gain)] border-[var(--gain)]",
  loss:   "bg-[rgba(255,92,97,0.10)] text-[var(--loss)] border-[var(--loss)]",
  warn:   "bg-[rgba(245,166,35,0.10)] text-[var(--warn)] border-[var(--warn)]",
  phase:  "bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]",
};

export function Badge({ variant = "muted", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
