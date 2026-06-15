import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Uses Array.forEach, which cannot break, so the predicate runs for all items even after a match. Fix uses a for...of loop that returns true on the first match.
export const foreachNoEarlyExitBattle: Battle = {
  "id": "foreach-no-early-exit",
  "trackId": "performance-debugging",
  "arcId": "algorithmic-complexity",
  "title": "Existence Check Scans the Whole List",
  "description": "Severity: Medium\nComponent: anyMatch\nContext: anyMatch reports whether any item passes an expensive predicate (e.g. a permission check). On large collections it stays slow even when a matching item is near the front, and the predicate is evaluated for every element.\n\nReproduction:\n1. Call anyMatch on a list whose first match is early (say, index 1 of many).\n2. Count predicate invocations.\n3. Observe the predicate runs for every item, not just up to the first match.\n\nExpected: The scan stops as soon as the first matching item is found; the predicate is not evaluated for items past the match. The boolean result is unchanged.",
  "difficulty": "Easy",
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
    "src/Search.ts": {
      "file": {
        "contents": "/**\n * Returns true if any item satisfies the (expensive) predicate.\n */\nexport function anyMatch<T>(\n  items: T[],\n  predicate: (item: T) => boolean\n): boolean {\n  let found = false\n  // BUG: forEach cannot break, so the expensive predicate is evaluated for\n  // EVERY item even once a match has been found — wasted work after the answer\n  // is already known.\n  items.forEach((item) => {\n    if (predicate(item)) {\n      found = true\n    }\n  })\n  return found\n}\n"
      }
    },
    "src/Search.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { anyMatch } from './Search'\n\ntest('the search stops at the first match', () => {\n  const isAdmin = vi.fn((u: { role: string }) => u.role === 'admin')\n  const users = [\n    { role: 'user' },\n    { role: 'admin' }, // first match at index 1\n    { role: 'user' },\n    { role: 'user' },\n  ]\n\n  expect(anyMatch(users, isAdmin)).toBe(true)\n  // Only items up to and including the first match are examined (2 of 4).\n  expect(isAdmin).toHaveBeenCalledTimes(2)\n})\n\ntest('returns false when nothing matches', () => {\n  const isAdmin = vi.fn((u: { role: string }) => u.role === 'admin')\n  const users = [{ role: 'user' }, { role: 'user' }]\n\n  expect(anyMatch(users, isAdmin)).toBe(false)\n  expect(isAdmin).toHaveBeenCalledTimes(2)\n})\n"
      }
    }
  }
};
