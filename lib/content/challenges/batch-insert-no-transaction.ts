import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Rows inserted in a loop outside any transaction; a mid-batch failure leaves earlier rows committed. Fix wraps the loop in db.transaction.
export const batchInsertNoTransactionBattle: Battle = {
  "id": "batch-insert-no-transaction",
  "trackId": "backend-debugging",
  "arcId": "data-consistency-and-transactions",
  "title": "Partial Batch Insert Left Behind",
  "description": "Severity: High\nComponent: insertAll\nContext: insertAll writes a batch of rows. When one row violates a constraint partway through, support finds the earlier rows already persisted while the rest are missing — a half-applied batch.\n\nReproduction:\n1. Insert a batch where a middle row fails validation.\n2. The rows before it are already committed.\n3. The endpoint errors, but the partial data remains.\n\nExpected: The batch is atomic — a failure anywhere rolls back the entire batch so no partial data is persisted.",
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
    "src/BatchInsert.ts": {
      "file": {
        "contents": "export interface Db {\n  insert: (row: string) => Promise<void>\n  transaction: <T>(fn: () => Promise<T>) => Promise<T>\n}\n\n/**\n * Inserts every row in the batch.\n */\nexport async function insertAll(db: Db, rows: string[]): Promise<void> {\n  // BUG: rows are inserted one by one outside any transaction, so a failure\n  // partway through leaves the earlier rows committed.\n  for (const row of rows) {\n    await db.insert(row)\n  }\n}\n"
      }
    },
    "src/BatchInsert.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { insertAll, type Db } from './BatchInsert'\n\ntest('the batch is inserted inside a single transaction', async () => {\n  const db: Db = {\n    insert: vi.fn(async (row: string) => {\n      if (row === 'bad') throw new Error('constraint violation')\n    }),\n    transaction: vi.fn(async (fn) => fn()),\n  }\n\n  await expect(insertAll(db, ['ok', 'bad', 'ok2'])).rejects.toThrow(\n    'constraint violation'\n  )\n\n  // The work must run through the transaction wrapper, not as loose inserts.\n  expect(db.transaction).toHaveBeenCalledTimes(1)\n})\n"
      }
    }
  }
};
