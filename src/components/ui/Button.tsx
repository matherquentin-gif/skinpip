import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:   "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] font-medium",
  secondary: "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
  ghost:     "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
  danger:    "bg-[rgba(255,92,97,0.12)] text-[var(--loss)] border border-[var(--loss)] hover:bg-[rgba(255,92,97,0.20)]",
};

const sizeCls: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)]",
  md: "px-4 py-2 text-sm rounded-[var(--radius-md)]",
  lg: "px-5 py-2.5 text-base rounded-[var(--radius-md)]",
};

/**
 * Button styling as a class string, for links that should look like buttons.
 * (Wrapping a <button> in an <a> is invalid HTML and breaks keyboard focus.)
 */
export function buttonClasses({ variant = "secondary", size = "md" }: { variant?: Variant; size?: Size } = {}, className?: string) {
  return clsx(
    "inline-flex cursor-pointer items-center justify-center gap-2 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    variantCls[variant],
    sizeCls[size],
    className,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size }, className)}
      {...props}
    >
      {loading && (
        <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
