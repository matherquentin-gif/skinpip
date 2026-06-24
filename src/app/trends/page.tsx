"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { PriceChart, type CandleData } from "@/components/PriceChart";

function makeCandles(base: number, days = 30): CandleData[] {
  const out: CandleData[] = [];
  let price = base;
  const now = Math.floor(Date.now() / 1000);
  for (let i = days - 1; i >= 0; i--) {
    const o = price;
    const change = (Math.random() - 0.47) * base * 0.04;
    const c = Math.max(base * 0.5, o + change);
    out.push({ time: now - i * 86400, open: o, high: Math.max(o, c) * 1.01, low: Math.min(o, c) * 0.99, close: c, volume: Math.floor(Math.random() * 15 + 1) });
    price = c;
  }
  return out;
}

const TOP_MOVERS = [
  { name: "Karambit | Gamma Doppler (FN)", pricePips: 124755200n, change: 12.4 },
  { name: "AK-47 | Case Hardened (FT) Seed #661", pricePips: 450000000n, change: 8.7 },
  { name: "AWP | Dragon Lore (FN)", pricePips: 500000000n, change: 6.2 },
  { name: "Karambit | Doppler Sapphire (FN)", pricePips: 89500000n, change: -3.1 },
  { name: "Butterfly Knife | Fade (FN) Full", pricePips: 72000000n, change: -5.8 },
];

const INDICES = [
  { name: "Knives index", pricePips: 89400000n, change: 3.2, candles: makeCandles(894) },
  { name: "AWP index", pricePips: 23100000n, change: -1.4, candles: makeCandles(231) },
  { name: "Sticker capsules", pricePips: 200n, change: 0.8, candles: makeCandles(0.002) },
];

export default function TrendsPage() {
  const [watchlistItems] = useState([
    { name: "Karambit | Gamma Doppler Emerald", pricePips: 124755200n, change: 4.8 },
    { name: "AK-47 | Case Hardened #661", pricePips: 450000000n, change: 12.3 },
    { name: "Butterfly Knife | Fade (Full)", pricePips: 72000000n, change: 1.2 },
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Trends</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Price history, market indices, and portfolio tracking
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Market indices</CardTitle>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>30-day</span>
            </CardHeader>
            <div className="space-y-4">
              {INDICES.map((idx) => (
                <div key={idx.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{idx.name}</span>
                    <div className="flex items-center gap-3">
                      <PipDisplay pips={idx.pricePips} size="sm" />
                      <span className={`text-xs font-medium ${idx.change >= 0 ? "gain" : "loss"}`}>
                        {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <PriceChart data={idx.candles} className="!rounded-[var(--radius-md)]" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top movers</CardTitle>
              <div className="flex gap-1">
                {["24h", "7d", "30d"].map((r) => (
                  <button key={r} className="rounded px-2 py-0.5 text-[10px] text-[var(--text-hint)] hover:text-[var(--text-muted)]">{r}</button>
                ))}
              </div>
            </CardHeader>
            <div className="space-y-2">
              {TOP_MOVERS.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[var(--radius-md)] p-2.5 hover:bg-[var(--bg-elevated)]">
                  <span className="w-5 text-xs text-right font-mono" style={{ color: "var(--text-hint)" }}>{i + 1}</span>
                  <span className="flex-1 text-sm truncate" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  <PipDisplay pips={m.pricePips} size="sm" />
                  <span className={`w-14 text-right text-xs font-medium ${m.change >= 0 ? "gain" : "loss"}`}>
                    {m.change >= 0 ? "+" : ""}{m.change.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>My watchlist</CardTitle>
              <button className="text-xs text-[var(--accent)] hover:underline">+ Add</button>
            </CardHeader>
            {watchlistItems.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>No items yet. Add skins to track prices.</p>
            ) : (
              <div className="space-y-3">
                {watchlistItems.map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs truncate max-w-[150px]" style={{ color: "var(--text-primary)" }}>{w.name}</p>
                      <span className={`text-[10px] font-medium ${w.change >= 0 ? "gain" : "loss"}`}>
                        {w.change >= 0 ? "+" : ""}{w.change.toFixed(1)}%
                      </span>
                    </div>
                    <PipDisplay pips={w.pricePips} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio value</CardTitle>
              <Badge variant="muted">—</Badge>
            </CardHeader>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              Connect your inventory to see portfolio value and P/L over time.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phase tracker</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                { phase: "Emerald (GD)", count: 3, avgPips: 124000000n },
                { phase: "Sapphire", count: 12, avgPips: 89000000n },
                { phase: "Ruby", count: 8, avgPips: 95000000n },
                { phase: "Black Pearl", count: 2, avgPips: 210000000n },
              ].map((p) => (
                <div key={p.phase} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="phase" className="text-[10px]">{p.phase}</Badge>
                    <span style={{ color: "var(--text-hint)" }}>{p.count} listed</span>
                  </div>
                  <PipDisplay pips={p.avgPips} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
