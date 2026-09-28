import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClasses } from "@/components/ui/Input";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { OrderBook } from "@/components/OrderBook";
import { PriceChart } from "@/components/PriceChart";
import { SkinImage } from "@/components/SkinImage";
import { getItemDetail, itemTitle } from "@/lib/item-detail";
import { pipsToExact, pipsToUSD } from "@/lib/pips";
import { ItemTradePanel } from "./ItemTradePanel";

function liqColor(score: number): string {
  if (score >= 66) return "var(--gain)";
  if (score >= 33) return "var(--warn)";
  return "var(--loss)";
}

export async function generateMetadata(props: PageProps<"/market/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const item = await getItemDetail(id);
  if (!item) return { title: "Item not found" };
  const title = itemTitle(item);
  const price = item.listingPricePips ?? item.asks[0]?.pricePips;
  return {
    title,
    description: price != null
      ? `${title} listed at ${pipsToUSD(price)} on SkinPip. Order book, price history and recent sales.`
      : `${title} on SkinPip. Order book, price history and recent sales.`,
    openGraph: item.imageUrl ? { images: [{ url: item.imageUrl }] } : undefined,
  };
}

export default async function ItemPage(props: PageProps<"/market/[id]">) {
  const { id } = await props.params;
  const item = await getItemDetail(id);
  if (!item) notFound();

  const lowestAsk = item.asks[0]?.pricePips ?? null;
  const highestBid = item.bids[0]?.pricePips ?? null;
  const spread = lowestAsk != null && highestBid != null && lowestAsk >= highestBid ? lowestAsk - highestBid : null;

  const attributes = ([
    ["Phase", item.phaseLabel],
    ["Pattern", item.patternTierLabel],
    ["Seed", item.paintSeed != null ? `#${item.paintSeed}` : null],
    ["Wear", item.wearName],
    ["Rarity", item.rarity],
    ["Collection", item.collection],
  ] as [string, string | null][]).filter(([, v]) => v != null);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/market" className="hover:text-[var(--text-primary)]">Market</Link>
        <span aria-hidden>/</span>
        <span>{item.weaponName}</span>
        <span aria-hidden>/</span>
        <span aria-current="page" style={{ color: "var(--text-primary)" }}>{item.skinName}</span>
        {item.source === "demo" && (
          <span
            className="ml-2 rounded-full border px-2 py-0.5 text-[10px] font-medium"
            style={{ borderColor: "var(--warn)", color: "var(--warn)" }}
            title="Demo item: deterministic sample data, not a live listing."
          >
            Demo data
          </span>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* ── Left: item + attributes ── */}
        <div className="space-y-4">
          <Card padding={false} className="overflow-hidden">
            <div className="flex h-48 items-center justify-center" style={{ background: "var(--bg-input)" }}>
              <SkinImage
                src={item.imageUrl}
                alt={itemTitle(item)}
                width={320}
                height={240}
                priority
                className="h-40 w-full"
              />
            </div>
            <div className="space-y-2.5 p-3">
              {item.paintWear != null && (
                <>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>Float</span>
                    <span className="font-mono">{item.paintWear.toFixed(5)}</span>
                  </div>
                  <div className="relative h-1.5 rounded-full" style={{ background: "var(--border)" }} aria-hidden>
                    <span
                      className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg-surface)]"
                      style={{ left: `${Math.min(100, item.paintWear * 100)}%`, background: "var(--accent)" }}
                    />
                  </div>
                </>
              )}
              <dl className="space-y-1">
                {attributes.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-xs">
                    <dt style={{ color: "var(--text-muted)" }}>{k}</dt>
                    <dd className={k === "Phase" ? "gain text-right" : "text-right"} style={{ color: k === "Phase" ? undefined : "var(--text-primary)" }}>{v}</dd>
                  </div>
                ))}
                {item.liquidity != null && (
                  <div className="flex justify-between text-xs">
                    <dt style={{ color: "var(--text-muted)" }} title="Higher means easier to sell near the listed price">Liquidity</dt>
                    <dd className="font-mono" style={{ color: liqColor(item.liquidity) }}>{item.liquidity}/100</dd>
                  </div>
                )}
              </dl>
              <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                Inspect in game
              </Button>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Stickers</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {item.stickers.length ? item.stickers.map((s) => s.name).join(", ") : "No stickers"}
            </p>
          </Card>
        </div>

        {/* ── Middle: price + chart + sales ── */}
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.weaponName}</p>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{item.skinName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {item.phaseLabel && <Badge variant="phase">{item.phaseLabel}</Badge>}
              {item.patternTierLabel && <Badge variant="accent">{item.patternTierLabel}</Badge>}
              {item.wearName && <Badge variant="muted">{item.wearName}</Badge>}
              {item.isStatTrak && <Badge variant="warn">StatTrak™</Badge>}
              {item.isSouvenir && <Badge variant="warn">Souvenir</Badge>}
            </div>
          </div>

          <ItemTradePanel
            listingPricePips={item.listingPricePips}
            lowestAskPips={lowestAsk}
            highestBidPips={highestBid}
          />

          <PriceChart data={item.candles} />

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Recent sales</h2>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Latest {item.recentSales.length}</p>
            </div>
            {item.recentSales.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>No sales yet</p>
            ) : (
              <ul className="space-y-1.5">
                {item.recentSales.map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-hint)" }}>{s.daysAgo === 0 ? "Today" : `${s.daysAgo}d ago`}</span>
                    <span className="font-mono" style={{ color: s.float == null ? "var(--text-hint)" : undefined }}>
                      {s.float != null ? s.float.toFixed(5) : "n/a"}
                    </span>
                    <PipDisplay pips={s.pricePips} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Right: order book + place order ── */}
        <div className="space-y-4 md:col-span-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 xl:col-span-1 xl:block xl:space-y-4">
          <OrderBook asks={item.asks} bids={item.bids} spreadPips={spread} lastTradePips={item.lastTradePips} />

          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Place buy order</h2>
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="bo-max-price" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max price (USD)</label>
                  <input
                    id="bo-max-price"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={highestBid != null ? pipsToExact(highestBid) : "0.0000"}
                    className={inputClasses("font-mono")}
                  />
                </div>
                <div>
                  <label htmlFor="bo-float-max" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Float max</label>
                  <input
                    id="bo-float-max"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="e.g. 0.01000"
                    className={inputClasses("font-mono")}
                  />
                </div>
                <Button variant="primary" size="md" className="w-full">Place buy order</Button>
              </div>
            </Card>

            <Card>
              <h2 className="mb-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>Other listings</h2>
              {item.asks.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>None right now</p>
              ) : (
                <ul className="space-y-2">
                  {item.asks.slice(0, 4).map((a) => (
                    <li key={a.pricePips.toString()} className="flex items-center justify-between text-xs">
                      <span className="font-mono" style={{ color: "var(--text-muted)" }}>qty {a.quantity}</span>
                      <PipDisplay pips={a.pricePips} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
