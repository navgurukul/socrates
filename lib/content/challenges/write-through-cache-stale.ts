import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: update writes to the store but never updates/invalidates the cache, so cached reads stay stale. Fix syncs the cache on write.
export const writeThroughCacheStaleBattle: Battle = {
  "id": "write-through-cache-stale",
  "trackId": "backend-debugging",
  "arcId": "caching-and-invalidation",
  "title": "Cache Serves Stale Data After Update",
  "description": "Severity: High\nComponent: createUserCache\nContext: createUserCache is a read-through cache over a key/value store. After a value is updated, users keep seeing the old value until the process restarts.\n\nReproduction:\n1. Read a key (populating the cache).\n2. Update that key to a new value.\n3. Read the key again — it still returns the old value.\n\nExpected: After an update, reads reflect the new value; the write keeps the cache consistent with the store.",
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
    "src/UserCache.ts": {
      "file": {
        "contents": "export interface Db {\n  get: (id: string) => Promise<string>\n  set: (id: string, value: string) => Promise<void>\n}\n\n/**\n * A read-through cache over a key/value store.\n */\nexport function createUserCache(db: Db) {\n  const cache = new Map<string, string>()\n\n  async function get(id: string): Promise<string> {\n    if (cache.has(id)) return cache.get(id)!\n    const value = await db.get(id)\n    cache.set(id, value)\n    return value\n  }\n\n  async function update(id: string, value: string): Promise<void> {\n    await db.set(id, value)\n    // BUG: the cache still holds the old value, so subsequent reads are stale.\n  }\n\n  return { get, update }\n}\n"
      }
    },
    "src/UserCache.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { createUserCache, type Db } from './UserCache'\n\ntest('updating a value invalidates the cached copy', async () => {\n  const store = new Map<string, string>([['u1', 'old']])\n  const db: Db = {\n    get: vi.fn(async (id: string) => store.get(id) ?? ''),\n    set: vi.fn(async (id: string, value: string) => {\n      store.set(id, value)\n    }),\n  }\n  const cache = createUserCache(db)\n\n  expect(await cache.get('u1')).toBe('old') // populate the cache\n  await cache.update('u1', 'new')\n\n  // The next read must reflect the update, not the cached 'old' value.\n  expect(await cache.get('u1')).toBe('new')\n})\n"
      }
    }
  }
};
