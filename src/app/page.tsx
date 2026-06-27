import Link from "next/link";
import { db } from "@/lib/db";
import { demoHomeStats } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [listings, trades] = await Promise.all([
      db.listing.count({ where: { status: "ACTIVE" } }),
      db.trade.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);
    if (listings === 0) return demoHomeStats();
    return [
      { label: "Skins listed", value: listings.toLocaleString() },
      { label: "Trades today", value: trades.toLocaleString() },
      { label: "Min price", value: "$0.00001" },
      { label: "Avg fee", value: "2%" },
    ];
  } catch {
    // No DB connected — show representative demo figures.
    return demoHomeStats();
  }
}

const TRUST = [
  "Escrowed & bot-custody trades",
  "2FA + trade confirmations",
  "No case-opening or gambling",
  "Provable double-entry ledger",
];

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 2L18 6v8l-8 4L2 14V6l8-4z" stroke="var(--accent)" strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="2.5" fill="var(--accent)" fillOpacity="0.3" stroke="var(--accent)" strokeWidth="1"/>
      </svg>
    ),
    title: "Sub-cent pip pricing",
    desc: "Trade at $0.00001 precision. Steam's $0.03 floor is a fee artifact — SkinPip settles internally.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="var(--accent)" strokeWidth="1.5"/>
        <path d="M7 10h6M10 7v6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Full order book",
    desc: "Resting bids, asks, depth chart. Limit and market orders. Maker 1% / taker 2% when live.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="var(--accent)" strokeWidth="1.5"/>
        <path d="M10 6v4l3 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Auctions with anti-snipe",
    desc: "English-style timed auctions. Proxy bidding, live updates, auto-extend on late bids.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M2 14l4-4 3 3 5-6 4 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Phase & pattern search",
    desc: "Filter Gamma Doppler Emerald, Doppler Ruby/Sapphire, blue gems. Paste 999+ seeds at once.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5"/>
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5"/>
        <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5"/>
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="var(--accent)" strokeWidth="1.5" opacity="0.25"/>
      </svg>
    ),
    title: "Trends dashboard",
    desc: "Track skin price history, volume, MAs. Watchlists, market indices, portfolio P/L.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="var(--accent)" strokeWidth="1.5"/>
        <path d="M10 6v2.5l2 1.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 13.5c.8.8 1.8 1.3 3 1.3s2.2-.5 3-1.3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Crypto & Stripe cashout",
    desc: "Deposit and withdraw via card (Stripe) or crypto. Wallet balance in pips, cash out anytime.",
  },
];

export default async function Home() {
  const STATS = await getStats();
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 space-y-16">
      <section className="text-center space-y-6 py-8">
        <div
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-xs"
          style={{ background: "var(--bg-surface)" }}
        >
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
          <span style={{ color: "var(--text-muted)" }}>US marketplace · pip precision · sub-cent pricing</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Trade CS2 skins below<br />
          <span style={{ color: "var(--accent)" }}>Steam&apos;s $0.03 floor</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          SkinPip settles all internal trades on a pip ledger — 1 pip = $0.00001.
          Steam fees only apply when you physically deposit or withdraw a skin.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#06231A" }}
          >
            Browse market
          </Link>
          <Link
            href="/api/auth/steam"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition-colors hover:border-[var(--accent)]"
            style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
          >
            Sign in with Steam
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] p-4 text-center"
            style={{ background: "var(--bg-surface)" }}
          >
            <p className="font-mono text-2xl font-semibold" style={{ color: "var(--accent)" }}>{s.value}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {TRUST.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1.5 2 3.5v3c0 3 2.1 4.8 5 6 2.9-1.2 5-3 5-6v-3L7 1.5Z" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M5 7l1.4 1.4L9 5.5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t}
          </span>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Why SkinPip
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5 space-y-3"
              style={{ background: "var(--bg-surface)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
                style={{ background: "var(--accent-dim)" }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-[var(--radius-lg)] border border-[var(--border)] p-8 text-center"
        style={{ background: "var(--bg-surface)" }}
      >
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Ready to trade?</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Connect your Steam account and start buying or listing skins at true market value.
        </p>
        <Link
          href="/api/auth/steam"
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-2.5 text-sm font-medium"
          style={{ background: "var(--accent)", color: "#06231A" }}
        >
          Get started with Steam
        </Link>
      </section>
    </div>
  );
}
