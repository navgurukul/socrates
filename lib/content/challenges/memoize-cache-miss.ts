import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The wrapper calls fn() before checking the cache, so the expensive computation always runs. Fix returns early on a cache hit and only computes on a miss.
export const memoizeCacheMissBattle: Battle = {
  "id": "memoize-cache-miss",
  "trackId": "performance-debugging",
  "arcId": "redundant-computation",
  "title": "Memoize That Never Caches",
  "description": "Severity: High\nComponent: memoize\nContext: memoize is meant to wrap an expensive pure function so repeated calls with the same argument are served from a cache. In production the wrapped function still runs on every call — the cache provides no speedup at all.\n\nReproduction:\n1. Wrap an expensive function with memoize.\n2. Call the wrapped function several times with the SAME argument.\n3. Count invocations of the underlying function — it runs on every call, not just the first.\n\nExpected: The underlying function runs at most once per distinct argument; subsequent calls with that argument return the cached result without recomputing.",
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
    "src/Memoize.ts": {
      "file": {
        "contents": "/**\n * Wraps a pure, single-argument function so repeated calls with the same\n * argument return a cached result instead of recomputing.\n */\nexport function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {\n  const cache = new Map<A, R>()\n\n  return (arg: A): R => {\n    // BUG: the expensive fn is invoked on EVERY call before the cache is\n    // consulted, so memoization saves no work — repeats recompute every time.\n    const result = fn(arg)\n    if (!cache.has(arg)) {\n      cache.set(arg, result)\n    }\n    return cache.get(arg)!\n  }\n}\n"
      }
    },
    "src/Memoize.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { memoize } from './Memoize'\n\ntest('repeated calls with the same argument compute only once', () => {\n  const square = vi.fn((n: number) => n * n)\n  const memoized = memoize(square)\n\n  expect(memoized(4)).toBe(16)\n  expect(memoized(4)).toBe(16)\n  expect(memoized(4)).toBe(16)\n\n  // The underlying function runs once; later calls are served from cache.\n  expect(square).toHaveBeenCalledTimes(1)\n})\n\ntest('distinct arguments are each computed', () => {\n  const square = vi.fn((n: number) => n * n)\n  const memoized = memoize(square)\n\n  expect(memoized(2)).toBe(4)\n  expect(memoized(3)).toBe(9)\n\n  expect(square).toHaveBeenCalledTimes(2)\n})\n"
      }
    }
  }
};
