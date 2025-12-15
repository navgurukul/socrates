import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Debug event types for tracking user actions during a battle
 */
export type DebugEventType =
  | "battle_started"
  | "test_passed"
  | "test_failed"
  | "file_edited"
  | "ai_hint_requested"
  | "ai_hint_received"
  | "file_opened"
  | "test_run"
  | "idle_detected";

/**
 * Debug event structure for tracking user interactions
 */
export interface DebugEvent {
  type: DebugEventType;
  timestamp: number;
  metadata?: {
    fileName?: string;
    lineNumber?: number;
    errorMessage?: string;
    testCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Complete debug trace for a challenge session
 */
export interface DebugTrace {
  challengeId: string;
  startedAt: number;
  completedAt?: number;
  events: DebugEvent[];
}

/**
 * Zustand store state interface
 */
interface DebugTraceState {
  trace: DebugTrace | null;
  addEvent: (event: DebugEvent) => void;
  startTrace: (challengeId: string) => void;
  completeTrace: () => void;
  resetTrace: () => void;
}

/**
 * Debug Trace Store
 *
 * Tracks user debug sessions for analytics and learning insights.
 * Records events like test runs, code edits, and hints requested.
 * Persisted to localStorage for durability across page refreshes.
 *
 * @example
 * ```ts
 * const { startTrace, addEvent, completeTrace } = useDebugTraceStore();
 *
 * // Start tracking
 * startTrace("login-bug");
 *
 * // Log events
 * addEvent({
 *   type: "file_edited",
 *   timestamp: Date.now(),
 *   metadata: { fileName: "index.js", lineNumber: 42 }
 * });
 *
 * // Complete trace
 * completeTrace();
 * ```
 */
export const useDebugTraceStore = create<DebugTraceState>()(
  persist(
    (set) => ({
      trace: null,

      startTrace: (challengeId) =>
        set({
          trace: {
            challengeId,
            startedAt: Date.now(),
            events: [{ type: "battle_started", timestamp: Date.now() }],
          },
        }),

      addEvent: (event) =>
        set((state) => {
          if (!state.trace) return {};
          return {
            trace: {
              ...state.trace,
              events: [...state.trace.events, event],
            },
          };
        }),

      completeTrace: () =>
        set((state) => {
          if (!state.trace) return {};
          return {
            trace: {
              ...state.trace,
              completedAt: Date.now(),
              events: [
                ...state.trace.events,
                { type: "test_passed", timestamp: Date.now() },
              ],
            },
          };
        }),

      resetTrace: () => set({ trace: null }),
    }),
    {
      name: "debug-trace-storage", // localStorage key
    }
  )
);
