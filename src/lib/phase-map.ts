// paint_index → phase label for Doppler and Gamma Doppler finishes.
//
// Verified against the ByMykel/CSGO-API skins dataset. Several finishes have
// more than one paint index because Valve re-issued them for newer knives
// (617–619, 852–855) and for the Glock-18 Gamma Doppler (1119–1123).

export const PHASE_MAP: Record<number, string> = {
  // Doppler
  415: "Ruby",
  416: "Sapphire",
  417: "Black Pearl",
  418: "Phase 1",
  419: "Phase 2",
  420: "Phase 3",
  421: "Phase 4",
  617: "Black Pearl",
  618: "Phase 2",
  619: "Sapphire",
  852: "Phase 1",
  853: "Phase 2",
  854: "Phase 3",
  855: "Phase 4",
  // Gamma Doppler
  568: "Emerald",
  569: "Gamma Phase 1",
  570: "Gamma Phase 2",
  571: "Gamma Phase 3",
  572: "Gamma Phase 4",
  1119: "Emerald",
  1120: "Gamma Phase 1",
  1121: "Gamma Phase 2",
  1122: "Gamma Phase 3",
  1123: "Gamma Phase 4",
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
