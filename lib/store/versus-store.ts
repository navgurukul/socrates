import { create } from "zustand";

// ============================================
// TYPES
// ============================================

export type BattleState =
  | "available"
  | "in_progress"
  | "skipped"
  | "solved"
  | "locked";

export type RoomStatus = "lobby" | "in_progress" | "finished";

export type ParticipantStatus = "joined" | "ready" | "playing" | "finished";

export interface VersusParticipant {
  userId: string;
  username: string;
  avatarUrl: string | null;
  isReady: boolean;
  solved: number;
  totalTimeMs: number;
}

export interface VersusRanking {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  solved: number;
  totalTimeMs: number;
  isCurrentUser: boolean;
}

// ============================================
// STATE INTERFACE
// ============================================

interface VersusState {
  // Room
  roomId: string | null;
  joinCode: string | null;
  isHost: boolean;
  status: RoomStatus;

  // Match
  challengePool: string[];
  timeLimit: number;
  startedAt: number | null;
  remainingSeconds: number | null;

  // Battle Progress (per-battle state for current user)
  battleStates: Record<string, BattleState>;
  currentBattleId: string | null;
  solvedCount: number;
  totalTimeMs: number;
  currentBattleStartTime: number | null;

  // Live Leaderboard
  rankings: VersusRanking[];

  // Participants
  participants: Record<string, VersusParticipant>;
  currentUserId: string | null;
}

// ============================================
// STORE INTERFACE
// ============================================

interface VersusStore extends VersusState {
  // Room actions
  setRoom: (data: {
    roomId: string;
    joinCode: string;
    isHost: boolean;
    timeLimit: number;
  }) => void;
  setCurrentUserId: (userId: string) => void;
  setStatus: (status: RoomStatus) => void;

  // Participant actions
  setParticipants: (participants: Record<string, VersusParticipant>) => void;
  updateParticipant: (
    userId: string,
    updates: Partial<VersusParticipant>
  ) => void;
  removeParticipant: (userId: string) => void;

  // Match actions
  startMatch: (pool: string[], startTime: number) => void;
  setRemainingSeconds: (seconds: number) => void;

  // Battle actions
  selectBattle: (battleId: string) => void;
  skipBattle: () => void;
  markSolved: (battleId: string, timeMs: number) => void;

  // Rankings
  setRankings: (rankings: VersusRanking[]) => void;

  // Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: VersusState = {
  roomId: null,
  joinCode: null,
  isHost: false,
  status: "lobby",

  challengePool: [],
  timeLimit: 600,
  startedAt: null,
  remainingSeconds: null,

  battleStates: {},
  currentBattleId: null,
  solvedCount: 0,
  totalTimeMs: 0,
  currentBattleStartTime: null,

  rankings: [],
  participants: {},
  currentUserId: null,
};

// ============================================
// STORE
// ============================================

export const useVersusStore = create<VersusStore>((set, get) => ({
  ...initialState,

  // Room actions
  setRoom: ({ roomId, joinCode, isHost, timeLimit }) =>
    set({
      roomId,
      joinCode,
      isHost,
      timeLimit,
      status: "lobby",
    }),

  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  setStatus: (status) => set({ status }),

  // Participant actions
  setParticipants: (participants) => set({ participants }),

  updateParticipant: (userId, updates) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [userId]: {
          ...state.participants[userId],
          ...updates,
        },
      },
    })),

  removeParticipant: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.participants;
      return { participants: rest };
    }),

  // Match actions
  startMatch: (pool, startTime) =>
    set((state) => {
      // Initialize battle states
      const battleStates: Record<string, BattleState> = {};
      pool.forEach((id) => {
        battleStates[id] = "available";
      });

      // Set first battle as current
      const firstBattleId = pool[0] || null;
      if (firstBattleId) {
        battleStates[firstBattleId] = "in_progress";
      }

      return {
        status: "in_progress",
        challengePool: pool,
        startedAt: startTime,
        remainingSeconds: state.timeLimit,
        battleStates,
        currentBattleId: firstBattleId,
        currentBattleStartTime: Date.now(),
        solvedCount: 0,
        totalTimeMs: 0,
      };
    }),

  setRemainingSeconds: (seconds) => set({ remainingSeconds: seconds }),

  // Battle actions
  selectBattle: (battleId) =>
    set((state) => {
      const currentState = state.battleStates[battleId];

      // Can only select available or skipped battles
      if (currentState !== "available" && currentState !== "skipped") {
        return state;
      }

      // Mark current battle as skipped if it was in progress
      const newBattleStates = { ...state.battleStates };
      if (
        state.currentBattleId &&
        newBattleStates[state.currentBattleId] === "in_progress"
      ) {
        newBattleStates[state.currentBattleId] = "skipped";
      }

      // Mark new battle as in progress
      newBattleStates[battleId] = "in_progress";

      return {
        battleStates: newBattleStates,
        currentBattleId: battleId,
        currentBattleStartTime: Date.now(),
      };
    }),

  skipBattle: () =>
    set((state) => {
      if (!state.currentBattleId) return state;

      const newBattleStates = { ...state.battleStates };
      newBattleStates[state.currentBattleId] = "skipped";

      // Find next available or skipped battle
      const nextBattleId = state.challengePool.find(
        (id) =>
          id !== state.currentBattleId &&
          (newBattleStates[id] === "available" ||
            newBattleStates[id] === "skipped")
      );

      if (nextBattleId) {
        newBattleStates[nextBattleId] = "in_progress";
      }

      return {
        battleStates: newBattleStates,
        currentBattleId: nextBattleId || null,
        currentBattleStartTime: nextBattleId ? Date.now() : null,
      };
    }),

  markSolved: (battleId, timeMs) =>
    set((state) => {
      const newBattleStates = { ...state.battleStates };
      newBattleStates[battleId] = "solved";

      // Find next available or skipped battle
      const nextBattleId = state.challengePool.find(
        (id) =>
          id !== battleId &&
          (newBattleStates[id] === "available" ||
            newBattleStates[id] === "skipped")
      );

      if (nextBattleId) {
        newBattleStates[nextBattleId] = "in_progress";
      }

      return {
        battleStates: newBattleStates,
        currentBattleId: nextBattleId || null,
        currentBattleStartTime: nextBattleId ? Date.now() : null,
        solvedCount: state.solvedCount + 1,
        totalTimeMs: state.totalTimeMs + timeMs,
      };
    }),

  // Rankings
  setRankings: (rankings) => set({ rankings }),

  // Reset
  reset: () => set(initialState),
}));
