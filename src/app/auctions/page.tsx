"use client";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { SkinImage } from "@/components/SkinImage";
import { demoAuctions, imageForKey, DEMO_AUCTION_MIN_INCREMENT_PIPS } from "@/lib/demo-data";
import { parseUsdToPips, pipsToExact, pipsToUSD } from "@/lib/pips";

function Countdown({ endsInMs }: { endsInMs: number }) {
  // Initialise from the static relative duration so the server-rendered HTML
  // and the first client render match exactly (no hydration mismatch). The
  // real wall-clock deadline is resolved on the client, inside the effect.
  const [remaining, setRemaining] = useState(endsInMs);

  useEffect(() => {
    const deadline = Date.now() + endsInMs;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsInMs]);

  const h = Math.floor(remaining / 3600_000);
  const m = Math.floor((remaining % 3600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const isUrgent = remaining < 5 * 60_000;

  if (remaining === 0) {
    return <span className="font-mono text-sm text-[var(--text-muted)]">Ended</span>;
  }

  return (
    // Read by screen readers once, not every second.
    <span className={`font-mono text-sm ${isUrgent ? "loss motion-safe:animate-pulse" : "text-[var(--text-primary)]"}`}>
      {h > 0 ? `${h}h ` : ""}{m.toString().padStart(2, "0")}m {s.toString().padStart(2, "0")}s
    </span>
  );
}

export default function AuctionsPage() {
  const [bidValues, setBidValues] = useState<Record<string, string>>({});
  // Static demo auctions: end times stay relative (endsInMs) so the Countdown
  // can resolve the real deadline client-side without a hydration mismatch.
  const auctions = demoAuctions();

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Auctions</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            English-style, anti-snipe, proxy bidding. Sub-cent pip increments.
          </p>
        </div>
        <Button variant="primary">List item for auction</Button>
      </div>

      <ul className="space-y-4">
        {auctions.map((a) => {
          const title = `${a.weapon} | ${a.skinName}`;
          const minBid = a.currentBidPips + DEMO_AUCTION_MIN_INCREMENT_PIPS;
          const raw = bidValues[a.id] ?? "";
          const bidPips = raw.trim() ? parseUsdToPips(raw) : null;
          const bidError =
            raw.trim() === "" ? null
            : bidPips === null ? "Enter a dollar amount"
            : bidPips < minBid ? `Minimum bid is $${pipsToExact(minBid)}`
            : null;
          const inputId = `bid-${a.id}`;

          return (
            <li
              key={a.id}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]"
              style={{ background: "var(--bg-surface)" }}
            >
              <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-md)] sm:h-24 sm:w-24"
                    style={{ background: "var(--bg-input)" }}
                  >
                    <SkinImage src={imageForKey(a.imageKey)} alt={title} className="h-16 w-full sm:h-20" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{title}</h2>
                      {a.phase && <Badge variant="phase">{a.phase}</Badge>}
                      {a.isStatTrak && <Badge variant="warn">StatTrak™</Badge>}
                      <Badge variant="muted">{a.wear}</Badge>
                    </div>
                    <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                      Float: {a.float.toFixed(5)} · {a.bidCount} bids
                    </p>
                  </div>
                </div>

                <div className="flex gap-8 lg:gap-5">
                  <div className="space-y-0.5 lg:text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current bid</p>
                    <PipDisplay pips={a.currentBidPips} size="lg" />
                    {a.buyNowPips && (
                      <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                        Buy now: <span className="font-mono text-[var(--accent)]">{pipsToUSD(a.buyNowPips)}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5 lg:text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ends in</p>
                    <Countdown endsInMs={a.endsInMs} />
                    <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Anti-snipe: +60s on late bid</p>
                  </div>
                </div>

                <div className="space-y-2 lg:w-48">
                  <label htmlFor={inputId} className="sr-only">Your bid for {title} in USD</label>
                  <div
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-1.5 focus-within:border-[var(--border-focus)]"
                    style={{ background: "var(--bg-input)", borderColor: bidError ? "var(--loss)" : "var(--border)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-muted)" }} aria-hidden>$</span>
                    <input
                      id={inputId}
                      inputMode="decimal"
                      autoComplete="off"
                      value={raw}
                      onChange={(e) => setBidValues((p) => ({ ...p, [a.id]: e.target.value }))}
                      placeholder={pipsToExact(minBid)}
                      aria-invalid={bidError ? true : undefined}
                      aria-describedby={bidError ? `${inputId}-err` : undefined}
                      className="w-full min-w-0 bg-transparent font-mono text-sm outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                  {bidError && (
                    <p id={`${inputId}-err`} className="text-[10px]" style={{ color: "var(--loss)" }}>{bidError}</p>
                  )}
                  <div className="flex gap-2 lg:flex-col">
                    <Button variant="primary" size="sm" className="flex-1 lg:w-full" disabled={bidPips === null || bidError !== null}>
                      Place bid
                    </Button>
                    {a.buyNowPips && (
                      <Button variant="secondary" size="sm" className="flex-1 lg:w-full">Buy now</Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
