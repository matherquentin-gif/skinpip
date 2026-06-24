import { pipsToSplit, pipsToUSD, type Pips } from "@/lib/pips";
import { clsx } from "clsx";

interface PipDisplayProps {
  pips: Pips;
  size?: "sm" | "md" | "lg" | "xl";
  showFull?: boolean;
  className?: string;
}

const textSizes = {
  sm: { whole: "text-sm", sub: "text-xs" },
  md: { whole: "text-base", sub: "text-sm" },
  lg: { whole: "text-2xl", sub: "text-lg" },
  xl: { whole: "text-3xl", sub: "text-xl" },
};

export function PipDisplay({ pips, size = "md", showFull = false, className }: PipDisplayProps) {
  if (showFull) {
    return (
      <span className={clsx("font-mono", className)}>{pipsToUSD(pips)}</span>
    );
  }
  const { whole, sub } = pipsToSplit(pips);
  const sz = textSizes[size];
  return (
    <span className={clsx("inline-flex items-baseline font-mono", className)}>
      <span className={clsx("text-[var(--text-primary)]", sz.whole)}>{whole}</span>
      <span className={clsx("pip-sub", sz.sub)}>{sub}</span>
    </span>
  );
}
