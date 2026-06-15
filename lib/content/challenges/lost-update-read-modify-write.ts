import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Read-modify-write cycles run concurrently via Promise.all, so reads all see the same starting balance and writes overwrite each other (lost update). Fix serializes the cycles.
export const lostUpdateReadModifyWriteBattle: Battle = {
  "id": "lost-update-read-modify-write",
  "trackId": "backend-debugging",
  "arcId": "race-conditions",
  "title": "Concurrent Deposits Lose Money",
  "description": "Severity: Critical\nComponent: applyDeposits\nContext: applyDeposits applies a batch of deposits to an account balance via a read-modify-write against a store. Reconciliation shows the final balance is lower than the sum of deposits — money goes missing under concurrency.\n\nReproduction:\n1. Apply several deposits, e.g. [10, 20, 30], to a balance starting at 0.\n2. The expected final balance is 60.\n3. The actual final balance is less (only the last write survives).\n\nExpected: Every deposit is reflected in the final balance regardless of timing; applying [10, 20, 30] to 0 yields 60.",
  "difficulty": "Hard",
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
    "src/Wallet.ts": {
      "file": {
        "contents": "export interface BalanceStore {\n  read: () => Promise<number>\n  write: (value: number) => Promise<void>\n}\n\n/**\n * Applies a series of deposits to a balance store.\n */\nexport async function applyDeposits(\n  store: BalanceStore,\n  deposits: number[]\n): Promise<void> {\n  // BUG: deposits run concurrently. Each does read-then-write, so interleaved\n  // reads all observe the same starting balance and later writes clobber earlier\n  // ones — classic lost update.\n  await Promise.all(\n    deposits.map(async (amount) => {\n      const current = await store.read()\n      await store.write(current + amount)\n    })\n  )\n}\n"
      }
    },
    "src/Wallet.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test } from 'vitest'\nimport { applyDeposits, type BalanceStore } from './Wallet'\n\nfunction makeStore(initial = 0): BalanceStore & { current: () => number } {\n  let value = initial\n  return {\n    read: async () => {\n      await Promise.resolve()\n      return value\n    },\n    write: async (v: number) => {\n      await Promise.resolve()\n      value = v\n    },\n    current: () => value,\n  }\n}\n\ntest('all deposits are applied without losing updates', async () => {\n  const store = makeStore(0)\n\n  await applyDeposits(store, [10, 20, 30])\n\n  expect(store.current()).toBe(60)\n})\n"
      }
    }
  }
};
