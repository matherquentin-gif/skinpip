"use client";
import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { SkinCard, type SkinCardData } from "@/components/SkinCard";
import { type SkinSearchFilters } from "@/lib/search-params";
import { demoMarketItems } from "@/lib/demo-data";

const SORT_OPTIONS = [
  { value: "price_asc",   label: "Price: low to high" },
  { value: "price_desc",  label: "Price: high to low" },
  { value: "float_asc",   label: "Float: low to high" },
  { value: "float_desc",  label: "Float: high to low" },
  { value: "newest",      label: "Newest" },
];

const WEAR_OPTIONS = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

interface ApiItem extends Omit<SkinCardData, "pricePips"> {
  pricePips: string;
  liquidity?: number;
}

function toCard(it: ApiItem): SkinCardData {
  return { ...it, pricePips: BigInt(it.pricePips) };
}

export default function MarketPage() {
  // Render with demo data immediately; the API call replaces it (demo or DB).
  const [items, setItems] = useState<SkinCardData[]>(() => demoMarketItems());
  const [sort, setSort] = useState("price_asc");
  const [selectedWears, setSelectedWears] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filters, setFilters] = useState<SkinSearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"db" | "demo" | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.skinName) params.set("q", filters.skinName);
      if (filters.paintSeeds?.length) params.set("seeds", filters.paintSeeds.join(","));
      if (filters.phases?.length) params.set("phases", filters.phases.join(","));
      if (filters.floatMin !== undefined) params.set("floatMin", String(filters.floatMin));
      if (filters.floatMax !== undefined) params.set("floatMax", String(filters.floatMax));
      if (filters.isStatTrak !== undefined) params.set("statTrak", String(filters.isStatTrak));
      if (selectedWears.length) params.set("wears", selectedWears.join(","));
      params.set("sort", sort);

      const res = await fetch(`/api/market?${params}`);
      if (res.ok) {
        const data = await res.json();
        let mapped: SkinCardData[] = (data.items as ApiItem[]).map(toCard);
        // Client-side price-range filter (USD → pips).
        const min = priceMin ? BigInt(Math.round(parseFloat(priceMin) * 100_000)) : null;
        const max = priceMax ? BigInt(Math.round(parseFloat(priceMax) * 100_000)) : null;
        if (min !== null) mapped = mapped.filter((i) => i.pricePips >= min);
        if (max !== null) mapped = mapped.filter((i) => i.pricePips <= max);
        setItems(mapped);
        setSource(data.source ?? null);
      }
    } catch {
      // keep current items on error
    } finally {
      setLoading(false);
    }
  }, [filters, sort, selectedWears, priceMin, priceMax]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = useCallback((f: SkinSearchFilters) => setFilters(f), []);

  function toggleWear(w: string) {
    setSelectedWears((p) => (p.includes(w) ? p.filter((x) => x !== w) : [...p, w]));
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Market</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {items.length.toLocaleString()} listings · pip precision pricing · sub-cent trades
          </p>
        </div>
        {source === "demo" && (
          <span
            className="mt-1 shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(245,166,35,0.08)" }}
            title="No database connected — showing deterministic demo data. Run `npm run seed` for live DB data."
          >
            Demo data
          </span>
        )}
      </div>

      <SearchBar onSearch={handleSearch} className="mb-6" />

      <div className="flex gap-6">
        <aside className="w-52 shrink-0 space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 space-y-3" style={{ background: "var(--bg-surface)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Wear</p>
            {WEAR_OPTIONS.map((w) => (
              <label key={w} className="flex cursor-pointer items-center gap-2 text-xs" style={{ color: selectedWears.includes(w) ? "var(--accent)" : "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={selectedWears.includes(w)}
                  onChange={() => toggleWear(w)}
                  className="accent-[var(--accent)]"
                />
                {w}
              </label>
            ))}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 space-y-2" style={{ background: "var(--bg-surface)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Price range</p>
            <div className="space-y-1.5">
              <input
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min $"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[var(--border-focus)]"
                style={{ color: "var(--text-primary)" }}
              />
              <input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max $"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[var(--border-focus)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading…" : `${items.length} results`}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--border-focus)]"
              style={{ color: "var(--text-primary)" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)]"
                  style={{ background: "var(--bg-surface)" }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div
              className="rounded-[var(--radius-lg)] border border-[var(--border)] py-16 text-center text-sm"
              style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
            >
              No listings match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {items.map((item) => (
                <SkinCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
