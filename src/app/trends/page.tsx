"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { PriceChart } from "@/components/PriceChart";
import { pipsToUSD } from "@/lib/pips";
import {
  demoIndices,
  demoTopMovers,
  demoMarketCap,
  type DemoIndex,
} from "@/lib/demo-data";

type Timeframe = 1 | 7 | 30;
const TF_LABEL: Record<Timeframe, string> = { 1: "24h", 7: "7d", 30: "30d" };

function Delta({ value }: { value: number }) {
  const cls = value > 0 ? "gain" : value < 0 ? "loss" : "text-[var(--text-muted)]";
  return (
    <span className={`font-medium ${cls}`}>
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function indexDelta(idx: DemoIndex, tf: Timeframe): number {
  return tf === 1 ? idx.change24h : tf === 7 ? idx.change7d : idx.change30d;
}

export default function TrendsPage() {
  const [tf, setTf] = useState<Timeframe>(7);
  const cap = demoMarketCap();
  const indices = demoIndices();
  const { gainers, losers } = demoTopMovers(tf, 6);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const capChange = tf === 1 ? cap.change24h : tf === 7 ? cap.change7d : cap.change30d;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Trends</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Total market cap, category indices, and top movers
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border)] p-0.5" style={{ background: "var(--bg-surface)" }}>
          {([1, 7, 30] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`rounded-[var(--radius-sm)] px-3 py-1 text-xs transition-colors ${
                tf === t ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {TF_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Market cap dashboard ── */}
      <Card>
        <div className="grid grid-cols-4 gap-5">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total market cap</p>
            <p className="mt-1 font-mono text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {pipsToUSD(cap.totalPips)}
            </p>
            <p className="mt-0.5 text-xs"><Delta value={capChange} /> <span style={{ color: "var(--text-hint)" }}>{TF_LABEL[tf]}</span></p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>24h volume</p>
            <p className="mt-1 font-mono text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {pipsToUSD(cap.volume24hPips)}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-hint)" }}>across all markets</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Active listings</p>
            <p className="mt-1 font-mono text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {cap.activeListings.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-hint)" }}>live now</p>
          </div>
          <div>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>Composition</p>
            <div className="space-y-1.5">
              {cap.categories.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>{c.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--bg-input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(c.share * 100)}%`, background: "var(--accent)" }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[10px]" style={{ color: "var(--text-hint)" }}>
                    {Math.round(c.share * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Indices + chart ── */}
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{indices[selectedIndex].name}</CardTitle>
              <div className="flex items-center gap-3">
                <PipDisplay pips={indices[selectedIndex].valuePips} size="sm" />
                <Delta value={indexDelta(indices[selectedIndex], tf)} />
              </div>
            </CardHeader>
            <PriceChart data={indices[selectedIndex].candles} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category indices</CardTitle>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{TF_LABEL[tf]} change</span>
            </CardHeader>
            <div className="space-y-1">
              {indices.map((idx, i) => (
                <button
                  key={idx.key}
                  onClick={() => setSelectedIndex(i)}
                  className={`flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors ${
                    i === selectedIndex ? "bg-[var(--accent-dim)]" : "hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{idx.name}</span>
                  <div className="flex items-center gap-3">
                    <PipDisplay pips={idx.valuePips} size="sm" />
                    <span className="w-14 text-right text-xs"><Delta value={indexDelta(idx, tf)} /></span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Top movers ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Top gainers</CardTitle>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{TF_LABEL[tf]}</span>
            </CardHeader>
            <div className="space-y-2">
              {gainers.map((m) => (
                <Link key={m.id} href={`/market/${m.id}`} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--bg-elevated)]">
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  <PipDisplay pips={m.pricePips} size="sm" />
                  <span className="w-12 text-right text-xs"><Delta value={m.change} /></span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top losers</CardTitle>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{TF_LABEL[tf]}</span>
            </CardHeader>
            <div className="space-y-2">
              {losers.map((m) => (
                <Link key={m.id} href={`/market/${m.id}`} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--bg-elevated)]">
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                  <PipDisplay pips={m.pricePips} size="sm" />
                  <span className="w-12 text-right text-xs"><Delta value={m.change} /></span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
