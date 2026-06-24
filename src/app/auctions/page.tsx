"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PipDisplay } from "@/components/ui/PipDisplay";

interface MockAuction {
  id: string;
  weapon: string;
  skinName: string;
  phase: string | null;
  wear: string;
  float: number;
  currentBidPips: bigint;
  startPricePips: bigint;
  buyNowPips: bigint | null;
  endsAt: Date;
  bidCount: number;
  isStatTrak: boolean;
}

const MOCK_AUCTIONS: MockAuction[] = [
  { id: "1", weapon: "Karambit", skinName: "Gamma Doppler", phase: "Emerald", wear: "FN", float: 0.00834, currentBidPips: 118000000n, startPricePips: 100000000n, buyNowPips: 140000000n, endsAt: new Date(Date.now() + 3 * 3600_000 + 27 * 60_000), bidCount: 7, isStatTrak: false },
  { id: "2", weapon: "AWP", skinName: "Dragon Lore", phase: null, wear: "FN", float: 0.011, currentBidPips: 485000000n, startPricePips: 450000000n, buyNowPips: null, endsAt: new Date(Date.now() + 22 * 3600_000), bidCount: 14, isStatTrak: false },
  { id: "3", weapon: "Butterfly Knife", skinName: "Doppler", phase: "Sapphire", wear: "FN", float: 0.00211, currentBidPips: 88000000n, startPricePips: 70000000n, buyNowPips: 100000000n, endsAt: new Date(Date.now() + 47 * 60_000), bidCount: 3, isStatTrak: true },
];

function Countdown({ endsAt }: { endsAt: Date }) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, endsAt.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const h = Math.floor(remaining / 3600_000);
  const m = Math.floor((remaining % 3600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const isUrgent = remaining < 5 * 60_000;

  return (
    <span className={`font-mono text-sm ${isUrgent ? "loss animate-pulse" : "text-[var(--text-primary)]"}`}>
      {h > 0 ? `${h}h ` : ""}{m.toString().padStart(2, "0")}m {s.toString().padStart(2, "0")}s
    </span>
  );
}

export default function AuctionsPage() {
  const [bidValues, setBidValues] = useState<Record<string, string>>({});

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Auctions</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            English-style, anti-snipe, proxy bidding. Sub-cent pip increments.
          </p>
        </div>
        <Button variant="primary">List item for auction</Button>
      </div>

      <div className="space-y-4">
        {MOCK_AUCTIONS.map((a) => (
          <div
            key={a.id}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]"
            style={{ background: "var(--bg-surface)" }}
          >
            <div className="flex items-center gap-5 p-5">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                style={{ background: "var(--bg-input)" }}
              >
                <span className="text-2xl" aria-label="knife">🔪</span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.weapon} | {a.skinName}
                  </h2>
                  {a.phase && <Badge variant="phase">{a.phase}</Badge>}
                  {a.isStatTrak && <Badge variant="warn">StatTrak™</Badge>}
                  <Badge variant="muted">{a.wear}</Badge>
                </div>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Float: {a.float.toFixed(5)} · {a.bidCount} bids
                </p>
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current bid</p>
                <PipDisplay pips={a.currentBidPips} size="lg" />
                {a.buyNowPips && (
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                    Buy now: <span className="font-mono text-[var(--accent)]">${(Number(a.buyNowPips) / 100000).toFixed(2)}</span>
                  </p>
                )}
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ends in</p>
                <Countdown endsAt={a.endsAt} />
                <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Anti-snipe: +60s on late bid</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5" style={{ background: "var(--bg-input)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>$</span>
                  <input
                    value={bidValues[a.id] ?? ""}
                    onChange={(e) => setBidValues((p) => ({ ...p, [a.id]: e.target.value }))}
                    placeholder={`>${(Number(a.currentBidPips) / 100000).toFixed(4)}`}
                    className="w-28 bg-transparent font-mono text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                <Button variant="primary" size="sm" className="w-full">Place bid</Button>
                {a.buyNowPips && (
                  <Button variant="secondary" size="sm" className="w-full">Buy now</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
