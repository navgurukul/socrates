import { create } from "zustand";

export type ErrorType = "error" | "warning" | null;

interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: number;
}

interface ErrorStore extends ErrorState {
  setError: (type: Exclude<ErrorType, null>, message: string, details?: string) => void;
  clearError: () => void;
}

const initialState: ErrorState = {
  type: null,
  message: "",
  details: undefined,
  timestamp: 0,
};

export const useErrorStore = create<ErrorStore>((set) => ({
  ...initialState,

  setError: (type, message, details) => {
    set({
      type,
      message,
      details,
      timestamp: Date.now(),
    });
  },

  clearError: () => {
    set(initialState);
  },
}));
