import { db } from "@/lib/db";

const PHASE_MAP: { paintIndex: number; phaseLabel: string }[] = [
  { paintIndex: 415, phaseLabel: "Phase 1" },
  { paintIndex: 416, phaseLabel: "Phase 2" },
  { paintIndex: 417, phaseLabel: "Phase 3" },
  { paintIndex: 418, phaseLabel: "Phase 4" },
  { paintIndex: 419, phaseLabel: "Ruby" },
  { paintIndex: 420, phaseLabel: "Sapphire" },
  { paintIndex: 421, phaseLabel: "Black Pearl" },
  { paintIndex: 569, phaseLabel: "Gamma Phase 1" },
  { paintIndex: 570, phaseLabel: "Gamma Phase 2" },
  { paintIndex: 571, phaseLabel: "Gamma Phase 3" },
  { paintIndex: 572, phaseLabel: "Gamma Phase 4" },
  { paintIndex: 568, phaseLabel: "Emerald" },
];

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
