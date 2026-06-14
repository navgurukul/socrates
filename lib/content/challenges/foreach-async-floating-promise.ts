import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: forEach with an async callback floats the put promises; saveAll resolves before they settle and a rejection goes unhandled. Fix awaits Promise.all of the writes.
export const foreachAsyncFloatingPromiseBattle: Battle = {
  "id": "foreach-async-floating-promise",
  "trackId": "backend-debugging",
  "arcId": "error-handling-and-resilience",
  "title": "Batch Save Hides Write Failures",
  "description": "Severity: High\nComponent: saveAll\nContext: saveAll persists a batch of items. Callers await it and assume a successful return means everything was written. In production, individual write failures vanish — no error is thrown — yet data is missing afterward.\n\nReproduction:\n1. Call saveAll with a batch where one item's write rejects.\n2. Await the returned promise.\n3. saveAll resolves successfully even though a write failed.\n\nExpected: If any write fails, saveAll rejects with that error so the caller can handle it.",
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
    "src/BatchWriter.ts": {
      "file": {
        "contents": "export interface Store {\n  put: (item: string) => Promise<void>\n}\n\n/**\n * Persists every item to the store.\n */\nexport async function saveAll(store: Store, items: string[]): Promise<void> {\n  // BUG: forEach does not await its async callback, so the put promises float.\n  // saveAll resolves immediately and a failed write becomes an unhandled\n  // rejection instead of rejecting saveAll.\n  items.forEach(async (item) => {\n    await store.put(item)\n  })\n}\n"
      }
    },
    "src/BatchWriter.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { saveAll, type Store } from './BatchWriter'\n\ntest('saveAll rejects when a write fails', async () => {\n  const store: Store = {\n    put: vi.fn(async (item: string) => {\n      if (item === 'b') throw new Error('disk full')\n    }),\n  }\n\n  await expect(saveAll(store, ['a', 'b', 'c'])).rejects.toThrow('disk full')\n})\n"
      }
    }
  }
};
