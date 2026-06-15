import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: getPage calls fetchAll() and slices in memory, so work scales with table size. Fix requests just the window via fetchPage(offset, limit).
export const paginateOverFetchBattle: Battle = {
  "id": "paginate-over-fetch",
  "trackId": "performance-debugging",
  "arcId": "algorithmic-complexity",
  "title": "Pagination Loads the Whole Table",
  "description": "Severity: High\nComponent: getPage\nContext: getPage returns a single page of rows from a data source that can return either the whole table or a bounded window. As the table grows, paging through it gets slower and memory spikes, even though each page is small.\n\nReproduction:\n1. Request page 2 of size 10 from a source backing a 1000-row table.\n2. Observe the source's full-table load is invoked and all 1000 rows are pulled into memory before slicing.\n3. Note the cost scales with total rows, not page size.\n\nExpected: Only the requested page is fetched from the source (a bounded window); the full-table load is never used. The returned page is unchanged.",
  "difficulty": "Hard",
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
    "src/Pagination.ts": {
      "file": {
        "contents": "export interface RowSource {\n  // Loads the ENTIRE table — expensive and grows without bound.\n  fetchAll: () => Promise<number[]>\n  // Loads only the requested window.\n  fetchPage: (offset: number, limit: number) => Promise<number[]>\n}\n\n/**\n * Returns one page of rows (0-indexed page number).\n */\nexport async function getPage(\n  source: RowSource,\n  page: number,\n  pageSize: number\n): Promise<number[]> {\n  // BUG: fetches every row in the table, then slices in memory. Cost grows with\n  // the table size rather than the page size — a full scan to return a handful\n  // of rows.\n  const all = await source.fetchAll()\n  const start = page * pageSize\n  return all.slice(start, start + pageSize)\n}\n"
      }
    },
    "src/Pagination.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { getPage, type RowSource } from './Pagination'\n\ntest('only the requested page is fetched, not the whole table', async () => {\n  const table = Array.from({ length: 1000 }, (_, i) => i)\n  const fetchAll = vi.fn(async () => table)\n  const fetchPage = vi.fn(async (offset: number, limit: number) =>\n    table.slice(offset, offset + limit)\n  )\n  const source: RowSource = { fetchAll, fetchPage }\n\n  const result = await getPage(source, 2, 10)\n\n  // Page 2 (0-indexed) of size 10 => rows 20..29.\n  expect(result).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])\n  // The full-table fetch must not be used.\n  expect(fetchAll).not.toHaveBeenCalled()\n  expect(fetchPage).toHaveBeenCalledWith(20, 10)\n})\n"
      }
    }
  }
};
