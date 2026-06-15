import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Cache stores only resolved values, so concurrent callers all miss and each runs the loader. Fix caches the in-flight promise so callers share one invocation.
export const dedupeInflightRequestsBattle: Battle = {
  "id": "dedupe-inflight-requests",
  "trackId": "backend-debugging",
  "arcId": "race-conditions",
  "title": "Cache Stampede on Concurrent Loads",
  "description": "Severity: High\nComponent: createCachedLoader\nContext: createCachedLoader wraps an expensive loader (e.g. a DB or API call) so repeated lookups for the same key are served from cache. Under load, monitoring shows the underlying loader firing many times for the same key in the same instant.\n\nReproduction:\n1. Call the wrapped loader twice for the same key at the same time (before the first resolves).\n2. Observe the underlying loader runs once per caller instead of once per key.\n\nExpected: Concurrent lookups for the same key share a single loader call; the loader runs at most once per key while a request is in flight.",
  "difficulty": "Medium",
  "order": 1,
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
    "src/CachedLoader.ts": {
      "file": {
        "contents": "type Loader<T> = (key: string) => Promise<T>\n\n/**\n * Wraps a loader so repeated lookups for the same key are cached.\n */\nexport function createCachedLoader<T>(loader: Loader<T>) {\n  const cache = new Map<string, T>()\n\n  // BUG: only RESOLVED values are cached. Two concurrent calls for the same key\n  // both miss the cache (nothing is stored until the await resolves), so the\n  // loader runs once per concurrent caller instead of once per key.\n  return async function get(key: string): Promise<T> {\n    if (cache.has(key)) return cache.get(key)!\n    const value = await loader(key)\n    cache.set(key, value)\n    return value\n  }\n}\n"
      }
    },
    "src/CachedLoader.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { createCachedLoader } from './CachedLoader'\n\ntest('concurrent lookups for the same key invoke the loader only once', async () => {\n  const loader = vi.fn(async (key: string) => {\n    await Promise.resolve() // simulate async work\n    return key.toUpperCase()\n  })\n  const get = createCachedLoader(loader)\n\n  const [a, b] = await Promise.all([get('x'), get('x')])\n\n  expect(a).toBe('X')\n  expect(b).toBe('X')\n  expect(loader).toHaveBeenCalledTimes(1)\n})\n\ntest('different keys each invoke the loader', async () => {\n  const loader = vi.fn(async (key: string) => key.toUpperCase())\n  const get = createCachedLoader(loader)\n\n  await Promise.all([get('a'), get('b')])\n\n  expect(loader).toHaveBeenCalledTimes(2)\n})\n"
      }
    }
  }
};
