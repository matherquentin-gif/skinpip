"use client";
import { useState, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { SkinCard, type SkinCardData } from "@/components/SkinCard";
import { type SkinSearchFilters } from "@/lib/search-params";

const SORT_OPTIONS = [
  { value: "price_asc",   label: "Price: low to high" },
  { value: "price_desc",  label: "Price: high to low" },
  { value: "float_asc",   label: "Float: low to high" },
  { value: "float_desc",  label: "Float: high to low" },
  { value: "newest",      label: "Newest" },
];

const WEAR_OPTIONS = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

const MOCK_ITEMS: SkinCardData[] = [
  {
    id: "1",
    skinName: "Gamma Doppler",
    weaponName: "Karambit",
    wearName: "Factory New",
    imageUrl: null,
    paintWear: 0.00834,
    paintSeed: 412,
    phaseLabel: "Emerald",
    patternTierLabel: null,
    isStatTrak: false,
    isSouvenir: false,
    pricePips: 124755200n,
    changePercent: 4.8,
  },
  {
    id: "2",
    skinName: "Doppler",
    weaponName: "Butterfly Knife",
    wearName: "Factory New",
    imageUrl: null,
    paintWear: 0.01245,
    paintSeed: 777,
    phaseLabel: "Sapphire",
    patternTierLabel: null,
    isStatTrak: true,
    isSouvenir: false,
    pricePips: 89500000n,
    changePercent: -2.1,
  },
  {
    id: "3",
    skinName: "Case Hardened",
    weaponName: "AK-47",
    wearName: "Field-Tested",
    imageUrl: null,
    paintWear: 0.23,
    paintSeed: 661,
    phaseLabel: null,
    patternTierLabel: "Blue Gem Tier 1",
    isStatTrak: false,
    isSouvenir: false,
    pricePips: 450000000n,
    changePercent: 12.3,
  },
  {
    id: "4",
    skinName: "Fade",
    weaponName: "Karambit",
    wearName: "Factory New",
    imageUrl: null,
    paintWear: 0.004,
    paintSeed: 100,
    phaseLabel: null,
    patternTierLabel: "Full Fade",
    isStatTrak: false,
    isSouvenir: false,
    pricePips: 72000000n,
    changePercent: 1.2,
  },
  {
    id: "5",
    skinName: "Redline",
    weaponName: "AK-47",
    wearName: "Field-Tested",
    imageUrl: null,
    paintWear: 0.18,
    paintSeed: 44,
    phaseLabel: null,
    patternTierLabel: null,
    isStatTrak: false,
    isSouvenir: false,
    pricePips: 1240n,
    changePercent: -0.3,
  },
  {
    id: "6",
    skinName: "Dragon Lore",
    weaponName: "AWP",
    wearName: "Factory New",
    imageUrl: null,
    paintWear: 0.01,
    paintSeed: 500,
    phaseLabel: null,
    patternTierLabel: null,
    isStatTrak: false,
    isSouvenir: false,
    pricePips: 500000000n,
    changePercent: 0.8,
  },
];

export default function MarketPage() {
  const [items, setItems] = useState<SkinCardData[]>(MOCK_ITEMS);
  const [sort, setSort] = useState("price_asc");
  const [selectedWears, setSelectedWears] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (filters: SkinSearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.skinName) params.set("q", filters.skinName);
      if (filters.paintSeeds?.length) params.set("seeds", filters.paintSeeds.join(","));
      if (filters.phases?.length) params.set("phases", filters.phases.join(","));
      if (filters.floatMin !== undefined) params.set("floatMin", String(filters.floatMin));
      if (filters.floatMax !== undefined) params.set("floatMax", String(filters.floatMax));
      params.set("sort", sort);

      const res = await fetch(`/api/market?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? MOCK_ITEMS);
      }
    } catch {
      // keep showing mock data on error
    } finally {
      setLoading(false);
    }
  }, [sort]);

  function toggleWear(w: string) {
    setSelectedWears((p) => p.includes(w) ? p.filter((x) => x !== w) : [...p, w]);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Market</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {items.length.toLocaleString()} listings · pip precision pricing · sub-cent trades
        </p>
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
                placeholder="Min $"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[var(--border-focus)]"
                style={{ color: "var(--text-primary)" }}
              />
              <input
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
