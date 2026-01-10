"use client";

import { useEffect } from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { useErrorStore } from "@/lib/store/errorStore";
import { Button } from "./button";

/**
 * Error Toast Component
 * Displays file operation errors with retry option
 */
export function ErrorToast() {
  const {
    type,
    message,
    details,
    fileOperationError,
    clearError,
  } = useErrorStore();

  // Auto-dismiss warnings after 5 seconds
  useEffect(() => {
    if (type === "warning") {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, clearError]);

  if (!type) return null;

  const handleRetry = () => {
    // TODO: Implement retry logic - would need to pass the operation callback
    // For now, just clear the error
    clearError();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div
        className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
          type === "error"
            ? "border-red-500/50 bg-red-950/90"
            : "border-yellow-500/50 bg-yellow-950/90"
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
              type === "error" ? "text-red-400" : "text-yellow-400"
            }`}
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={`font-medium ${
                    type === "error" ? "text-red-200" : "text-yellow-200"
                  }`}
                >
                  {type === "error" ? "Operation Failed" : "Warning"}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    type === "error" ? "text-red-300" : "text-yellow-300"
                  }`}
                >
                  {message}
                </p>
              </div>
              
              <button
                onClick={clearError}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {details && (
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-black/30 p-2 text-xs">
                  {details}
                </pre>
              </details>
            )}

            {fileOperationError && fileOperationError.canRetry && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="h-7 gap-1 text-xs border-white/20 hover:bg-white/10"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearError}
                  className="h-7 text-xs hover:bg-white/10"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
