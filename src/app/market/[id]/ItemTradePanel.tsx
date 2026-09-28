"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { pipsToDisplay, pipsToUSD, sellerNetUSD, type Pips } from "@/lib/pips";

interface ItemTradePanelProps {
  /** This item's asking price, or null when it isn't listed. */
  listingPricePips: Pips | null;
  lowestAskPips: Pips | null;
  highestBidPips: Pips | null;
}

export function ItemTradePanel({ listingPricePips, lowestAskPips, highestBidPips }: ItemTradePanelProps) {
  const [mode, setMode] = useState<"buy" | "offer">("buy");
  const offerId = useId();
  const headlinePips = listingPricePips ?? lowestAskPips;
  const spread =
    lowestAskPips != null && highestBidPips != null && lowestAskPips >= highestBidPips
      ? lowestAskPips - highestBidPips
      : null;

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {listingPricePips != null ? "Listed at" : "Lowest ask"}
          </p>
          {headlinePips != null ? (
            <PipDisplay pips={headlinePips} size="xl" />
          ) : (
            <p className="text-lg" style={{ color: "var(--text-hint)" }}>No asks</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Highest bid</p>
          {highestBidPips != null ? (
            <PipDisplay pips={highestBidPips} size="lg" />
          ) : (
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No bids</p>
          )}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: "var(--text-hint)" }}>
        {spread != null && (
          <>
            <span>Spread:</span>
            <span className="font-mono" style={{ color: "var(--accent)" }}>${pipsToDisplay(spread)}</span>
            <span aria-hidden>·</span>
          </>
        )}
        <span>pip precision · $0.00001 min increment</span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {listingPricePips != null && (
          <Button
            variant={mode === "buy" ? "primary" : "secondary"}
            size="md"
            className="flex-1"
            aria-pressed={mode === "buy"}
            onClick={() => setMode("buy")}
          >
            {/* Plain text: PipDisplay's accent decimals vanish on the accent button. */}
            Buy now · <span className="font-mono">{pipsToUSD(listingPricePips)}</span>
          </Button>
        )}
        <Button
          variant={mode === "offer" ? "secondary" : "ghost"}
          size="md"
          className="flex-1"
          aria-pressed={mode === "offer"}
          aria-expanded={mode === "offer"}
          onClick={() => setMode("offer")}
        >
          Make offer
        </Button>
      </div>
      {headlinePips != null && (
        <p className="mt-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
          Sell at this price and you&apos;d net{" "}
          <span style={{ color: "var(--text-muted)" }}>{sellerNetUSD(headlinePips)}</span> after the 2% fee.
        </p>
      )}

      {mode === "offer" && (
        <div className="mt-3 space-y-2">
          <label htmlFor={offerId} className="block text-xs" style={{ color: "var(--text-muted)" }}>
            Your offer (USD)
          </label>
          <div
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 focus-within:border-[var(--border-focus)]"
            style={{ background: "var(--bg-input)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }} aria-hidden>$</span>
            <input
              id={offerId}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.0000"
              className="flex-1 bg-transparent font-mono text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <Button variant="primary" size="md" className="w-full">Submit offer</Button>
        </div>
      )}
    </Card>
  );
}
