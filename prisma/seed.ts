/**
 * SkinPip demo seed.
 *
 * Populates a Postgres database with deterministic fake data so the whole app
 * (market, charts, order book, trends, auctions, ledger) can be tested without
 * live Steam inventory or live prices.
 *
 * Safe by design:
 *   - Refuses to run in production unless SEED_DEMO=1 is set.
 *   - Clears marketplace tables and DEMO_* users, then rebuilds. It does NOT
 *     touch PhaseMap / PatternTier reference data or non-demo user rows beyond
 *     the marketplace records it owns.
 *
 * Usage:
 *   npm run seed            # uses DATABASE_URL from .env.local / .env
 *
 * Source of truth for the data is src/lib/demo-data.ts (shared with the UI's
 * offline fallback), so a seeded DB and the no-DB demo look identical.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  CATALOG,
  demoCandlesForKey,
  demoOrderBook,
  demoAuctions,
  type CatalogEntry,
} from "../src/lib/demo-data";

const PIPS_PER_DOLLAR = 100_000;
const dollarsToPips = (d: number) => BigInt(Math.round(d * PIPS_PER_DOLLAR));
const FEE_BPS = 200;
const feeOf = (p: bigint) => (p * BigInt(FEE_BPS)) / 10_000n;

if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO !== "1") {
  console.error("Refusing to seed in production without SEED_DEMO=1. Aborting.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local before seeding.");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const DEMO_USERS = [
  { steamId: "DEMO_alice", displayName: "alice_blue_gems", balance: 50_000 },
  { steamId: "DEMO_bob", displayName: "bob.trades", balance: 25_000 },
  { steamId: "DEMO_cara", displayName: "caratrades", balance: 12_500 },
  { steamId: "DEMO_dave", displayName: "phase_hunter", balance: 80_000 },
];

async function clearDemo() {
  console.log("Clearing marketplace + DEMO_* data…");
  // Children first to satisfy FK constraints.
  await db.bid.deleteMany({});
  await db.auction.deleteMany({});
  await db.trade.deleteMany({});
  await db.order.deleteMany({});
  await db.listing.deleteMany({});
  await db.priceCandle.deleteMany({});
  await db.priceTick.deleteMany({});
  await db.item.deleteMany({});
  await db.marketDefinition.deleteMany({});
  await db.ledgerEntry.deleteMany({});
  await db.walletAccount.deleteMany({});
  await db.tradeOfferJob.deleteMany({});
  await db.botAccount.deleteMany({});
  await db.user.deleteMany({ where: { steamId: { startsWith: "DEMO_" } } });
}

async function main() {
  console.log("Seeding SkinPip demo data…");
  await clearDemo();

  // ── Users + funded wallets (with a ledger deposit entry) ──
  const users = [];
  for (const u of DEMO_USERS) {
    const user = await db.user.create({
      data: {
        steamId: u.steamId,
        displayName: u.displayName,
        tradeUrl: `https://steamcommunity.com/tradeoffer/new/?partner=${u.steamId}`,
        kycTier: "EMAIL",
      },
    });
    const balancePips = dollarsToPips(u.balance);
    const wallet = await db.walletAccount.create({
      data: { userId: user.id, balancePips, reservedPips: 0n },
    });
    await db.ledgerEntry.create({
      data: {
        walletAccountId: wallet.id,
        amountPips: balancePips,
        balanceAfterPips: balancePips,
        type: "FIAT_DEPOSIT",
        referenceType: "SEED",
      },
    });
    users.push(user);
  }
  console.log(`  ${users.length} users + wallets`);

  // ── Custody bot ──
  const bot = await db.botAccount.create({
    data: {
      steamId: "DEMO_BOT_1",
      username: "skinpip-bot-01",
      sharedSecret: "demo-shared-secret",
      identitySecret: "demo-identity-secret",
      isActive: true,
    },
  });

  let itemCount = 0;
  let listingCount = 0;
  let orderCount = 0;
  let tradeCount = 0;
  let candleCount = 0;

  // ── Markets, items, listings, order book, charts, trades ──
  for (let mi = 0; mi < CATALOG.length; mi++) {
    const c: CatalogEntry = CATALOG[mi];

    const market = await db.marketDefinition.create({
      data: {
        skinName: c.skinName,
        weaponName: c.weaponName,
        wearName: c.wearName,
        paintIndex: c.paintIndex,
        isActive: true,
      },
    });

    // Create a few items at varied floats/prices for this market.
    const variants = 3;
    const marketItems = [];
    for (let v = 0; v < variants; v++) {
      const owner = users[(mi + v) % users.length];
      const wearJitter = c.paintWear != null ? c.paintWear * (1 + (v - 1) * 0.15) : null;
      const priceJitter = c.basePips + (c.basePips * BigInt((v - 1) * 3)) / 100n;
      const item = await db.item.create({
        data: {
          assetId: `DEMO-${c.key}-${v}`,
          ownerId: owner.id,
          botAccountId: bot.id,
          defIndex: 1000 + mi,
          paintIndex: c.paintIndex,
          paintSeed: c.paintSeed != null ? c.paintSeed + v : null,
          paintWear: wearJitter,
          phaseLabel: c.phaseLabel,
          patternTierLabel: c.patternTierLabel,
          isStatTrak: c.isStatTrak,
          isSouvenir: c.isSouvenir,
          skinName: c.skinName,
          weaponName: c.weaponName,
          wearName: c.wearName,
          rarity: c.rarity,
          collection: c.collection,
          stickers: (c.stickers ?? []) as unknown as Prisma.InputJsonValue,
          settlementType: "BOT_CUSTODY",
          isListed: v === 0,
        },
      });
      itemCount++;
      marketItems.push({ item, pricePips: priceJitter < 1n ? 1n : priceJitter });

      // List the first variant of each market.
      if (v === 0) {
        await db.listing.create({
          data: {
            sellerId: owner.id,
            itemId: item.id,
            marketId: market.id,
            pricePips: c.basePips,
            status: "ACTIVE",
          },
        });
        listingCount++;
      }
    }

    // Order book — resting bids/asks from demo users.
    const ob = demoOrderBook(c.basePips, c.key);
    for (let i = 0; i < ob.asks.length; i++) {
      await db.order.create({
        data: {
          userId: users[(mi + i) % users.length].id,
          marketId: market.id,
          side: "ASK",
          pricePips: ob.asks[i].pricePips,
          quantity: ob.asks[i].quantity,
          status: "OPEN",
        },
      });
      orderCount++;
    }
    for (let i = 0; i < ob.bids.length; i++) {
      await db.order.create({
        data: {
          userId: users[(mi + i + 1) % users.length].id,
          marketId: market.id,
          side: "BID",
          pricePips: ob.bids[i].pricePips,
          quantity: ob.bids[i].quantity,
          status: "OPEN",
        },
      });
      orderCount++;
    }

    // Price history → candles + ticks.
    const candles = demoCandlesForKey(c.key, 90);
    for (const cd of candles) {
      await db.priceCandle.create({
        data: {
          marketId: market.id,
          interval: "1d",
          openPips: dollarsToPips(cd.open),
          highPips: dollarsToPips(cd.high),
          lowPips: dollarsToPips(cd.low),
          closePips: dollarsToPips(cd.close),
          volume: cd.volume,
          timestamp: new Date(cd.time * 1000),
        },
      });
      candleCount++;
    }
    // A handful of recent ticks from the last candles.
    for (const cd of candles.slice(-8)) {
      await db.priceTick.create({
        data: {
          marketId: market.id,
          pricePips: dollarsToPips(cd.close),
          volume: cd.volume,
          createdAt: new Date(cd.time * 1000),
        },
      });
    }

    // A few historical trades on the busier markets.
    if (mi % 2 === 0) {
      for (let t = 0; t < 3; t++) {
        const seller = users[(mi + t) % users.length];
        const buyer = users[(mi + t + 2) % users.length];
        const tradeItem = marketItems[t % marketItems.length].item;
        const price = c.basePips - (c.basePips * BigInt(t)) / 100n;
        await db.trade.create({
          data: {
            sellerId: seller.id,
            buyerId: buyer.id,
            itemId: tradeItem.id,
            pricePips: price,
            sellerFeePips: feeOf(price),
            buyerFeePips: 0n,
            createdAt: new Date(Date.now() - (t + 1) * 36 * 3600_000),
          },
        });
        tradeCount++;
      }
    }
  }

  // ── Auctions + bids ──
  const auctions = demoAuctions();
  let auctionCount = 0;
  for (let ai = 0; ai < auctions.length; ai++) {
    const a = auctions[ai];
    const seller = users[ai % users.length];
    const item = await db.item.create({
      data: {
        assetId: `DEMO-AUCTION-${a.id}`,
        ownerId: seller.id,
        botAccountId: bot.id,
        defIndex: 9000 + ai,
        paintWear: a.float,
        phaseLabel: a.phase,
        isStatTrak: a.isStatTrak,
        skinName: a.skinName,
        weaponName: a.weapon,
        wearName: a.wear === "FN" ? "Factory New" : a.wear,
        settlementType: "BOT_CUSTODY",
        isListed: true,
      },
    });
    itemCount++;
    const auction = await db.auction.create({
      data: {
        sellerId: seller.id,
        itemId: item.id,
        startPricePips: a.startPricePips,
        buyNowPips: a.buyNowPips,
        currentBidPips: a.currentBidPips,
        status: "ACTIVE",
        endsAt: new Date(Date.now() + a.endsInMs),
      },
    });
    auctionCount++;
    // A couple of bids climbing to the current bid.
    for (let b = 0; b < Math.min(3, a.bidCount); b++) {
      const bidder = users[(ai + b + 1) % users.length];
      const amount = a.startPricePips + ((a.currentBidPips - a.startPricePips) * BigInt(b + 1)) / 3n;
      await db.bid.create({
        data: { auctionId: auction.id, bidderId: bidder.id, amountPips: amount },
      });
    }
  }

  console.log(
    `  ${CATALOG.length} markets · ${itemCount} items · ${listingCount} listings · ` +
      `${orderCount} orders · ${tradeCount} trades · ${candleCount} candles · ${auctionCount} auctions`,
  );
  console.log("Demo seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
