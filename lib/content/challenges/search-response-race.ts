import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Per-keystroke fetch has no staleness guard, so a slow older response resolves after a newer one and overwrites the correct results (last-response-wins race).
export const searchResponseRaceBattle: Battle = {
  "id": "search-response-race",
  "trackId": "frontend-debugging",
  "arcId": "production-debugging-boss",
  "title": "Search Results Clobbered by Stale Response",
  "description": "Severity: High\nComponent: ProductSearch\nContext: ProductSearch fetches results on every change to the query and renders them as a list. Users report that the displayed results sometimes do not match what they typed.\n\nReproduction:\n1. Type a query (e.g. \"a\"). The request is slow on this connection.\n2. Before it returns, refine the query (e.g. \"ab\"). This request returns quickly and the correct results for \"ab\" appear.\n3. A moment later the list changes to show results for the OLD query \"a\" instead.\n\nExpected: The list always reflects the most recent query the user typed, regardless of the order in which network responses arrive.",
  "difficulty": "Hard",
  "order": 1,
  "tech": [
    "react",
    "typescript",
    "vite"
  ],
  "files": {
    "package.json": {
      "readOnly": true,
      "file": {
        "contents": "{\n  \"name\": \"battle-challenge\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"preview\": \"vite preview\",\n    \"test\": \"vitest run\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.15\",\n    \"@types/react-dom\": \"^18.2.7\",\n    \"@vitejs/plugin-react\": \"^4.0.3\",\n    \"vite\": \"^4.4.5\",\n    \"vitest\": \"^0.34.1\",\n    \"jsdom\": \"^22.1.0\",\n    \"@testing-library/react\": \"^14.0.0\",\n    \"@testing-library/jest-dom\": \"^6.1.4\"\n  }\n}"
      }
    },
    "index.html": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Search Results Clobbered by Stale Response</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
      }
    },
    "vite.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})"
      }
    },
    "vitest.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vitest/config'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: 'jsdom',\n    globals: true,\n    watch: false,\n    setupFiles: ['./vitest.setup.ts'],\n  },\n})"
      }
    },
    "vitest.setup.ts": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import '@testing-library/jest-dom';"
      }
    },
    "src/main.tsx": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport ProductSearch from './ProductSearch.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <ProductSearch />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/ProductSearch.tsx": {
      "file": {
        "contents": "import React, { useEffect, useState } from 'react'\n\ninterface SearchResponse {\n  results: string[]\n}\n\nexport default function ProductSearch() {\n  const [query, setQuery] = useState('')\n  const [results, setResults] = useState<string[]>([])\n\n  useEffect(() => {\n    if (!query) {\n      setResults([])\n      return\n    }\n    fetch(`/api/search?q=${query}`)\n      .then((res) => res.json() as Promise<SearchResponse>)\n      .then((data) => {\n        // BUG: no guard against stale responses. A slow request for an older\n        // query can resolve after a newer one and overwrite the correct results.\n        setResults(data.results)\n      })\n  }, [query])\n\n  return (\n    <div className=\"container\">\n      <input\n        aria-label=\"search\"\n        placeholder=\"Search products...\"\n        value={query}\n        onChange={(e) => setQuery(e.target.value)}\n      />\n      <ul>\n        {results.map((r) => (\n          <li key={r}>{r}</li>\n        ))}\n      </ul>\n    </div>\n  )\n}\n"
      }
    },
    "src/ProductSearch.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent, waitFor } from '@testing-library/react'\nimport { afterEach, expect, test, vi } from 'vitest'\nimport ProductSearch from './ProductSearch'\n\nafterEach(() => {\n  vi.restoreAllMocks()\n})\n\n// Deferred promise helper so the test controls resolution order.\nfunction deferred<T>() {\n  let resolve!: (value: T) => void\n  const promise = new Promise<T>((r) => {\n    resolve = r\n  })\n  return { promise, resolve }\n}\n\ntest('newer query results are not clobbered by a slow older response', async () => {\n  const slow = deferred<{ results: string[] }>()\n\n  const fetchMock = vi.fn((url: string) => {\n    if (url.includes('q=ab')) {\n      // The newer request resolves immediately.\n      return Promise.resolve({\n        json: () => Promise.resolve({ results: ['ab-result'] }),\n      } as Response)\n    }\n    // The older request (q=a) is slow and resolves later, under our control.\n    return Promise.resolve({\n      json: () => slow.promise,\n    } as Response)\n  })\n  vi.stubGlobal('fetch', fetchMock)\n\n  render(<ProductSearch />)\n  const input = screen.getByLabelText('search')\n\n  // Type the older query, then quickly the newer one.\n  fireEvent.change(input, { target: { value: 'a' } })\n  fireEvent.change(input, { target: { value: 'ab' } })\n\n  // Newer (fast) response lands first.\n  await screen.findByText('ab-result')\n\n  // Now the stale older response finally resolves.\n  slow.resolve({ results: ['a-result'] })\n\n  // Give the stale promise a chance to (incorrectly) apply.\n  await waitFor(() => {\n    expect(screen.getByText('ab-result')).toBeInTheDocument()\n  })\n  expect(screen.queryByText('a-result')).not.toBeInTheDocument()\n})\n"
      }
    }
  }
};
