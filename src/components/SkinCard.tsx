import Link from "next/link";
import { Badge } from "./ui/Badge";
import { PipDisplay } from "./ui/PipDisplay";
import { type Pips } from "@/lib/pips";
import { clsx } from "clsx";

export interface SkinCardData {
  id: string;
  skinName: string;
  weaponName: string;
  wearName: string | null;
  imageUrl: string | null;
  paintWear: number | null;
  paintSeed: number | null;
  phaseLabel: string | null;
  patternTierLabel: string | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  pricePips: Pips;
  changePercent?: number;
  stickers?: { name: string; imageUrl?: string }[];
}

interface SkinCardProps {
  item: SkinCardData;
  className?: string;
}

function FloatBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="relative h-1 rounded-full" style={{ background: "var(--border)" }}>
      <span
        className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2 border-[var(--bg-surface)]"
        style={{ left: `${pct}%`, background: "var(--accent)", transform: `translateX(-50%) translateY(-50%)` }}
      />
    </div>
  );
}

export function SkinCard({ item, className }: SkinCardProps) {
  const isGain = (item.changePercent ?? 0) > 0;
  const isLoss = (item.changePercent ?? 0) < 0;

  return (
    <Link href={`/market/${item.id}`}>
      <div
        className={clsx(
          "group cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] transition-all duration-150 hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_var(--accent-dim)]",
          className,
        )}
        style={{ background: "var(--bg-surface)" }}
      >
        <div
          className="flex h-36 items-center justify-center"
          style={{ background: "var(--bg-input)" }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.skinName}
              className="h-28 w-full object-contain transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-28 items-center justify-center text-xs text-[var(--text-hint)]">
              No image
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{item.weaponName}</p>
            <p className="truncate text-sm font-medium leading-tight">{item.skinName}</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {item.wearName && (
              <Badge variant="muted" className="text-[10px]">{item.wearName}</Badge>
            )}
            {item.phaseLabel && (
              <Badge variant="phase" className="text-[10px]">{item.phaseLabel}</Badge>
            )}
            {item.patternTierLabel && (
              <Badge variant="accent" className="text-[10px]">{item.patternTierLabel}</Badge>
            )}
            {item.isStatTrak && (
              <Badge variant="warn" className="text-[10px]">ST</Badge>
            )}
          </div>

          {item.paintWear !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>Float</span>
                <span className="font-mono">{item.paintWear.toFixed(5)}</span>
              </div>
              <FloatBar value={item.paintWear} />
            </div>
          )}

          <div className="flex items-end justify-between pt-1">
            <PipDisplay pips={item.pricePips} size="md" />
            {item.changePercent !== undefined && (
              <span
                className={clsx("text-xs font-medium", isGain ? "gain" : isLoss ? "loss" : "text-[var(--text-muted)]")}
              >
                {isGain ? "+" : ""}{item.changePercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
