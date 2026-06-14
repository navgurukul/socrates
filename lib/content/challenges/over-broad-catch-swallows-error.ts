import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Over-broad catch swallows any read error and returns defaults as if valid, hiding outages. Fix removes the swallow so failures propagate.
export const overBroadCatchSwallowsErrorBattle: Battle = {
  "id": "over-broad-catch-swallows-error",
  "trackId": "backend-debugging",
  "arcId": "error-handling-and-resilience",
  "title": "Config Loader Masks Failures as Defaults",
  "description": "Severity: High\nComponent: loadConfig\nContext: loadConfig reads configuration overrides from a source and layers them over defaults. When the config service has a transient outage, the app boots \"successfully\" but runs entirely on defaults, and the outage goes unnoticed until something breaks downstream.\n\nReproduction:\n1. Make the source's read reject (simulate an outage).\n2. Call loadConfig.\n3. It resolves with the defaults instead of surfacing the failure.\n\nExpected: A read failure propagates to the caller so the outage is visible; defaults are only used as a base layer for successfully-read config, not as a mask for errors.",
  "difficulty": "Medium",
  "order": 2,
  "tech": [
    "typescript",
    "node",
    "vitest"
  ],
  "files": {
    "package.json": {
      "readOnly": true,
      "file": {
        "contents": "{\n  \"name\": \"battle-challenge\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"test\": \"vitest run\"\n  },\n  \"devDependencies\": {\n    \"vitest\": \"^0.34.1\",\n    \"typescript\": \"^5.2.2\",\n    \"@types/node\": \"^20.8.0\"\n  }\n}"
      }
    },
    "vitest.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vitest/config'\n\nexport default defineConfig({\n  test: {\n    environment: 'node',\n    globals: true,\n    watch: false,\n  },\n})"
      }
    },
    "src/ConfigLoader.ts": {
      "file": {
        "contents": "export interface Source {\n  read: () => Promise<Record<string, unknown>>\n}\n\n/**\n * Loads config from a source, layered over defaults.\n */\nexport async function loadConfig(\n  source: Source,\n  defaults: Record<string, unknown>\n): Promise<Record<string, unknown>> {\n  try {\n    const config = await source.read()\n    return { ...defaults, ...config }\n  } catch {\n    // BUG: a transient read failure is swallowed and defaults are returned as\n    // if they were valid config, so the app silently boots misconfigured.\n    return { ...defaults }\n  }\n}\n"
      }
    },
    "src/ConfigLoader.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { loadConfig, type Source } from './ConfigLoader'\n\ntest('a read failure propagates instead of silently using defaults', async () => {\n  const source: Source = {\n    read: vi.fn(async () => {\n      throw new Error('config service unreachable')\n    }),\n  }\n\n  await expect(loadConfig(source, { timeout: 30 })).rejects.toThrow(\n    'config service unreachable'\n  )\n})\n\ntest('loaded config overrides defaults on success', async () => {\n  const source: Source = {\n    read: vi.fn(async () => ({ timeout: 60 })),\n  }\n\n  await expect(\n    loadConfig(source, { timeout: 30, retries: 3 })\n  ).resolves.toEqual({ timeout: 60, retries: 3 })\n})\n"
      }
    }
  }
};
