import { Challenge } from "./types";

// ============================================
// DAILY BATTLE REGISTRY (Independent from Tracks/Arcs)
// ============================================

export interface DailyChallengeMeta {
  id: string;
  order: number;
}

type DailyChallengeLoader = () => Promise<{ default: Challenge } | Challenge>;

interface DailyChallengeEntry {
  id: string;
  order: number;
  loader: DailyChallengeLoader;
}

// NOTE: This registry is intentionally separate from the track/arc battle
// registry so daily battles can evolve independently.
const dailyBattleRegistry: DailyChallengeEntry[] = [
  {
    id: "daily-broken-counter",
    order: 1,
    loader: () =>
      import("./daily/daily-broken-counter").then((m) => m.dailyBrokenCounter),
  },
  {
    id: "daily-list-rendering-mismatch",
    order: 2,
    loader: () =>
      import("./daily/daily-list-rendering").then((m) => m.dailyListRendering),
  },
  {
    id: "daily-button-disabled-incorrectly",
    order: 3,
    loader: () =>
      import("./daily/daily-button-disabled").then(
        (m) => m.dailyButtonDisabled
      ),
  },
  {
    id: "daily-shopping-cart-bug",
    order: 4,
    loader: () =>
      import("./daily/daily-shopping-cart").then((m) => m.dailyShoppingCart),
  },
];

const dailyBattleCache = new Map<string, Challenge>();

/**
 * Get lightweight metadata for all daily challenges
 */
export function getAllDailyChallengesMeta(): DailyChallengeMeta[] {
  return dailyBattleRegistry.map(({ id, order }) => ({ id, order }));
}

/**
 * Load a specific daily challenge by ID
 */
export async function getDailyChallenge(id: string): Promise<Challenge | null> {
  if (dailyBattleCache.has(id)) {
    return dailyBattleCache.get(id)!;
  }

  const entry = dailyBattleRegistry.find((c) => c.id === id);
  if (!entry) return null;

  const challenge = await entry.loader();
  const resolved = 'default' in challenge ? challenge.default : challenge;
  dailyBattleCache.set(id, resolved);
  return resolved;
}

/**
 * Load all daily challenges (sorted by order)
 */
export async function getAllDailyChallenges(): Promise<Challenge[]> {
  const challenges = await Promise.all(
    dailyBattleRegistry.map(async (entry) => {
      if (dailyBattleCache.has(entry.id)) {
        return dailyBattleCache.get(entry.id)!;
      }
      const challenge = await entry.loader();
      const resolved = 'default' in challenge ? challenge.default : challenge;
      dailyBattleCache.set(entry.id, resolved);
      return resolved;
    })
  );

  return challenges.sort((a, b) => a.order - b.order);
}
