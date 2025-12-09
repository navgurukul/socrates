import { Challenge } from "./types";
import { loginBugChallenge } from "./challenges/login-bug";
import { shoppingCartChallenge } from "./challenges/shopping-cart";

// 1. Import new challenges here as you create them
const rawChallenges: Challenge[] = [
  loginBugChallenge,
  shoppingCartChallenge,
  // level2Challenge,
  // level3Challenge...
];

// 2. Export Helper Functions

// Get all challenges sorted by order (For the Dashboard)
export const getAllChallenges = (): Challenge[] => {
  return rawChallenges.sort((a, b) => a.order - b.order);
};

// Get a specific challenge (For the Arena)
export const getChallenge = (id: string): Challenge | null => {
  return rawChallenges.find((c) => c.id === id) || null;
};

// Get the NEXT challenge ID (For the "Next Level" button)
export const getNextChallengeId = (currentId: string): string | null => {
  const current = rawChallenges.find((c) => c.id === currentId);
  if (!current) return null;

  const next = rawChallenges.find((c) => c.order === current.order + 1);
  return next ? next.id : null;
};
