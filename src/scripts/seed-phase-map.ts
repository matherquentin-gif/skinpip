import { db } from "@/lib/db";
import { PHASE_MAP as PHASE_LABELS } from "@/lib/phase-map";

// Single source of truth lives in src/lib/phase-map.ts.
const PHASE_MAP = Object.entries(PHASE_LABELS).map(([paintIndex, phaseLabel]) => ({
  paintIndex: Number(paintIndex),
  phaseLabel,
}));

async function main(): Promise<void> {
  console.log(`Seeding ${PHASE_MAP.length} PhaseMap entries...`);

  await db.$transaction(
    PHASE_MAP.map((entry) =>
      db.phaseMap.upsert({
        where: { paintIndex: entry.paintIndex },
        update: { phaseLabel: entry.phaseLabel },
        create: { paintIndex: entry.paintIndex, phaseLabel: entry.phaseLabel },
      })
    )
  );

  const count = await db.phaseMap.count();
  console.log(`Done. PhaseMap now has ${count} entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void db.$disconnect();
  });
