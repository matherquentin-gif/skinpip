import { db } from "@/lib/db";

interface PatternEntry {
  skinName: string;
  paintSeed: number;
  tierLabel: string;
  isBlueGem: boolean;
}

// AK-47 Case Hardened — "Case Blue" seeds (highest tier — must be upserted last
// so they overwrite any earlier "Blue Gem" entry for the same seed).
const AK47_CASE_BLUE_SEEDS = new Set([955, 760, 670, 387]);

// All AK-47 Case Hardened blue gem seeds (superset of Case Blue).
const AK47_BLUE_GEM_SEEDS = [
  661, 670, 387, 321, 955, 180, 592, 225, 998, 760,
];

// AK-47 Case Hardened cobalt seeds.
const AK47_COBALT_SEEDS = [
  4, 5, 8, 9, 10, 23, 24, 46, 61, 63, 64, 70, 84, 121, 122, 135, 141, 142,
  143, 173, 178, 218, 221, 224, 266, 282, 336, 342, 344, 415, 506, 511, 525,
  536, 557, 576, 614, 619, 634, 642, 657, 689, 700, 717, 724, 729, 803, 855,
  889, 907, 948, 963, 984, 988, 992, 993,
];

function buildEntries(): PatternEntry[] {
  const entries: PatternEntry[] = [];

  // --- AK-47 Case Hardened: Cobalt (lowest tier; seeded first so Blue Gem
  //     and Case Blue can overwrite any overlap via upsert ordering) ---
  for (const seed of AK47_COBALT_SEEDS) {
    entries.push({
      skinName: "AK-47 Case Hardened",
      paintSeed: seed,
      tierLabel: "Cobalt",
      isBlueGem: false,
    });
  }

  // --- AK-47 Case Hardened: Blue Gem ---
  for (const seed of AK47_BLUE_GEM_SEEDS) {
    if (!AK47_CASE_BLUE_SEEDS.has(seed)) {
      entries.push({
        skinName: "AK-47 Case Hardened",
        paintSeed: seed,
        tierLabel: "Blue Gem",
        isBlueGem: true,
      });
    }
  }

  // --- AK-47 Case Hardened: Case Blue (overwrites Blue Gem for same seeds) ---
  for (const seed of AK47_CASE_BLUE_SEEDS) {
    entries.push({
      skinName: "AK-47 Case Hardened",
      paintSeed: seed,
      tierLabel: "Case Blue",
      isBlueGem: true,
    });
  }

  // --- Karambit Fade ---
  for (let seed = 1; seed <= 50; seed++) {
    entries.push({
      skinName: "Karambit Fade",
      paintSeed: seed,
      tierLabel: "5 Star Fade",
      isBlueGem: false,
    });
  }
  for (let seed = 51; seed <= 100; seed++) {
    entries.push({
      skinName: "Karambit Fade",
      paintSeed: seed,
      tierLabel: "4.5 Star Fade",
      isBlueGem: false,
    });
  }
  for (let seed = 101; seed <= 200; seed++) {
    entries.push({
      skinName: "Karambit Fade",
      paintSeed: seed,
      tierLabel: "4 Star Fade",
      isBlueGem: false,
    });
  }

  // --- M9 Bayonet Fade ---
  for (let seed = 1; seed <= 40; seed++) {
    entries.push({
      skinName: "M9 Bayonet Fade",
      paintSeed: seed,
      tierLabel: "5 Star Fade",
      isBlueGem: false,
    });
  }
  for (let seed = 41; seed <= 100; seed++) {
    entries.push({
      skinName: "M9 Bayonet Fade",
      paintSeed: seed,
      tierLabel: "4.5 Star Fade",
      isBlueGem: false,
    });
  }

  return entries;
}

async function main(): Promise<void> {
  const entries = buildEntries();
  console.log(`Seeding ${entries.length} PatternTier entries...`);

  // Process sequentially so later entries (Case Blue) correctly overwrite
  // earlier ones (Blue Gem) for the same (skinName, paintSeed) composite key.
  for (const entry of entries) {
    await db.patternTier.upsert({
      where: {
        skinName_paintSeed: {
          skinName: entry.skinName,
          paintSeed: entry.paintSeed,
        },
      },
      update: {
        tierLabel: entry.tierLabel,
        isBlueGem: entry.isBlueGem,
      },
      create: {
        skinName: entry.skinName,
        paintSeed: entry.paintSeed,
        tierLabel: entry.tierLabel,
        isBlueGem: entry.isBlueGem,
      },
    });
  }

  const count = await db.patternTier.count();
  console.log(`Done. PatternTier now has ${count} entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
