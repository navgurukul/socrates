import { Battle } from "../types";

export const staleSearchResultsBattle: Battle = {
  id: "stale-search-results",
  trackId: "frontend-debugging",
  arcId: "async-data-flow",
  title: "The Stale Search Result",
  description: `
# Bug Report: Search Results Flicker or Revert

**Severity:** High  
**Component:** \`Search.tsx\`

## Context
Users report that when typing quickly into the search box, results sometimes jump back to older queries.

This happens inconsistently and is hard to reproduce unless you type fast.

## Instructions
1. Open the **Preview**.
2. Type quickly into the search input (e.g. "r", then "re", then "rea").
3. Observe how results sometimes show the wrong query.
4. Fix the bug in \`src/Search.tsx\`.
5. Run Tests to verify.

Hint: This is **not** a rendering issue. Think about **time**.
  `,
  difficulty: "Medium",
  order: 1,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "async-search-bug",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview",
              test: "vitest run",
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.15",
              "@types/react-dom": "^18.2.7",
              "@vitejs/plugin-react": "^4.0.3",
              vite: "^4.4.5",
              vitest: "^0.34.1",
              jsdom: "^22.1.0",
              "@testing-library/react": "^14.0.0",
            },
          },
          null,
          2
        ),
      },
    },

    "index.html": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `<!doctype html>
<html>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
    },

    "vite.config.ts": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      },
    },

    "vitest.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
})`,
      },
    },

    "src/main.tsx": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import Search from './Search'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Search />
  </React.StrictMode>
)`,
      },
    },

    "src/fakeApi.ts": {
      readOnly: true,
      file: {
        contents: `export function searchApi(query: string): Promise<string[]> {
  return new Promise(resolve => {
    const delay = Math.random() * 800 + 200;

    setTimeout(() => {
      resolve([
        query + " result 1",
        query + " result 2",
        query + " result 3"
      ]);
    }, delay);
  });
}`,
      },
    },

    "src/Search.tsx": {
      file: {
        contents: `import React, { useEffect, useState } from 'react';
import { searchApi } from './fakeApi';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);

    searchApi(query).then(res => {
      setResults(res);
      setLoading(false);
    });
  }, [query]);

  return (
    <div style={{ maxWidth: 400 }}>
      <h2>Product Search</h2>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Type to search..."
        style={{ width: '100%', padding: 8 }}
      />

      {loading && <p>Loading...</p>}

      <ul data-testid="results">
        {results.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}`,
      },
    },

    "src/Search.test.tsx": {
      readOnly: true,
      file: {
        contents: `import { render, fireEvent, screen, act } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Search from './Search';

vi.useFakeTimers();

test('does not show stale results for older queries', async () => {
  render(<Search />);

  const input = screen.getByPlaceholderText('Type to search...');

  fireEvent.change(input, { target: { value: 'r' } });
  fireEvent.change(input, { target: { value: 're' } });
  fireEvent.change(input, { target: { value: 'rea' } });

  await act(async () => {
    vi.runAllTimers();
  });

  const results = screen.getByTestId('results').textContent;

  expect(results).toContain('rea');
  expect(results).not.toContain('r result');
});
`,
      },
    },
  },
};
