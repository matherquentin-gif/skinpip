// paint_index → phase label for Doppler and Gamma Doppler knives

export const PHASE_MAP: Record<number, string> = {
  // Karambit / Bayonet / M9 Bayonet / etc. Doppler
  415: "Phase 1",
  416: "Phase 2",
  417: "Phase 3",
  418: "Phase 4",
  419: "Ruby",
  420: "Sapphire",
  421: "Black Pearl",
  // Gamma Doppler
  568: "Gamma Phase 1",
  569: "Gamma Phase 2",
  570: "Gamma Phase 3",
  571: "Gamma Phase 4",
  572: "Emerald",
};

export const DOPPLER_PHASES = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Ruby", "Sapphire", "Black Pearl"];
export const GAMMA_DOPPLER_PHASES = ["Gamma Phase 1", "Gamma Phase 2", "Gamma Phase 3", "Gamma Phase 4", "Emerald"];
export const ALL_PHASES = [...DOPPLER_PHASES, ...GAMMA_DOPPLER_PHASES];

export function getPhaseLabel(paintIndex: number): string | null {
  return PHASE_MAP[paintIndex] ?? null;
}

export function isDoppler(skinName: string): boolean {
  return skinName.toLowerCase().includes("doppler");
}

export function isGammaDoppler(skinName: string): boolean {
  return skinName.toLowerCase().includes("gamma doppler");
}
