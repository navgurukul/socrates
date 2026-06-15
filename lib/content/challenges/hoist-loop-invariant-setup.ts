import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: A loop-invariant expensive setup (buildRateIndex) is called inside the per-order loop, so it runs N times. Fix hoists it above the loop to run once.
export const hoistLoopInvariantSetupBattle: Battle = {
  "id": "hoist-loop-invariant-setup",
  "trackId": "performance-debugging",
  "arcId": "redundant-computation",
  "title": "Order Total Rebuilds Rates Every Iteration",
  "description": "Severity: Medium\nComponent: totalInUsd\nContext: totalInUsd converts a batch of orders to USD using a currency rate index supplied by a pricing source. Profiling shows the endpoint's time grows linearly with the number of orders far faster than expected, and the rate index is rebuilt thousands of times per request.\n\nReproduction:\n1. Sum a batch of N orders.\n2. Count how many times the pricing source builds its rate index.\n3. Observe it is built once per order (N times) instead of once per batch.\n\nExpected: The rate index — which does not change across orders — is built a single time per call, and the total is unchanged.",
  "difficulty": "Easy",
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
    "src/OrderReport.ts": {
      "file": {
        "contents": "export interface PricingSource {\n  // Expensive: builds a currency -> rate lookup. Should be called once.\n  buildRateIndex: () => Record<string, number>\n}\n\nexport interface Order {\n  amount: number\n  currency: string\n}\n\n/**\n * Sums a batch of orders, converting each amount to USD via the rate index.\n */\nexport function totalInUsd(orders: Order[], source: PricingSource): number {\n  let total = 0\n  for (const order of orders) {\n    // BUG: rebuilds the entire rate index on every iteration. The index is the\n    // same for the whole batch, so this expensive call belongs outside the loop.\n    const rates = source.buildRateIndex()\n    total += order.amount * (rates[order.currency] ?? 1)\n  }\n  return total\n}\n"
      }
    },
    "src/OrderReport.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { totalInUsd, type PricingSource } from './OrderReport'\n\ntest('the rate index is built once, not once per order', () => {\n  const buildRateIndex = vi.fn(() => ({ USD: 1, EUR: 2 }))\n  const source: PricingSource = { buildRateIndex }\n  const orders = [\n    { amount: 10, currency: 'USD' },\n    { amount: 5, currency: 'EUR' },\n    { amount: 3, currency: 'USD' },\n  ]\n\n  const total = totalInUsd(orders, source)\n\n  expect(total).toBe(10 * 1 + 5 * 2 + 3 * 1) // 23\n  // The invariant index must be built a single time for the whole batch.\n  expect(buildRateIndex).toHaveBeenCalledTimes(1)\n})\n"
      }
    }
  }
};
