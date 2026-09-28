"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { SkinCard, type SkinCardData } from "@/components/SkinCard";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Input";
import { type SkinSearchFilters } from "@/lib/search-params";
import { parseUsdToPips } from "@/lib/pips";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const SORT_OPTIONS = [
  { value: "price_asc",   label: "Price: low to high" },
  { value: "price_desc",  label: "Price: high to low" },
  { value: "float_asc",   label: "Float: low to high" },
  { value: "float_desc",  label: "Float: high to low" },
  { value: "newest",      label: "Newest" },
];

const WEAR_OPTIONS = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];
const PAGE_SIZE = 40;

interface ApiItem extends Omit<SkinCardData, "pricePips"> {
  pricePips: string;
  liquidity?: number;
}

interface ApiResponse {
  items: ApiItem[];
  total: number;
  page: number;
  pages: number;
  source?: "db" | "demo";
}

interface Results {
  /** The query these results answer; compared with the current one to derive `loading`. */
  query: string;
  items: SkinCardData[];
  total: number;
  page: number;
  pages: number;
  source: "db" | "demo" | null;
  error: boolean;
}

function toCard(it: ApiItem): SkinCardData {
  return { ...it, pricePips: BigInt(it.pricePips) };
}

async function fetchPage(query: string, page: number, signal?: AbortSignal): Promise<ApiResponse> {
  const res = await fetch(`/api/market?${query}&page=${page}&limit=${PAGE_SIZE}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Validate a price box: empty is fine, otherwise it must parse to whole pips. */
function priceField(raw: string): { pips: bigint | null; invalid: boolean } {
  if (raw.trim() === "") return { pips: null, invalid: false };
  const pips = parseUsdToPips(raw);
  return { pips, invalid: pips === null };
}

export default function MarketPage() {
  const [sort, setSort] = useState("price_asc");
  const [selectedWears, setSelectedWears] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filters, setFilters] = useState<SkinSearchFilters>({});
  const [results, setResults] = useState<Results | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Typing in the price boxes shouldn't fire a request per keystroke.
  const debouncedMin = useDebouncedValue(priceMin, 350);
  const debouncedMax = useDebouncedValue(priceMax, 350);
  const minField = priceField(debouncedMin);
  const maxField = priceField(debouncedMax);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.skinName) params.set("q", filters.skinName);
    if (filters.paintSeeds?.length) params.set("seeds", filters.paintSeeds.join(","));
    if (filters.phases?.length) params.set("phases", filters.phases.join(","));
    if (filters.floatMin !== undefined) params.set("floatMin", String(filters.floatMin));
    if (filters.floatMax !== undefined) params.set("floatMax", String(filters.floatMax));
    if (filters.isStatTrak !== undefined) params.set("statTrak", String(filters.isStatTrak));
    if (selectedWears.length) params.set("wears", selectedWears.join(","));
    if (minField.pips !== null) params.set("priceMin", minField.pips.toString());
    if (maxField.pips !== null) params.set("priceMax", maxField.pips.toString());
    params.set("sort", sort);
    return params.toString();
  }, [filters, sort, selectedWears, minField.pips, maxField.pips]);

  useEffect(() => {
    // Abort the previous request so a slow, stale response can never
    // overwrite the results for the filters the user has now.
    const ctrl = new AbortController();
    fetchPage(query, 1, ctrl.signal)
      .then((data) =>
        setResults({
          query,
          items: data.items.map(toCard),
          total: data.total,
          page: data.page,
          pages: data.pages,
          source: data.source ?? null,
          error: false,
        }),
      )
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setResults((prev) => ({
          query,
          items: prev?.items ?? [],
          total: prev?.total ?? 0,
          page: prev?.page ?? 1,
          pages: prev?.pages ?? 1,
          source: prev?.source ?? null,
          error: true,
        }));
      });
    return () => ctrl.abort();
  }, [query]);

  const loading = results?.query !== query;
  const items = results?.items ?? [];
  const canLoadMore = !loading && results != null && results.page < results.pages;

  async function loadMore() {
    if (!results) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(query, results.page + 1);
      setResults((prev) =>
        prev && prev.query === query
          ? { ...prev, items: [...prev.items, ...data.items.map(toCard)], page: data.page, pages: data.pages }
          : prev,
      );
    } catch {
      // Leave the current page in place; the button stays available to retry.
    } finally {
      setLoadingMore(false);
    }
  }

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
            {results ? `${results.total.toLocaleString()} listings` : "Listings"} · pip precision pricing · sub-cent trades
          </p>
        </div>
        {results?.source === "demo" && (
          <span
            className="mt-1 shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(245,166,35,0.08)" }}
            title="No database connected: showing deterministic demo data. Run `npm run seed` for live DB data."
          >
            Demo data
          </span>
        )}
      </div>

      <SearchBar onSearch={handleSearch} className="mb-6" />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="grid shrink-0 grid-cols-2 gap-3 sm:gap-4 lg:block lg:w-52 lg:space-y-5">
          <fieldset className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--border)] p-4" style={{ background: "var(--bg-surface)" }}>
            <legend className="sr-only">Wear</legend>
            <p aria-hidden className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Wear</p>
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
          </fieldset>

          <fieldset className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--border)] p-4" style={{ background: "var(--bg-surface)" }}>
            <legend className="sr-only">Price range (USD)</legend>
            <p aria-hidden className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Price range</p>
            <div className="space-y-1.5">
              <input
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min $"
                aria-label="Minimum price in USD"
                aria-invalid={minField.invalid || undefined}
                inputMode="decimal"
                autoComplete="off"
                className={inputClasses("py-1.5 text-xs font-mono aria-[invalid]:border-[var(--loss)]")}
              />
              <input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max $"
                aria-label="Maximum price in USD"
                aria-invalid={maxField.invalid || undefined}
                inputMode="decimal"
                autoComplete="off"
                className={inputClasses("py-1.5 text-xs font-mono aria-[invalid]:border-[var(--loss)]")}
              />
              {(minField.invalid || maxField.invalid) && (
                <p role="alert" className="text-[10px]" style={{ color: "var(--loss)" }}>
                  Enter a dollar amount with up to 5 decimals.
                </p>
              )}
            </div>
          </fieldset>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
              {loading ? "Loading…" : `${results?.total.toLocaleString() ?? 0} results`}
            </p>
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="sr-only sm:not-sr-only">Sort</span>
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
            </label>
          </div>

          {results?.error && !loading && (
            <p role="alert" className="rounded-[var(--radius-md)] border px-3 py-2 text-xs" style={{ borderColor: "var(--loss)", color: "var(--loss)" }}>
              Couldn&apos;t load listings. Check your connection and try again.
            </p>
          )}

          {results == null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)]"
                  style={{ background: "var(--bg-surface)" }}
                />
              ))}
            </div>
          ) : items.length === 0 && !loading ? (
            <div
              className="rounded-[var(--radius-lg)] border border-[var(--border)] py-16 text-center text-sm"
              style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
            >
              No listings match your filters.
            </div>
          ) : (
            <div
              className="grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
              style={{ opacity: loading ? 0.5 : 1 }}
              aria-busy={loading}
            >
              {items.map((item, i) => (
                <SkinCard key={item.id} item={item} eager={i < 4} />
              ))}
            </div>
          )}

          {canLoadMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                Load more ({(results.total - items.length).toLocaleString()} left)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
