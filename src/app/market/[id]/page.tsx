"use client";
import { use, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { OrderBook, type OrderBookEntry } from "@/components/OrderBook";
import { PriceChart, type CandleData } from "@/components/PriceChart";

const MOCK_ASKS: OrderBookEntry[] = [
  { pricePips: 125100000n, quantity: 3, totalPips: 375300000n },
  { pricePips: 124924800n, quantity: 1, totalPips: 124924800n },
  { pricePips: 124755200n, quantity: 1, totalPips: 124755200n },
];
const MOCK_BIDS: OrderBookEntry[] = [
  { pricePips: 124755160n, quantity: 2, totalPips: 249510320n },
  { pricePips: 124600010n, quantity: 5, totalPips: 623000050n },
  { pricePips: 124433000n, quantity: 2, totalPips: 248866000n },
];

function generateCandles(): CandleData[] {
  const out: CandleData[] = [];
  let price = 1180;
  const now = Math.floor(Date.now() / 1000);
  for (let i = 29; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * 20;
    const close = Math.max(800, price + change);
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    out.push({ time: now - i * 86400, open, high, low, close, volume: Math.floor(Math.random() * 10 + 1) });
    price = close;
  }
  return out;
}

const CANDLES = generateCandles();

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [buyMode, setBuyMode] = useState<"buy" | "offer">("buy");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <a href="/market" className="hover:text-[var(--text-primary)]">Market</a>
        <span>/</span>
        <span>Knives</span>
        <span>/</span>
        <span>Karambit</span>
        <span>/</span>
        <span style={{ color: "var(--text-primary)" }}>Gamma Doppler</span>
        <Badge variant="phase" className="ml-1">Emerald</Badge>
      </nav>

      <div className="grid grid-cols-[260px_1fr_280px] gap-5">
        <div className="space-y-4">
          <Card padding={false} className="overflow-hidden">
            <div className="flex h-48 items-center justify-center" style={{ background: "var(--bg-input)" }}>
              <svg width="180" height="140" viewBox="0 0 180 140" aria-label="Karambit Gamma Doppler Emerald" role="img">
                <circle cx="45" cy="104" r="12" fill="none" stroke="#1F8E66" strokeWidth="5"/>
                <path d="M52 97 Q135 90 158 38 Q134 64 108 74 Q119 88 87 101 Q67 107 52 97 Z" fill="#25E59A"/>
                <path d="M56 95 Q126 86 152 44 Q130 64 108 72 Q114 83 90 94 Q72 99 56 95 Z" fill="#16C784"/>
                <rect x="40" y="109" width="24" height="6" rx="1.5" transform="rotate(34 52 112)" fill="#143C30"/>
              </svg>
            </div>
            <div className="p-3 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Float</span>
                <span className="font-mono">0.00834</span>
              </div>
              <div className="relative h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                <span className="absolute top-1/2 size-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-[var(--bg-surface)]" style={{ left: "0.834%", background: "var(--accent)" }} />
              </div>
              <div className="space-y-1">
                {[
                  ["Phase", "Emerald"],
                  ["Seed", "#412"],
                  ["Wear", "Factory New"],
                  ["Rarity", "Covert"],
                  ["Collection", "Gamma"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>{k}</span>
                    <span className={k === "Phase" ? "gain" : ""} style={{ color: k === "Phase" ? undefined : "var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6 3v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Inspect in game
              </Button>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Stickers</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>No stickers</p>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Charm</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>No charm</p>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Karambit</p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Gamma Doppler</h1>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="phase">Emerald</Badge>
              <Badge variant="muted">Factory New</Badge>
              <Badge variant="muted">Seed #412</Badge>
              <span className="text-xs gain">+4.8% 7d</span>
            </div>
          </div>

          <Card>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Lowest ask</p>
                <PipDisplay pips={124755200n} size="xl" />
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Highest bid</p>
                <PipDisplay pips={124755160n} size="lg" />
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-hint)" }}>
              <span>Spread:</span>
              <span className="font-mono">$0.<span style={{ color: "var(--accent)" }}>0040</span></span>
              <span>·</span>
              <span>pip precision · $0.00001 min increment</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant={buyMode === "buy" ? "primary" : "secondary"}
                size="md"
                className="flex-1"
                onClick={() => setBuyMode("buy")}
              >
                Buy now — <PipDisplay pips={124755200n} size="sm" className="ml-1" />
              </Button>
              <Button
                variant={buyMode === "offer" ? "secondary" : "ghost"}
                size="md"
                className="flex-1"
                onClick={() => setBuyMode("offer")}
              >
                Make offer
              </Button>
            </div>

            {buyMode === "offer" && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2" style={{ background: "var(--bg-input)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>$</span>
                  <input
                    placeholder="0.0000"
                    className="flex-1 bg-transparent font-mono text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                <Button variant="primary" size="md" className="w-full">Submit offer</Button>
              </div>
            )}
          </Card>

          <PriceChart data={CANDLES} />

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Recent sales</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Last 30 days</p>
            </div>
            <div className="space-y-1.5">
              {[
                { date: "Jun 22", price: 124200000n, float: 0.00901 },
                { date: "Jun 20", price: 121500000n, float: 0.01234 },
                { date: "Jun 18", price: 119800000n, float: 0.00788 },
                { date: "Jun 15", price: 118000000n, float: 0.00567 },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: "var(--text-hint)" }}>{s.date}</span>
                  <span className="font-mono">{s.float.toFixed(5)}</span>
                  <PipDisplay pips={s.price} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <OrderBook
            asks={MOCK_ASKS}
            bids={MOCK_BIDS}
            spreadPips={40n}
            lastTradePips={124755180n}
          />

          <Card>
            <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Place buy order</p>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max price (USD)</label>
                <input
                  placeholder="e.g. 1247.5480"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Float max</label>
                <input
                  placeholder="e.g. 0.01000"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Required phase</label>
                <select className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }}>
                  <option value="">Any phase</option>
                  <option>Emerald</option>
                  <option>Phase 1</option>
                  <option>Phase 2</option>
                  <option>Phase 3</option>
                  <option>Phase 4</option>
                </select>
              </div>
              <Button variant="primary" size="md" className="w-full">Place buy order</Button>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Other listings (same phase)</p>
            <div className="space-y-2">
              {[
                { float: 0.01245, pricePips: 126000000n, seed: 189 },
                { float: 0.00512, pricePips: 131500000n, seed: 712 },
                { float: 0.00034, pricePips: 155000000n, seed: 999 },
              ].map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>{l.float.toFixed(5)}</span>
                  <span className="font-mono" style={{ color: "var(--text-hint)" }}>#{l.seed}</span>
                  <PipDisplay pips={l.pricePips} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
