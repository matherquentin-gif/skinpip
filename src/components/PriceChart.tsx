"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type Range = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

interface PriceChartProps {
  data: CandleData[];
  className?: string;
  onRangeChange?: (range: Range) => void;
}

const RANGES: Range[] = ["24h", "7d", "30d", "90d", "1y", "all"];

export function PriceChart({ data, className, onRangeChange }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const [activeRange, setActiveRange] = useState<Range>("30d");
  const [chartType, setChartType] = useState<"line" | "candle">("line");

  useEffect(() => {
    let chart: unknown = null;
    let cleanup = () => {};

    async function init() {
      if (!containerRef.current || !data.length) return;

      const { createChart, ColorType, LineStyle } = await import("lightweight-charts");

      chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#8AA399",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#22302B", style: LineStyle.Dotted },
          horzLines: { color: "#22302B", style: LineStyle.Dotted },
        },
        crosshair: {
          vertLine: { color: "#25E59A", labelBackgroundColor: "#141E1A" },
          horzLine: { color: "#25E59A", labelBackgroundColor: "#141E1A" },
        },
        rightPriceScale: {
          borderColor: "#22302B",
        },
        timeScale: {
          borderColor: "#22302B",
          timeVisible: true,
        },
        width: containerRef.current.clientWidth,
        height: 200,
      });

      const c = chart as {
        addLineSeries: (opts: unknown) => { setData: (d: unknown) => void };
        addHistogramSeries: (opts: unknown) => { setData: (d: unknown) => void };
        addCandlestickSeries: (opts: unknown) => { setData: (d: unknown) => void };
        timeScale: () => { fitContent: () => void };
        resize: (w: number, h: number) => void;
        remove: () => void;
      };

      if (chartType === "line") {
        const lineSeries = c.addLineSeries({
          color: "#25E59A",
          lineWidth: 2,
          priceLineVisible: false,
        });
        lineSeries.setData(data.map((d) => ({ time: d.time, value: d.close })));
      } else {
        const candleSeries = c.addCandlestickSeries({
          upColor: "#25E59A",
          downColor: "#FF5C61",
          borderUpColor: "#25E59A",
          borderDownColor: "#FF5C61",
          wickUpColor: "#25E59A",
          wickDownColor: "#FF5C61",
        });
        candleSeries.setData(data.map((d) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })));
      }

      const volSeries = c.addHistogramSeries({
        color: "#1E5A45",
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volSeries.setData(data.map((d) => ({ time: d.time, value: d.volume, color: d.close >= d.open ? "#1E5A45" : "#3A1A1A" })));

      c.timeScale().fitContent();

      const observer = new ResizeObserver(() => {
        if (containerRef.current) {
          c.resize(containerRef.current.clientWidth, 200);
        }
      });
      if (containerRef.current) observer.observe(containerRef.current);

      cleanup = () => {
        observer.disconnect();
        c.remove();
      };
    }

    init();
    return () => cleanup();
  }, [data, chartType]);

  function handleRange(r: Range) {
    setActiveRange(r);
    onRangeChange?.(r);
  }

  return (
    <div
      className={clsx("overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]", className)}
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <polyline points="1,10 4,6 7,8 10,3 13,5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Price history &amp; volume
        </div>
        <div className="flex items-center gap-1.5">
          {(["line", "candle"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={clsx(
                "rounded px-2 py-0.5 text-[10px] transition-colors",
                chartType === t
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-[var(--text-hint)] hover:text-[var(--text-muted)]",
              )}
            >
              {t}
            </button>
          ))}
          <span className="mx-1 h-3 w-px" style={{ background: "var(--border)" }} />
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={clsx(
                "rounded px-2 py-0.5 text-[10px] transition-colors",
                activeRange === r
                  ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                  : "text-[var(--text-hint)] hover:text-[var(--text-muted)]",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="h-[200px] w-full" />

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
