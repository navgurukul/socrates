import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  solvedChallengeIds: string[];
  markSolved: (id: string) => void;
  isSolved: (id: string) => boolean;
  // Future proofing:
  // xp: number;
  // streak: number;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      solvedChallengeIds: [],

      markSolved: (id: string) => {
        const { solvedChallengeIds } = get();
        if (!solvedChallengeIds.includes(id)) {
          set({ solvedChallengeIds: [...solvedChallengeIds, id] });
        }
      },

      isSolved: (id: string) => get().solvedChallengeIds.includes(id),
    }),
    {
      name: "bug-battle-storage", // key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
