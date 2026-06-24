import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  padding?: boolean;
}

export function Card({ children, className, elevated = false, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-lg)] border border-[var(--border)]",
        elevated ? "bg-[var(--bg-elevated)]" : "bg-[var(--bg-surface)]",
        padding && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-3 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx("text-sm font-medium text-[var(--text-primary)]", className)}>
      {children}
    </h3>
  );
}
