import { Battle, Challenge } from "./types";
import { getArc, getArcsByTrack } from "./arcs";

// Re-export for convenience
export { getTrack, getAllTracks } from "./tracks";
export { getArc, getArcsByTrack, getAllArcs } from "./arcs";

// ============================================
// BATTLE REGISTRY (Formerly Challenge Registry)
// ============================================

type BattleLoader = () => Promise<{ default: Battle } | Battle>;

interface BattleEntry {
  id: string;
  trackId: string;
  arcId: string;
  order: number;
  loader: BattleLoader;
}

/**
 * Battle registry with dynamic imports for code splitting.
 * Each battle belongs to a Track and Arc in the curriculum hierarchy.
 */
const battleRegistry: BattleEntry[] = [
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 1: Debugging Foundations
  // =============================================
  {
    id: "broken-counter",
    trackId: "frontend-debugging",
    arcId: "debugging-foundations",
    order: 1,
    loader: () =>
      import("./challenges/broken-counter").then((m) => m.brokenCounterBattle),
  },
  {
    id: "test-assertion-mismatch",
    trackId: "frontend-debugging",
    arcId: "debugging-foundations",
    order: 2,
    loader: () =>
      import("./challenges/test-assertion-mismatch").then(
        (m) => m.testAssertionMismatchBattle
      ),
  },
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 2: JavaScript Logic & State Bugs
  // =============================================
  {
    id: "button-disabled-incorrectly",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 1,
    loader: () =>
      import("./challenges/button-disabled").then(
        (m) => m.buttonDisabledBattle
      ),
  },
  {
    id: "shopping-cart-bug",
    trackId: "frontend-debugging",
    arcId: "js-logic-and-state",
    order: 2,
    loader: () =>
      import("./challenges/shopping-cart").then((m) => m.shoppingCartBattle),
  },
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 3: React & Component Bugs
  // =============================================
  {
    id: "list-rendering-mismatch",
    trackId: "frontend-debugging",
    arcId: "react-and-components",
    order: 1,
    loader: () =>
      import("./challenges/list-rendering").then((m) => m.listRenderingBattle),
  },
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 4: Async, Network & Side Effects
  // =============================================
  {
    id: "login-spinner-bug",
    trackId: "frontend-debugging",
    arcId: "async-network-and-effects",
    order: 1,
    loader: () =>
      import("./challenges/login-bug").then((m) => m.loginBugBattle),
  },
  {
    id: "stale-search-results",
    trackId: "frontend-debugging",
    arcId: "async-network-and-effects",
    order: 2,
    loader: () =>
      import("./challenges/stale-search").then(
        (m) => m.staleSearchResultsBattle
      ),
  },
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 5: Browser & DOM Debugging
  // (No battles yet - reserved for future content)
  // =============================================

  // =============================================
  // TRACK: Frontend Debugging
  // ARC 6: Performance & Memory Issues
  // =============================================
  {
    id: "slow-render",
    trackId: "frontend-debugging",
    arcId: "performance-and-memory",
    order: 1,
    loader: () =>
      import("./challenges/slow-render").then((m) => m.slowRenderBattle),
  },
  // =============================================
  // TRACK: Frontend Debugging
  // ARC 7: Production-Grade Debugging (Boss Level)
  // (No battles yet - reserved for future content)
  // =============================================
];

// Cache for loaded battles
const battleCache = new Map<string, Battle>();

// ============================================
// HIERARCHICAL HELPER FUNCTIONS
// ============================================

/**
 * Get all battles metadata (lightweight, no file content loaded)
 */
export const getAllBattlesMeta = (): {
  id: string;
  trackId: string;
  arcId: string;
  order: number;
}[] => {
  return battleRegistry.map(({ id, trackId, arcId, order }) => ({
    id,
    trackId,
    arcId,
    order,
  }));
};

/**
 * Get battles for a specific arc (sorted by order)
 */
export const getBattlesByArc = async (arcId: string): Promise<Battle[]> => {
  const entries = battleRegistry.filter((b) => b.arcId === arcId);
  const battles = await Promise.all(
    entries.map(async (entry) => {
      if (battleCache.has(entry.id)) {
        return battleCache.get(entry.id)!;
      }
      const battle = await entry.loader();
      battleCache.set(entry.id, battle as Battle);
      return battle as Battle;
    })
  );
  return battles.sort((a, b) => a.order - b.order);
};

/**
 * Get battles for a specific track (across all arcs, sorted)
 */
export const getBattlesByTrack = async (trackId: string): Promise<Battle[]> => {
  const entries = battleRegistry.filter((b) => b.trackId === trackId);
  const battles = await Promise.all(
    entries.map(async (entry) => {
      if (battleCache.has(entry.id)) {
        return battleCache.get(entry.id)!;
      }
      const battle = await entry.loader();
      battleCache.set(entry.id, battle as Battle);
      return battle as Battle;
    })
  );
  return battles;
};

/**
 * Get a specific battle by ID (lazy loaded)
 */
export const getBattle = async (id: string): Promise<Battle | null> => {
  if (battleCache.has(id)) {
    return battleCache.get(id)!;
  }

  const entry = battleRegistry.find((b) => b.id === id);
  if (!entry) return null;

  const battle = await entry.loader();
  battleCache.set(id, battle as Battle);
  return battle as Battle;
};

/**
 * Get the next battle in the same arc
 */
export const getNextBattleInArc = (
  currentId: string
): { id: string; arcId: string } | null => {
  const current = battleRegistry.find((b) => b.id === currentId);
  if (!current) return null;

  const next = battleRegistry.find(
    (b) => b.arcId === current.arcId && b.order === current.order + 1
  );
  return next ? { id: next.id, arcId: next.arcId } : null;
};

/**
 * Get the first battle of the next arc in the same track
 */
export const getNextArcFirstBattle = (
  currentId: string
): { id: string; arcId: string } | null => {
  const current = battleRegistry.find((b) => b.id === currentId);
  if (!current) return null;

  const currentArc = getArc(current.arcId);
  if (!currentArc) return null;

  const trackArcs = getArcsByTrack(current.trackId);
  const nextArc = trackArcs.find((arc) => arc.order === currentArc.order + 1);
  if (!nextArc) return null;

  const firstBattle = battleRegistry.find(
    (b) => b.arcId === nextArc.id && b.order === 1
  );
  return firstBattle ? { id: firstBattle.id, arcId: firstBattle.arcId } : null;
};

// ============================================
// BACKWARD COMPATIBILITY (Deprecated)
// ============================================

/** @deprecated Use getAllBattlesMeta instead */
export const getAllChallengesMeta = (): { id: string; order: number }[] => {
  return battleRegistry
    .map(({ id, order }) => ({ id, order }))
    .sort((a, b) => a.order - b.order);
};

/** @deprecated Use getBattle instead */
export const getChallenge = async (id: string): Promise<Challenge | null> => {
  return getBattle(id);
};

/** @deprecated Use getAllBattles instead */
export const getAllChallenges = async (): Promise<Challenge[]> => {
  const battles = await Promise.all(
    battleRegistry.map(async (entry) => {
      if (battleCache.has(entry.id)) {
        return battleCache.get(entry.id)!;
      }
      const battle = await entry.loader();
      battleCache.set(entry.id, battle as Battle);
      return battle as Battle;
    })
  );
  return battles.sort((a, b) => a.order - b.order);
};

/** @deprecated Use getNextBattleInArc instead */
export const getNextChallengeId = (currentId: string): string | null => {
  const next = getNextBattleInArc(currentId);
  if (next) return next.id;

  // Try next arc
  const nextArc = getNextArcFirstBattle(currentId);
  return nextArc ? nextArc.id : null;
};
