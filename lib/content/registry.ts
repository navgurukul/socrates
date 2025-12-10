import { Challenge } from "./types";

// 1. Challenge registry with dynamic imports for code splitting
type ChallengeLoader = () => Promise<{ default: Challenge } | Challenge>;

interface ChallengeEntry {
  id: string;
  order: number;
  loader: ChallengeLoader;
}

const challengeRegistry: ChallengeEntry[] = [
  {
    id: "login-spinner-bug",
    order: 1,
    loader: () =>
      import("./challenges/login-bug").then((m) => m.loginBugChallenge),
  },
  {
    id: "shopping-cart-bug",
    order: 2,
    loader: () =>
      import("./challenges/shopping-cart").then((m) => m.shoppingCartChallenge),
  },
  {
    id: "slow-render",
    order: 3,
    loader: () =>
      import("./challenges/slow-render").then((m) => m.slowRenderChallenge),
  },
];

// Cache for loaded challenges
const challengeCache = new Map<string, Challenge>();

// 2. Export Helper Functions

// Get all challenges metadata sorted by order (For the Dashboard)
// Returns lightweight data without loading full challenge content
export const getAllChallengesMeta = (): { id: string; order: number }[] => {
  return challengeRegistry
    .map(({ id, order }) => ({ id, order }))
    .sort((a, b) => a.order - b.order);
};

// Get all challenges (loads all - use sparingly)
export const getAllChallenges = async (): Promise<Challenge[]> => {
  const challenges = await Promise.all(
    challengeRegistry.map(async (entry) => {
      if (challengeCache.has(entry.id)) {
        return challengeCache.get(entry.id)!;
      }
      const challenge = await entry.loader();
      challengeCache.set(entry.id, challenge as Challenge);
      return challenge as Challenge;
    })
  );
  return challenges.sort((a, b) => a.order - b.order);
};

// Get a specific challenge (For the Arena) - lazy loaded
export const getChallenge = async (id: string): Promise<Challenge | null> => {
  // Check cache first
  if (challengeCache.has(id)) {
    return challengeCache.get(id)!;
  }

  const entry = challengeRegistry.find((c) => c.id === id);
  if (!entry) return null;

  const challenge = await entry.loader();
  challengeCache.set(id, challenge as Challenge);
  return challenge as Challenge;
};

// Get the NEXT challenge ID (For the "Next Level" button)
export const getNextChallengeId = (currentId: string): string | null => {
  const current = challengeRegistry.find((c) => c.id === currentId);
  if (!current) return null;

  const next = challengeRegistry.find((c) => c.order === current.order + 1);
  return next ? next.id : null;
};
