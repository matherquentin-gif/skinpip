# SkinPip

A CS2 skin marketplace with sub-cent "pip" pricing (1 pip = $0.00001). Trades
settle on an internal double-entry ledger, so prices aren't bound by Steam's
$0.03 floor.

Built with Next.js 16 (App Router), React 19, Prisma 7 on Postgres (Neon),
Tailwind CSS 4, and Steam OpenID for sign-in.

## Quick start (no database)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no database configured, every page falls back
to a deterministic demo dataset (see [DEMO_TESTING.md](DEMO_TESTING.md)).

## With a database

1. `cp .env.example .env.local` and fill in the values.
2. `npm run db:push` to create the schema (there are no migrations yet).
3. `npm run seed` to load demo users, markets, listings, order books, price
   history and auctions.

`npm run db:reset` does both steps 2 and 3 from scratch.

## Scripts

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Generate the Prisma client and build           |
| `npm run typecheck` | `tsc --noEmit`                                 |
| `npm run lint`      | ESLint                                         |
| `npm test`          | Unit tests (Node test runner via `tsx`)        |
| `npm run seed`      | Seed demo data (refuses production unless `SEED_DEMO=1`) |

## Project layout

- `src/app` pages and API routes (`/api/market`, `/api/listings`,
  `/api/buy-orders`, `/api/auctions/[id]/bid`, `/api/wallet/*`,
  `/api/auth/*`, `/api/webhooks/stripe`)
- `src/lib/ledger.ts` wallet ledger (row-locked balance and reservation updates)
- `src/lib/pips.ts` exact bigint money formatting and parsing
- `src/lib/demo-data.ts` the demo dataset shared by the UI fallback and the seed
- `prisma/schema.prisma` data model

## Security notes

- Never commit credentials. `.env*` files are git-ignored except
  `.env.example`, and this repository is public.
- `NEXT_PUBLIC_APP_URL` must match the site's real origin: the Steam login
  callback rejects assertions whose `return_to` doesn't match it, and a
  one-time state cookie ties each login to the browser that started it. A
  login started on any other host (such as a Vercel preview URL) fails.
