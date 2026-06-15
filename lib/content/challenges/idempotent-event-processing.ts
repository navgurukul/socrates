import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Processor has no dedup, so at-least-once redelivery double-applies an event. Fix tracks processed event ids and ignores repeats.
export const idempotentEventProcessingBattle: Battle = {
  "id": "idempotent-event-processing",
  "trackId": "backend-debugging",
  "arcId": "race-conditions",
  "title": "Redelivered Payment Charged Twice",
  "description": "Severity: Critical\nComponent: createProcessor\nContext: The payment processor consumes events from an at-least-once message queue, which can deliver the same event more than once. Customers report being charged twice for a single payment.\n\nReproduction:\n1. Process a payment event, then process the exact same event again (a redelivery).\n2. Inspect the ledger balance.\n3. The amount has been credited twice.\n\nExpected: Processing is idempotent — a redelivered event with the same id applies its effect at most once.",
  "difficulty": "Medium",
  "order": 3,
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
    "src/EventProcessor.ts": {
      "file": {
        "contents": "export interface Ledger {\n  credit: (amount: number) => void\n}\n\nexport interface PaymentEvent {\n  id: string\n  amount: number\n}\n\n/**\n * Builds a processor for payment events arriving from an at-least-once queue.\n */\nexport function createProcessor(ledger: Ledger) {\n  // BUG: no dedup. At-least-once delivery means the same event id can arrive\n  // more than once, and each delivery credits the ledger again.\n  return function process(event: PaymentEvent) {\n    ledger.credit(event.amount)\n  }\n}\n"
      }
    },
    "src/EventProcessor.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test } from 'vitest'\nimport { createProcessor, type Ledger } from './EventProcessor'\n\nfunction makeLedger() {\n  let balance = 0\n  const ledger: Ledger = { credit: (amount) => (balance += amount) }\n  return { ledger, balance: () => balance }\n}\n\ntest('a redelivered event is applied only once', () => {\n  const { ledger, balance } = makeLedger()\n  const process = createProcessor(ledger)\n  const event = { id: 'evt-1', amount: 100 }\n\n  process(event)\n  process(event) // redelivery from the at-least-once queue\n\n  expect(balance()).toBe(100)\n})\n\ntest('distinct events are each applied', () => {\n  const { ledger, balance } = makeLedger()\n  const process = createProcessor(ledger)\n\n  process({ id: 'a', amount: 10 })\n  process({ id: 'b', amount: 20 })\n\n  expect(balance()).toBe(30)\n})\n"
      }
    }
  }
};
