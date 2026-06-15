import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Dedup uses out.some(... keyOf(kept) === keyOf(item)) — an O(n^2) nested scan that recomputes the expensive key repeatedly. Fix derives each key once and tracks them in a Set.
export const dedupeByQuadraticScanBattle: Battle = {
  "id": "dedupe-by-quadratic-scan",
  "trackId": "performance-debugging",
  "arcId": "algorithmic-complexity",
  "title": "Dedup Recomputes Keys in a Nested Scan",
  "description": "Severity: High\nComponent: dedupeBy\nContext: dedupeBy removes duplicate items by an expensive key function. On large inputs the call time grows quadratically and the key function is invoked far more often than there are items.\n\nReproduction:\n1. Dedup a list of N items where the key function is instrumented.\n2. Count how many times the key function runs.\n3. Observe it runs many more than N times — it is re-derived for every comparison in a nested scan.\n\nExpected: The key for each item is derived exactly once (N total); duplicates are detected in linear time, and the deduped output is unchanged.",
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
    "src/Dedupe.ts": {
      "file": {
        "contents": "/**\n * Removes duplicate items, treating two items as equal when they share the\n * same key. `keyOf` is expensive (it normalizes/hashes the item), so it\n * should be evaluated at most once per item.\n */\nexport function dedupeBy<T>(items: T[], keyOf: (item: T) => string): T[] {\n  const out: T[] = []\n  for (const item of items) {\n    // BUG: O(n^2). For every item this re-derives keyOf for the candidate AND\n    // for each already-kept item, so the expensive key function runs far more\n    // than once per item.\n    const isDuplicate = out.some((kept) => keyOf(kept) === keyOf(item))\n    if (!isDuplicate) {\n      out.push(item)\n    }\n  }\n  return out\n}\n"
      }
    },
    "src/Dedupe.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { dedupeBy } from './Dedupe'\n\ntest('the expensive key is derived once per item', () => {\n  const keyOf = vi.fn((u: { id: number }) => String(u.id))\n  const items = [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }, { id: 2 }]\n\n  const result = dedupeBy(items, keyOf)\n\n  expect(result.map((u) => u.id)).toEqual([1, 2, 3])\n  // One key derivation per input item — no nested rescanning (O(n), not O(n^2)).\n  expect(keyOf).toHaveBeenCalledTimes(items.length)\n})\n"
      }
    }
  }
};
