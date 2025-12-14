import { create } from "zustand";
import { TEST_STATUS, TABS, type TestStatus } from "@/lib/config/constants";

export interface ReviewData {
  praise: string;
  critique?: string;
  tip: string;
}

interface BattleState {
  status: TestStatus;
  testOutput: string;
  reviewData: ReviewData | null;
  attemptCount: number;
  activeBottomTab: string;
}

interface BattleStore extends BattleState {
  setStatus: (status: TestStatus) => void;
  setTestOutput: (output: string) => void;
  setReviewData: (data: ReviewData | null) => void;
  incrementAttempts: () => void;
  setActiveBottomTab: (tab: string) => void;
  resetBattle: () => void;
}

const initialState: BattleState = {
  status: TEST_STATUS.IDLE,
  testOutput: "",
  reviewData: null,
  attemptCount: 0,
  activeBottomTab: TABS.CONSOLE,
};

export const useBattleStore = create<BattleStore>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setTestOutput: (output) => set({ testOutput: output }),

  setReviewData: (data) => set({ reviewData: data }),

  incrementAttempts: () =>
    set((state) => ({ attemptCount: state.attemptCount + 1 })),

  setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),

  resetBattle: () => set(initialState),
}));
