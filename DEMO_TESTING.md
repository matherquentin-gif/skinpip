# Testing SkinPip without live data

There are two ways to run the app with realistic data. Neither needs a Steam
inventory or live prices.

## 1. Zero-setup demo mode (no database)

Every data-driven page falls back to a **deterministic demo dataset** when the
database is empty or unreachable. Just run the dev server:

```bash
npm install      # first time (adds tsx for the seed script)
npm run dev
```

Then open the app:

- **/market**: grid of demo skins (incl. genuinely sub-cent items), with
  net-of-fee pricing and a liquidity badge. A "Demo data" pill appears when the
  API is serving the fallback.
- **/market/[id]**: per-item page with a working candlestick/line chart, a
  populated order book, recent sales, and the spread/net-of-fee display.
- **/trends**: market-cap dashboard (total cap, 24h volume, composition),
  category indices with a chart, and top gainers/losers. Toggle 24h / 7d / 30d.
- **/auctions**, **/buy-orders**: populated from the same demo source.
- **/**: stat tiles show representative demo figures.

The dataset is defined once in **`src/lib/demo-data.ts`** using a seeded PRNG, so
the numbers are stable across reloads and identical on server and client (no
hydration mismatch). Charts, order books, and indices are all generated there.

## 2. Seeded database (tests the real market + ledger paths)

To exercise the actual Prisma queries, order book, double-entry ledger, and
auctions against Postgres, seed a database with the **same** demo catalog:

```bash
# 1. Point DATABASE_URL at a dev Postgres (Neon works) in .env.local
# 2. Create the schema (no migrations exist yet):
npm run db:push

# 3. Seed demo users, wallets, markets, items, listings, orders,
#    trades, 90 days of price candles, and auctions:
npm run seed
```

Helpful combo (resets schema + reseeds in one step):

```bash
npm run db:reset
```

Once seeded, the pages automatically switch from the demo fallback to live DB
data (the "Demo data" pill disappears and `/api/market` reports `source: "db"`).

### What the seed creates

- 4 demo users (`DEMO_*`) with funded pip wallets + a ledger deposit entry
- 1 custody bot
- ~18 markets across knives, gloves, rifles, AWPs, pistols, cases, stickers
- ~60 items (3 variants per market) and active listings
- A resting **order book** (bids + asks) per market
- Historical **trades** with 2% seller fees
- **90 days** of daily OHLC `PriceCandle`s + recent `PriceTick`s per market
- 3 live **auctions** with climbing bids

### Safety

`npm run seed` refuses to run in production unless `SEED_DEMO=1`. It clears the
marketplace tables and `DEMO_*` users, then rebuilds. It does **not** touch the
`PhaseMap` / `PatternTier` reference data. Use a dev database.

## Notes

- `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` all pass clean.
- Item pages (`/market/[id]`) accept both demo catalog keys and database ids,
  so the market grid links to the right item in either mode.
