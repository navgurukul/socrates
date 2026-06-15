import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: get returns any cached entry without comparing its age to the TTL, so entries never expire. Fix checks Date.now() - storedAt against ttlMs.
export const ttlCacheNeverExpiresBattle: Battle = {
  "id": "ttl-cache-never-expires",
  "trackId": "backend-debugging",
  "arcId": "caching-and-invalidation",
  "title": "TTL Cache That Never Expires",
  "description": "Severity: High\nComponent: createTtlCache\nContext: createTtlCache is meant to cache values for a fixed time-to-live and reload them afterward. In production, values never refresh — the cache serves the first value it ever loaded indefinitely.\n\nReproduction:\n1. Load a key (cached with a TTL of, say, 1000ms).\n2. Advance well past the TTL.\n3. Read the key again — it still returns the original value and never reloads.\n\nExpected: Once an entry is older than its TTL, the next read reloads it from the source; entries within the TTL are still served from cache.",
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
    "src/TtlCache.ts": {
      "file": {
        "contents": "export type Loader = (key: string) => Promise<string>\n\ninterface Entry {\n  value: string\n  storedAt: number\n}\n\n/**\n * A cache whose entries are meant to expire after `ttlMs`.\n */\nexport function createTtlCache(loader: Loader, ttlMs: number) {\n  const cache = new Map<string, Entry>()\n\n  return async function get(key: string): Promise<string> {\n    const entry = cache.get(key)\n    // BUG: a cached entry is returned without checking whether it has expired,\n    // so values are served forever regardless of the TTL.\n    if (entry) return entry.value\n\n    const value = await loader(key)\n    cache.set(key, { value, storedAt: Date.now() })\n    return value\n  }\n}\n"
      }
    },
    "src/TtlCache.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { afterEach, beforeEach, expect, test, vi } from 'vitest'\nimport { createTtlCache } from './TtlCache'\n\nbeforeEach(() => {\n  vi.useFakeTimers()\n})\n\nafterEach(() => {\n  vi.useRealTimers()\n})\n\ntest('an entry older than the TTL is reloaded instead of served stale', async () => {\n  let n = 0\n  const loader = vi.fn(async () => `v${++n}`)\n  const get = createTtlCache(loader, 1000)\n\n  expect(await get('k')).toBe('v1') // fresh load, cached at t=0\n\n  vi.advanceTimersByTime(1500) // move past the 1000ms TTL\n\n  expect(await get('k')).toBe('v2') // expired -> reloaded\n  expect(loader).toHaveBeenCalledTimes(2)\n})\n\ntest('an entry within the TTL is served from cache', async () => {\n  let n = 0\n  const loader = vi.fn(async () => `v${++n}`)\n  const get = createTtlCache(loader, 1000)\n\n  expect(await get('k')).toBe('v1')\n  vi.advanceTimersByTime(500) // still within TTL\n  expect(await get('k')).toBe('v1')\n  expect(loader).toHaveBeenCalledTimes(1)\n})\n"
      }
    }
  }
};
