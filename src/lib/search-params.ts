// Shared search filter type used by market, buy orders, and auctions

export interface SkinSearchFilters {
  weapon?: string;
  skinName?: string;
  wearName?: string;
  floatMin?: number;
  floatMax?: number;
  paintSeeds?: number[];   // unlimited — no cap
  phases?: string[];
  fadePercentMin?: number;
  fadePercentMax?: number;
  patternTiers?: string[];
  rarity?: string;
  collection?: string;
  isStatTrak?: boolean;
  isSouvenir?: boolean;
  stickers?: StickerFilter[];
  charms?: CharmFilter[];
  pricePipsMin?: bigint;
  pricePipsMax?: bigint;
  hasNameTag?: boolean;
}

export interface StickerFilter {
  name?: string;
  slot?: number;
  wearMin?: number;
  wearMax?: number;
}

export interface CharmFilter {
  name?: string;
  patternId?: number;
}

export function parseSeeds(input: string): number[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 1000);
}
