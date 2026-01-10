/**
 * Environment-aware logger utility
 * Debug and info methods are silent in production
 * Warn and error methods always output
 */

const isDevelopment = process.env.NODE_ENV === "development";

export function createLogger(prefix: string) {
  return {
    debug: (...args: unknown[]) => {
      if (isDevelopment) {
        console.log(`[${prefix}]`, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (isDevelopment) {
        console.info(`[${prefix}]`, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      console.warn(`[${prefix}]`, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(`[${prefix}]`, ...args);
    },
  };
}
