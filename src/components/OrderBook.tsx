"use client";
import { clsx } from "clsx";
import { pipsToDisplay, type Pips } from "@/lib/pips";

export interface OrderBookEntry {
  pricePips: Pips;
  quantity: number;
  totalPips: Pips;
}

interface OrderBookProps {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  spreadPips?: Pips;
  lastTradePips?: Pips;
  className?: string;
}

function Row({
  entry,
  side,
  maxTotal,
}: {
  entry: OrderBookEntry;
  side: "ask" | "bid";
  maxTotal: bigint;
}) {
  const fillPct = maxTotal > 0n ? Number((entry.totalPips * 100n) / maxTotal) : 0;

  return (
    <div className="relative flex items-center justify-between px-3 py-[3px] text-xs font-mono">
      <div
        className={clsx(
          "absolute inset-y-0 right-0 opacity-10",
          side === "ask" ? "bg-[var(--loss)]" : "bg-[var(--gain)]",
        )}
        style={{ width: `${fillPct}%` }}
      />
      <span className={side === "ask" ? "loss" : "gain"}>
        {pipsToDisplay(entry.pricePips)}
      </span>
      <span className="text-[var(--text-muted)]">{entry.quantity}</span>
      <span className="text-[var(--text-hint)]">{pipsToDisplay(entry.totalPips)}</span>
    </div>
  );
}

export function OrderBook({ asks, bids, spreadPips, lastTradePips, className }: OrderBookProps) {
  const maxAskTotal = asks.reduce((m, r) => (r.totalPips > m ? r.totalPips : m), 0n);
  const maxBidTotal = bids.reduce((m, r) => (r.totalPips > m ? r.totalPips : m), 0n);

  return (
    <div
      className={clsx("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]", className)}
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--text-primary)]">Order book</span>
        <span className="text-[10px] text-[var(--text-hint)] font-mono">pip precision · $0.00001</span>
      </div>

      <div className="flex justify-between px-3 py-1 text-[10px] text-[var(--text-hint)]">
        <span>Price (USD)</span>
        <span>Qty</span>
        <span>Total</span>
      </div>

      <div className="space-y-0.5">
        {asks.slice().reverse().map((ask, i) => (
          <Row key={i} entry={ask} side="ask" maxTotal={maxAskTotal} />
        ))}
      </div>

      {spreadPips !== undefined && (
        <div
          className="my-0.5 flex items-center justify-between border-y border-[var(--border)] px-3 py-1.5 text-[11px]"
        >
          <span className="text-[var(--text-muted)]">
            {lastTradePips && (
              <span className="font-mono text-[var(--text-primary)]">{pipsToDisplay(lastTradePips)}</span>
            )}
          </span>
          <span className="text-[var(--text-hint)]">
            Spread <span className="font-mono">{pipsToDisplay(spreadPips)}</span>
          </span>
        </div>
      )}

      <div className="space-y-0.5">
        {bids.map((bid, i) => (
          <Row key={i} entry={bid} side="bid" maxTotal={maxBidTotal} />
        ))}
      </div>
    </div>
  );
}
