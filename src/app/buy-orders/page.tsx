"use client";
import { useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClasses } from "@/components/ui/Input";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { ALL_PHASES } from "@/lib/phase-map";
import { parseSeeds, type SkinSearchFilters } from "@/lib/search-params";
import { demoBuyOrders, type DemoBuyOrder } from "@/lib/demo-data";

/** Apply the search bar's filters to the (demo) order list. */
function matches(order: DemoBuyOrder, f: SkinSearchFilters): boolean {
  if (f.skinName && !`${order.weapon} ${order.skinName}`.toLowerCase().includes(f.skinName.toLowerCase())) return false;
  if (f.phases?.length && (order.phase == null || !f.phases.includes(order.phase))) return false;
  if (f.paintSeeds?.length && !order.seeds.some((s) => f.paintSeeds!.includes(s))) return false;
  // An order wants floats ≤ floatMax; show it if that overlaps the searched range.
  if (f.floatMin !== undefined && order.floatMax != null && order.floatMax < f.floatMin) return false;
  return true;
}

export default function BuyOrdersPage() {
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [showCreate, setShowCreate] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [seeds, setSeeds] = useState<number[]>([]);
  const [filters, setFilters] = useState<SkinSearchFilters>({});
  const allOrders = useMemo(() => demoBuyOrders(), []);
  const orders = useMemo(() => allOrders.filter((o) => matches(o, filters)), [allOrders, filters]);

  function addSeeds() {
    const parsed = parseSeeds(seedInput);
    setSeeds((p) => Array.from(new Set([...p, ...parsed])));
    setSeedInput("");
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Buy orders</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Standing bids that auto-fill when a matching listing appears. Filter by phase, float, unlimited seeds, stickers &amp; charms.
          </p>
        </div>
        <Button variant="primary" aria-expanded={showCreate} aria-controls="create-buy-order" onClick={() => setShowCreate((p) => !p)}>
          + Create buy order
        </Button>
      </div>

      <div role="tablist" aria-label="Buy orders" className="flex gap-3 border-b border-[var(--border)]">
        {(["browse", "mine"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="buy-orders-panel"
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm transition-colors ${tab === t ? "border-b-2 border-[var(--accent)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            {t === "browse" ? "Browse orders" : "My orders"}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="space-y-4">
          <h2 id="create-buy-order" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New buy order</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="bo-skin" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Skin / weapon</label>
              <input id="bo-skin" placeholder="e.g. Karambit Gamma Doppler" className={inputClasses()} />
            </div>
            <div>
              <label htmlFor="bo-price" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max price ($)</label>
              <input id="bo-price" inputMode="decimal" autoComplete="off" placeholder="e.g. 1247.5480" className={inputClasses("font-mono")} />
            </div>
            <div>
              <label htmlFor="bo-float" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max float</label>
              <input id="bo-float" inputMode="decimal" autoComplete="off" placeholder="e.g. 0.01000" className={inputClasses("font-mono")} />
            </div>
            <div>
              <label htmlFor="bo-phase" className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Required phase</label>
              <select id="bo-phase" className={inputClasses()}>
                <option value="">Any</option>
                {ALL_PHASES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <label htmlFor="bo-seeds" style={{ color: "var(--text-muted)" }}>Paint seeds (no limit)</label>
                {seeds.length > 0 && (
                  <button type="button" onClick={() => setSeeds([])} className="text-[var(--loss)] hover:underline">
                    {seeds.length} added · clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id="bo-seeds"
                  inputMode="numeric"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSeeds()}
                  placeholder="Paste seeds: 412, 661, 999 …"
                  className={inputClasses("flex-1 font-mono")}
                />
                <Button variant="secondary" size="sm" onClick={addSeeds}>Add</Button>
              </div>
              {seeds.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {seeds.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-label={`Remove seed ${s}`}
                      onClick={() => setSeeds((p) => p.filter((x) => x !== s))}
                      className="cursor-pointer rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent)] hover:bg-[var(--loss)] hover:text-white"
                    >
                      #{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary">Place buy order</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div id="buy-orders-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-5">
        {tab === "mine" ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No open buy orders</p>
              <p className="max-w-sm text-xs" style={{ color: "var(--text-muted)" }}>
                Orders you place reserve funds from your wallet and fill automatically when a matching listing appears.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>Create buy order</Button>
            </div>
          </Card>
        ) : (
          <>
            <SearchBar onSearch={setFilters} showAdvanced />

            {orders.length === 0 ? (
              <p className="rounded-[var(--radius-lg)] border border-[var(--border)] py-12 text-center text-sm" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                No buy orders match your search.
              </p>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li key={order.id} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5" style={{ background: "var(--bg-surface)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{order.weapon} | {order.skinName}</span>
                        {order.phase && <Badge variant="phase">{order.phase}</Badge>}
                        <Badge variant={order.status === "OPEN" ? "gain" : "warn"} className="text-[10px]">{order.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {order.floatMax != null && <span>Float ≤ {order.floatMax.toFixed(3)}</span>}
                        {order.seeds.length > 0 && <span>{order.seeds.length} seed{order.seeds.length > 1 ? "s" : ""}: {order.seeds.slice(0, 3).map((s) => `#${s}`).join(", ")}{order.seeds.length > 3 ? " …" : ""}</span>}
                        {order.filled > 0 && <span>{order.filled} filled</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <PipDisplay pips={order.pricePips} size="md" />
                      <Button variant="secondary" size="sm">Sell to this order</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
