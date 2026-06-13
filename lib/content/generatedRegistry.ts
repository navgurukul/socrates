import { Battle } from "./types";

/**
 * Auto-generated Battle registry entries from scripts/author-challenge.ts.
 * Spread into the main registry in registry.ts. Hand-authored battles stay
 * in registry.ts's battleRegistry; generated ones live here.
 */
export interface GeneratedBattleEntry {
  id: string;
  trackId: string;
  arcId: string;
  order: number;
  loader: () => Promise<Battle>;
}

export const generatedBattles: GeneratedBattleEntry[] = [
    {
    id: "tag-list-direct-mutation",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 7,
    loader: () => import("./challenges/tag-list-direct-mutation").then((m) => m.tagListDirectMutationBattle),
  },
    {
    id: "gallery-filter-logic",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 8,
    loader: () => import("./challenges/gallery-filter-logic").then((m) => m.galleryFilterLogicBattle),
  },
  // GENERATED ENTRIES — appended by scripts/author-challenge.ts
];
