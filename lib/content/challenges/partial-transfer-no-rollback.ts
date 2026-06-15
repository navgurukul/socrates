import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Debit-then-credit with no compensation: a failed credit leaves the debit applied. Fix refunds the source account on credit failure before rethrowing.
export const partialTransferNoRollbackBattle: Battle = {
  "id": "partial-transfer-no-rollback",
  "trackId": "backend-debugging",
  "arcId": "data-consistency-and-transactions",
  "title": "Transfer Loses Money on Failure",
  "description": "Severity: Critical\nComponent: transfer\nContext: transfer debits one account and credits another. When the credit step fails (e.g. the destination is frozen), reconciliation shows the source was debited but the destination never received the funds — money vanishes.\n\nReproduction:\n1. Attempt a transfer where the credit to the destination fails.\n2. The debit from the source has already been applied.\n3. The error propagates but the debit is never undone.\n\nExpected: The transfer is all-or-nothing — if the credit fails, the debit is compensated so balances are unchanged.",
  "difficulty": "Hard",
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
    "src/Bank.ts": {
      "file": {
        "contents": "export interface Accounts {\n  debit: (id: string, amount: number) => Promise<void>\n  credit: (id: string, amount: number) => Promise<void>\n}\n\n/**\n * Moves `amount` from one account to another.\n */\nexport async function transfer(\n  accounts: Accounts,\n  from: string,\n  to: string,\n  amount: number\n): Promise<void> {\n  await accounts.debit(from, amount)\n  // BUG: if the credit fails, the debit above is never undone, so the money\n  // disappears from `from` without ever reaching `to`.\n  await accounts.credit(to, amount)\n}\n"
      }
    },
    "src/Bank.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { transfer, type Accounts } from './Bank'\n\ntest('a failed credit refunds the debited account', async () => {\n  const ops: string[] = []\n  const accounts: Accounts = {\n    debit: vi.fn(async (id: string) => {\n      ops.push(`debit ${id}`)\n    }),\n    credit: vi.fn(async (id: string) => {\n      ops.push(`credit ${id}`)\n      if (id === 'B') throw new Error('account frozen')\n    }),\n  }\n\n  await expect(transfer(accounts, 'A', 'B', 100)).rejects.toThrow('account frozen')\n\n  // The debit to A must be compensated by a refund.\n  expect(ops).toEqual(['debit A', 'credit B', 'credit A'])\n})\n"
      }
    }
  }
};
