"use client";
import { useState, useCallback } from "react";
import { clsx } from "clsx";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ALL_PHASES, DOPPLER_PHASES, GAMMA_DOPPLER_PHASES } from "@/lib/phase-map";
import { parseSeeds, type SkinSearchFilters } from "@/lib/search-params";

interface SearchBarProps {
  onSearch: (filters: SkinSearchFilters) => void;
  className?: string;
  showAdvanced?: boolean;
}

export function SearchBar({ onSearch, className, showAdvanced = true }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [floatMin, setFloatMin] = useState("");
  const [floatMax, setFloatMax] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [seeds, setSeeds] = useState<number[]>([]);
  const [phases, setPhases] = useState<string[]>([]);
  const [isStatTrak, setIsStatTrak] = useState<boolean | undefined>();

  const parseAndAddSeeds = useCallback(() => {
    const parsed = parseSeeds(seedInput);
    setSeeds((prev) => Array.from(new Set([...prev, ...parsed])));
    setSeedInput("");
  }, [seedInput]);

  function togglePhase(p: string) {
    setPhases((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function handleSearch() {
    const filters: SkinSearchFilters = {};
    if (query) filters.skinName = query;
    if (floatMin) filters.floatMin = parseFloat(floatMin);
    if (floatMax) filters.floatMax = parseFloat(floatMax);
    if (seeds.length) filters.paintSeeds = seeds;
    if (phases.length) filters.phases = phases;
    if (isStatTrak !== undefined) filters.isStatTrak = isStatTrak;
    onSearch(filters);
  }

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex gap-2">
        <div
          className="flex flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 transition-colors focus-within:border-[var(--border-focus)]"
          style={{ background: "var(--bg-input)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="4.5" stroke="var(--text-hint)" strokeWidth="1.3"/>
            <path d="M9.5 9.5 L12.5 12.5" stroke="var(--text-hint)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search skins, weapons, collections…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-hint)] outline-none"
          />
          {seeds.length > 0 && (
            <Badge variant="accent" className="shrink-0">{seeds.length} seeds</Badge>
          )}
          {phases.length > 0 && (
            <Badge variant="phase" className="shrink-0">{phases.length} phases</Badge>
          )}
        </div>

        {showAdvanced && (
          <Button
            variant="secondary"
            size="md"
            onClick={() => setAdvanced((p) => !p)}
            className={advanced ? "border-[var(--accent)] text-[var(--accent)]" : ""}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Filters
          </Button>
        )}

        <Button variant="primary" size="md" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {advanced && (
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 space-y-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Float range</label>
              <div className="flex items-center gap-2">
                <input
                  value={floatMin}
                  onChange={(e) => setFloatMin(e.target.value)}
                  placeholder="0.000"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-hint)] outline-none focus:border-[var(--border-focus)]"
                />
                <span className="text-[var(--text-hint)] text-xs">–</span>
                <input
                  value={floatMax}
                  onChange={(e) => setFloatMax(e.target.value)}
                  placeholder="1.000"
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-hint)] outline-none focus:border-[var(--border-focus)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">StatTrak</label>
              <div className="flex gap-2">
                {[undefined, true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setIsStatTrak(val)}
                    className={clsx(
                      "rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs transition-colors",
                      isStatTrak === val
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-hint)]",
                    )}
                  >
                    {val === undefined ? "Any" : val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-muted)]">
                Paint seeds — no limit
              </label>
              {seeds.length > 0 && (
                <button
                  onClick={() => setSeeds([])}
                  className="text-[10px] text-[var(--text-hint)] hover:text-[var(--loss)]"
                >
                  Clear all ({seeds.length})
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && parseAndAddSeeds()}
                placeholder="Paste seeds: 4, 231, 999, ... (comma or space separated)"
                className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-hint)] outline-none focus:border-[var(--border-focus)]"
              />
              <Button variant="secondary" size="sm" onClick={parseAndAddSeeds}>
                Add
              </Button>
            </div>
            {seeds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {seeds.slice(0, 20).map((s) => (
                  <span
                    key={s}
                    onClick={() => setSeeds((p) => p.filter((x) => x !== s))}
                    className="cursor-pointer rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent)] hover:bg-[var(--loss)] hover:text-white transition-colors"
                  >
                    #{s}
                  </span>
                ))}
                {seeds.length > 20 && (
                  <span className="rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-hint)]">
                    +{seeds.length - 20} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)]">Phase (Doppler / Gamma Doppler)</label>
            <div>
              <p className="mb-1 text-[10px] text-[var(--text-hint)]">Doppler</p>
              <div className="flex flex-wrap gap-1.5">
                {DOPPLER_PHASES.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePhase(p)}
                    className={clsx(
                      "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
                      phases.includes(p)
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-hint)]",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mb-1 mt-2 text-[10px] text-[var(--text-hint)]">Gamma Doppler</p>
              <div className="flex flex-wrap gap-1.5">
                {GAMMA_DOPPLER_PHASES.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePhase(p)}
                    className={clsx(
                      "rounded-full border px-2.5 py-0.5 text-[10px] transition-colors",
                      phases.includes(p)
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-hint)]",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
