"use client";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PipDisplay } from "@/components/ui/PipDisplay";
import { type SkinSearchFilters } from "@/lib/search-params";

const MOCK_ORDERS = [
  { id: "1", skinName: "Gamma Doppler", weapon: "Karambit", phase: "Emerald", floatMax: 0.01, seeds: [412, 189, 712], pricePips: 120000000n, filled: 0, status: "OPEN" },
  { id: "2", skinName: "Case Hardened", weapon: "AK-47", phase: null, floatMax: 0.5, seeds: [661, 4, 44, 955], pricePips: 400000000n, filled: 0, status: "OPEN" },
  { id: "3", skinName: "Doppler", weapon: "Bayonet", phase: "Sapphire", floatMax: 0.02, seeds: [], pricePips: 75000000n, filled: 1, status: "PARTIAL" },
];

export default function BuyOrdersPage() {
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [showCreate, setShowCreate] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [seeds, setSeeds] = useState<number[]>([]);

  function addSeeds() {
    const parsed = seedInput.split(/[\s,;]+/).map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 1000);
    setSeeds((p) => Array.from(new Set([...p, ...parsed])));
    setSeedInput("");
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Buy orders</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Standing bids that auto-fill when a matching listing appears. Filter by phase, float, unlimited seeds, stickers & charms.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate((p) => !p)}>
          + Create buy order
        </Button>
      </div>

      <div className="flex gap-3 border-b border-[var(--border)]">
        {(["browse", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2.5 text-sm transition-colors ${tab === t ? "border-b-2 border-[var(--accent)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            {t === "browse" ? "Browse orders" : "My orders"}
          </button>
        ))}
      </div>

      {showCreate && (
        <Card className="space-y-4">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New buy order</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Skin / weapon</label>
              <input placeholder="e.g. Karambit Gamma Doppler" className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }}/>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max price ($)</label>
              <input placeholder="e.g. 1247.5480" className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }}/>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Max float</label>
              <input placeholder="e.g. 0.01000" className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }}/>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-muted)" }}>Required phase</label>
              <select className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm outline-none" style={{ color: "var(--text-primary)" }}>
                <option value="">Any</option>
                <option>Emerald</option><option>Ruby</option><option>Sapphire</option><option>Black Pearl</option>
                <option>Phase 1</option><option>Phase 2</option><option>Phase 3</option><option>Phase 4</option>
                <option>Gamma Phase 1</option><option>Gamma Phase 2</option><option>Gamma Phase 3</option><option>Gamma Phase 4</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Paint seeds (no limit)</span>
                {seeds.length > 0 && <button onClick={() => setSeeds([])} className="text-[var(--loss)] hover:underline">{seeds.length} added — clear</button>}
              </label>
              <div className="flex gap-2">
                <input value={seedInput} onChange={(e) => setSeedInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSeeds()} placeholder="Paste seeds: 412, 661, 999 …" className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 font-mono text-sm outline-none focus:border-[var(--border-focus)]" style={{ color: "var(--text-primary)" }}/>
                <Button variant="secondary" size="sm" onClick={addSeeds}>Add</Button>
              </div>
              {seeds.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {seeds.map((s) => (
                    <span key={s} onClick={() => setSeeds((p) => p.filter((x) => x !== s))} className="cursor-pointer rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent)] hover:bg-[var(--loss)] hover:text-white">#{s}</span>
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

      <SearchBar onSearch={(f: SkinSearchFilters) => console.log(f)} showAdvanced />

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] px-5 py-4" style={{ background: "var(--bg-surface)" }}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{order.weapon} | {order.skinName}</span>
                {order.phase && <Badge variant="phase">{order.phase}</Badge>}
                <Badge variant={order.status === "OPEN" ? "gain" : "warn"} className="text-[10px]">{order.status}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Float ≤ {order.floatMax.toFixed(3)}</span>
                {order.seeds.length > 0 && <span>{order.seeds.length} seed{order.seeds.length > 1 ? "s" : ""}: {order.seeds.slice(0, 3).map((s) => `#${s}`).join(", ")}{order.seeds.length > 3 ? " …" : ""}</span>}
              </div>
            </div>
            <PipDisplay pips={order.pricePips} size="md" />
            <Button variant="ghost" size="sm" className="text-[var(--loss)]">Cancel</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
