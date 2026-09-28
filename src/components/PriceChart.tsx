"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import type { IChartApi, Time } from "lightweight-charts";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Range = "7d" | "30d" | "90d" | "1y" | "all";

interface PriceChartProps {
  data: CandleData[];
  className?: string;
  /** Initially selected range. */
  defaultRange?: Range;
}

const RANGES: { value: Range; label: string; days: number | null }[] = [
  { value: "7d", label: "7d", days: 7 },
  { value: "30d", label: "30d", days: 30 },
  { value: "90d", label: "90d", days: 90 },
  { value: "1y", label: "1y", days: 365 },
  { value: "all", label: "All", days: null },
];

const CHART_HEIGHT = 200;

/** Enough decimals that sub-cent prices don't all render as "0.00". */
function priceFormatFor(maxPrice: number) {
  if (maxPrice < 0.01) return { type: "price" as const, precision: 5, minMove: 0.00001 };
  if (maxPrice < 1) return { type: "price" as const, precision: 4, minMove: 0.0001 };
  return { type: "price" as const, precision: 2, minMove: 0.01 };
}

/** Read theme tokens so the canvas matches the active (dark or light) theme. */
function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    text: v("--text-muted", "#8AA399"),
    border: v("--border", "#22302B"),
    surface: v("--bg-surface", "#141E1A"),
    accent: v("--accent", "#25E59A"),
    gain: v("--gain", "#25E59A"),
    loss: v("--loss", "#FF5C61"),
    // Canvas can't resolve CSS variables, so pass the resolved font stack.
    font: v("--font-geist-mono", "ui-monospace, monospace"),
  };
}

export function PriceChart({ data, className, defaultRange = "30d" }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<Range>(defaultRange);
  const [chartType, setChartType] = useState<"line" | "candle">("line");

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)?.days;
    if (!days || data.length === 0) return data;
    const cutoff = data[data.length - 1].time - days * 86_400;
    return data.filter((d) => d.time > cutoff);
  }, [data, range]);

  useEffect(() => {
    // The chart library loads asynchronously. If this effect is cleaned up
    // before it finishes (fast re-render, React Strict Mode), `disposed` stops
    // the late init from mounting an orphaned second chart.
    let disposed = false;
    let chart: IChartApi | null = null;

    async function init() {
      const el = containerRef.current;
      if (!el || !visible.length) return;

      const { createChart, ColorType, LineStyle, LineSeries, CandlestickSeries, HistogramSeries } =
        await import("lightweight-charts");
      if (disposed) return;

      const c = themeColors();
      const priceFormat = priceFormatFor(Math.max(...visible.map((d) => d.high)));

      chart = createChart(el, {
        autoSize: true,
        height: CHART_HEIGHT,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: c.text,
          fontFamily: c.font,
          fontSize: 11,
        },
        grid: {
          vertLines: { color: c.border, style: LineStyle.Dotted },
          horzLines: { color: c.border, style: LineStyle.Dotted },
        },
        crosshair: {
          vertLine: { color: c.accent, labelBackgroundColor: c.surface },
          horzLine: { color: c.accent, labelBackgroundColor: c.surface },
        },
        rightPriceScale: { borderColor: c.border },
        timeScale: { borderColor: c.border, timeVisible: true },
      });

      if (chartType === "line") {
        chart
          .addSeries(LineSeries, { color: c.accent, lineWidth: 2, priceLineVisible: false, priceFormat })
          .setData(visible.map((d) => ({ time: d.time as Time, value: d.close })));
      } else {
        chart
          .addSeries(CandlestickSeries, {
            upColor: c.gain,
            downColor: c.loss,
            borderUpColor: c.gain,
            borderDownColor: c.loss,
            wickUpColor: c.gain,
            wickDownColor: c.loss,
            priceFormat,
          })
          .setData(
            visible.map((d) => ({ time: d.time as Time, open: d.open, high: d.high, low: d.low, close: d.close })),
          );
      }

      chart
        .addSeries(HistogramSeries, { color: "#1E5A45", priceFormat: { type: "volume" }, priceScaleId: "vol" })
        .setData(
          visible.map((d) => ({ time: d.time as Time, value: d.volume, color: d.close >= d.open ? "#1E5A45" : "#3A1A1A" })),
        );
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      chart.timeScale().fitContent();
    }

    init().catch((err) => console.error("[PriceChart] failed to render:", err));
    return () => {
      disposed = true;
      chart?.remove();
    };
  }, [visible, chartType]);

  const toggle = (active: boolean) =>
    clsx(
      "rounded px-2 py-0.5 text-[10px] transition-colors",
      active ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-hint)] hover:text-[var(--text-muted)]",
    );

  return (
    <div
      className={clsx("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]", className)}
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <polyline points="1,10 4,6 7,8 10,3 13,5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Price history &amp; volume
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div role="group" aria-label="Chart type" className="flex items-center gap-1.5">
            {(["line", "candle"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={chartType === t} onClick={() => setChartType(t)} className={toggle(chartType === t)}>
                {t}
              </button>
            ))}
          </div>
          <span className="mx-1 h-3 w-px" style={{ background: "var(--border)" }} aria-hidden />
          <div role="group" aria-label="Time range" className="flex items-center gap-1.5">
            {RANGES.map((r) => (
              <button key={r.value} type="button" aria-pressed={range === r.value} onClick={() => setRange(r.value)} className={toggle(range === r.value)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length ? (
        <div ref={containerRef} role="img" aria-label="Price history chart" className="h-[200px] w-full" />
      ) : (
        <div className="flex h-[200px] items-center justify-center text-xs text-[var(--text-hint)]">
          No price history yet
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--text-hint)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-4" style={{ background: "var(--accent)" }} />
          price
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#1E5A45" }} />
          volume
        </span>
      </div>
    </div>
  );
}
