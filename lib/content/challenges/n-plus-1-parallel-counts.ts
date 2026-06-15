import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Per-author count query wrapped in Promise.all — concurrent but still N round trips. Fix uses one grouped count query keyed by author id.
export const nPlus1ParallelCountsBattle: Battle = {
  "id": "n-plus-1-parallel-counts",
  "trackId": "backend-debugging",
  "arcId": "n-plus-1-queries",
  "title": "Author Counts Hide an N+1",
  "description": "Severity: High\nComponent: getAuthorsWithCounts\nContext: getAuthorsWithCounts lists authors with a book count each. It feels fast in development but the database team flags a burst of identical count queries proportional to the number of authors.\n\nReproduction:\n1. Load the endpoint with N authors.\n2. Inspect the query log.\n3. Observe one count query per author (N), in addition to the authors query.\n\nExpected: Counts are fetched in a single grouped query; total query count stays constant regardless of how many authors there are.",
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
    "src/CatalogService.ts": {
      "file": {
        "contents": "export interface Catalog {\n  getAuthors: () => Promise<{ id: number; name: string }[]>\n  countBooksByAuthor: (authorId: number) => Promise<number>\n  countBooksGrouped: (authorIds: number[]) => Promise<Record<number, number>>\n}\n\nexport interface AuthorWithCount {\n  id: number\n  name: string\n  bookCount: number\n}\n\n/**\n * Returns each author with how many books they have.\n */\nexport async function getAuthorsWithCounts(\n  catalog: Catalog\n): Promise<AuthorWithCount[]> {\n  const authors = await catalog.getAuthors()\n\n  // BUG: one count query per author. Promise.all makes it concurrent, which\n  // hides the N+1 in latency but still hammers the DB with N round trips.\n  return Promise.all(\n    authors.map(async (author) => ({\n      ...author,\n      bookCount: await catalog.countBooksByAuthor(author.id),\n    }))\n  )\n}\n"
      }
    },
    "src/CatalogService.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { getAuthorsWithCounts, type Catalog } from './CatalogService'\n\ntest('book counts load via a single grouped query, not one per author', async () => {\n  const countBooksByAuthor = vi.fn(async (id: number) => id * 10)\n  const countBooksGrouped = vi.fn(async (ids: number[]) =>\n    Object.fromEntries(ids.map((id) => [id, id * 10]))\n  )\n  const catalog: Catalog = {\n    getAuthors: async () => [\n      { id: 1, name: 'a' },\n      { id: 2, name: 'b' },\n    ],\n    countBooksByAuthor,\n    countBooksGrouped,\n  }\n\n  const result = await getAuthorsWithCounts(catalog)\n\n  expect(result).toEqual([\n    { id: 1, name: 'a', bookCount: 10 },\n    { id: 2, name: 'b', bookCount: 20 },\n  ])\n  expect(countBooksByAuthor).not.toHaveBeenCalled()\n  expect(countBooksGrouped).toHaveBeenCalledTimes(1)\n})\n"
      }
    }
  }
};
