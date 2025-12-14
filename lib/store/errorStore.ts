import { create } from "zustand";

export type ErrorType = "error" | "warning" | null;

/**
 * File operation error context
 */
export interface FileOperationError {
  operation: "create" | "delete" | "rename";
  path: string;
  error: Error;
  canRetry: boolean;
  timestamp: number;
}

interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
  timestamp: number;
  fileOperationError?: FileOperationError;
  errorHistory: Array<{ message: string; timestamp: number }>;
}

interface ErrorStore extends ErrorState {
  setError: (type: Exclude<ErrorType, null>, message: string, details?: string) => void;
  setFileOperationError: (
    operation: "create" | "delete" | "rename",
    path: string,
    error: Error,
    canRetry?: boolean
  ) => void;
  clearError: () => void;
  addErrorHistory: (message: string) => void;
}

const initialState: ErrorState = {
  type: null,
  message: "",
  details: undefined,
  timestamp: 0,
  fileOperationError: undefined,
  errorHistory: [],
};

export const useErrorStore = create<ErrorStore>((set) => ({
  ...initialState,

  setError: (type, message, details) => {
    set((state) => ({
      type,
      message,
      details,
      timestamp: Date.now(),
      errorHistory: [
        ...state.errorHistory,
        { message, timestamp: Date.now() },
      ].slice(-10), // Keep last 10 errors
    }));
  },

  setFileOperationError: (operation, path, error, canRetry = true) => {
    const message = `Failed to ${operation} ${path}: ${error.message}`;
    set((state) => ({
      type: "error",
      message,
      details: error.stack,
      timestamp: Date.now(),
      fileOperationError: {
        operation,
        path,
        error,
        canRetry,
        timestamp: Date.now(),
      },
      errorHistory: [
        ...state.errorHistory,
        { message, timestamp: Date.now() },
      ].slice(-10),
    }));
  },

  addErrorHistory: (message) => {
    set((state) => ({
      errorHistory: [
        ...state.errorHistory,
        { message, timestamp: Date.now() },
      ].slice(-10),
    }));
  },

  clearError: () => {
    set(initialState);
  },
}));
