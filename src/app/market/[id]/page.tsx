"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { OrderBook } from "@/components/OrderBook";
import { PriceChart } from "@/components/PriceChart";
import { pipsToDisplay, sellerNetUSD } from "@/lib/pips";
import {
  catalogByKey,
  demoCandlesForKey,
  demoOrderBook,
  demoRecentSales,
  demoLiquidityScore,
  CATALOG,
} from "@/lib/demo-data";

function liqColor(score: number): string {
  if (score >= 66) return "var(--gain)";
  if (score >= 33) return "var(--warn)";
  return "var(--loss)";
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [buyMode, setBuyMode] = useState<"buy" | "offer">("buy");

  // Demo ids are catalog keys; DB cuids fall back to the first catalog entry.
  const entry = catalogByKey(id) ?? CATALOG[0];
  const candles = demoCandlesForKey(entry.key);
  const ob = demoOrderBook(entry.basePips, entry.key);
  const sales = demoRecentSales(entry.key, 5);
  const liquidity = demoLiquidityScore(entry.key);

  const lowestAsk = ob.asks[0].pricePips;
  const highestBid = ob.bids[0].pricePips;
  const spread = lowestAsk - highestBid;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/market" className="hover:text-[var(--text-primary)]">Market</Link>
        <span>/</span>
        <span>{entry.weaponName}</span>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>{entry.skinName}</span>
        {entry.phaseLabel && <Badge variant="phase" className="ml-1">{entry.phaseLabel}</Badge>}
      </nav>

      <div className="grid grid-cols-[260px_1fr_280px] gap-5">
        {/* ── Left: item + attributes ── */}
        <div className="space-y-4">
          <Card padding={false} className="overflow-hidden">
            <div className="flex h-48 items-center justify-center" style={{ background: "var(--bg-input)" }}>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>No image</span>
            </div>
            <div className="p-3 space-y-2.5">
              {entry.paintWear != null && (
                <>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>Float</span>
                    <span className="font-mono">{entry.paintWear.toFixed(5)}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <span
                      className="absolute top-1/2 size-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-[var(--bg-surface)]"
                      style={{ left: `${Math.min(100, entry.paintWear * 100)}%`, background: "var(--accent)" }}
                    />
                  </div>
                </>
              )}
              <div className="space-y-1">
                {([
                  ["Phase", entry.phaseLabel],
                  ["Pattern", entry.patternTierLabel],
                  ["Seed", entry.paintSeed != null ? `#${entry.paintSeed}` : null],
                  ["Wear", entry.wearName],
                  ["Rarity", entry.rarity],
                  ["Collection", entry.collection],
                ] as [string, string | null][])
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: "var(--text-muted)" }}>{k}</span>
                      <span className={k === "Phase" ? "gain" : ""} style={{ color: k === "Phase" ? undefined : "var(--text-primary)" }}>{v}</span>
                    </div>
                  ))}
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-muted)" }}>Liquidity</span>
                  <span className="font-mono" style={{ color: liqColor(liquidity) }}>{liquidity}/100</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                Inspect in game
              </Button>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Stickers</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {entry.stickers?.length ? entry.stickers.map((s) => s.name).join(", ") : "No stickers"}
            </p>
          </Card>
        </div>

        {/* ── Middle: price + chart + sales ── */}
        <div className="space-y-4">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{entry.weaponName}</p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{entry.skinName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {entry.phaseLabel && <Badge variant="phase">{entry.phaseLabel}</Badge>}
              {entry.patternTierLabel && <Badge variant="accent">{entry.patternTierLabel}</Badge>}
              {entry.wearName && <Badge variant="muted">{entry.wearName}</Badge>}
              {entry.isStatTrak && <Badge variant="warn">StatTrak™</Badge>}
            </div>
          </div>

          <Card>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Lowest ask</p>
                <PipDisplay pips={lowestAsk} size="xl" />
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Highest bid</p>
                <PipDisplay pips={highestBid} size="lg" />
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: "var(--text-hint)" }}>
              <span>Spread:</span>
              <span className="font-mono" style={{ color: "var(--accent)" }}>${pipsToDisplay(spread)}</span>
              <span>·</span>
              <span>pip precision · $0.00001 min increment</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant={buyMode === "buy" ? "primary" : "secondary"} size="md" className="flex-1" onClick={() => setBuyMode("buy")}>
                Buy now — <PipDisplay pips={lowestAsk} size="sm" className="ml-1" />
              </Button>
              <Button variant={buyMode === "offer" ? "secondary" : "ghost"} size="md" className="flex-1" onClick={() => setBuyMode("offer")}>
                Make offer
              </Button>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
              Sell here and you&apos;d net <span style={{ color: "var(--text-muted)" }}>{sellerNetUSD(lowestAsk)}</span> after the 2% fee.
            </p>

            {buyMode === "offer" && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2" style={{ background: "var(--bg-input)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>$</span>
                  <input placeholder="0.0000" className="flex-1 bg-transparent font-mono text-sm outline-none" style={{ color: "var(--text-primary)" }} />
                </div>
                <Button variant="primary" size="md" className="w-full">Submit offer</Button>
              </div>
            )}
          </Card>

          <PriceChart data={candles} />

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Recent sales</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Last 30 days</p>
            </div>
            <div className="space-y-1.5">
              {sales.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-hint)" }}>{s.daysAgo}d ago</span>
                  {entry.paintWear != null ? (
                    <span className="font-mono">{s.float.toFixed(5)}</span>
                  ) : (
                    <span className="font-mono" style={{ color: "var(--text-hint)" }}>—</span>
                  )}
                  <PipDisplay pips={s.pricePips} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: order book + place order ── */}
        <div className="space-y-4">
          <OrderBook asks={ob.asks} bids={ob.bids} spreadPips={spread} lastTradePips={ob.lastTradePips} />

          <Card>
            <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Place buy order</p>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max price (USD)</label>
                <input placeholder={pipsToDisplay(highestBid)} className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Float max</label>
                <input placeholder="e.g. 0.01000" className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }} />
              </div>
              <Button variant="primary" size="md" className="w-full">Place buy order</Button>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Other listings</p>
            <div className="space-y-2">
              {ob.asks.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>qty {a.quantity}</span>
                  <PipDisplay pips={a.pricePips} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
