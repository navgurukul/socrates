/**
 * Application-wide constants and configuration
 * Single source of truth for all magic numbers and string literals
 */

// Timing Configuration
export const TIMINGS = {
  DEBOUNCE_FILE_SYNC_MS: 300,
  DEBOUNCE_MONACO_SYNC_MS: 150,
  
  // Adaptive Sync Configuration
  SYNC_IDLE_THRESHOLD_MS: 1000,
  SYNC_SMALL_CHANGE_CHARS: 100,
  SYNC_SHORT_DEBOUNCE_MS: 150,
  SYNC_LONG_DEBOUNCE_MS: 500,
  SYNC_ENABLE_LEADING_EDGE: true,
  
  // Type Loading
  TYPE_LOADING_MAX_DEPTH: 5,
} as const;

// Layout Configuration
export const LAYOUT = {
  SIDEBAR_DEFAULT_SIZE: 20,
  SIDEBAR_MIN_SIZE: 15,
  SIDEBAR_MAX_SIZE: 30,
  EDITOR_DEFAULT_SIZE: 40,
  EDITOR_MIN_SIZE: 25,
  PREVIEW_DEFAULT_SIZE: 35,
  PREVIEW_MIN_SIZE: 20,
  BOTTOM_PANEL_DEFAULT_SIZE: 50,
  BOTTOM_PANEL_MIN_SIZE: 20,
} as const;

// WebContainer Configuration
export const CONTAINER = {
  NODE_MODULES_MIN_DIRS: 5,
  NPM_INSTALL_FLAGS: [
    "install",
    "--prefer-offline",
    "--no-audit",
    "--no-fund",
    "--progress",
  ],
} as const;

// UI Identifiers
export const TABS = {
  CONSOLE: "console",
  TUTOR: "tutor",
} as const;

export const TEST_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed",
} as const;

export type TestStatus = (typeof TEST_STATUS)[keyof typeof TEST_STATUS];
