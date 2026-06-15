import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Success handler stores the data but never sets loading to false, so the loading branch renders permanently.
export const loadingSpinnerNeverClearsBattle: Battle = {
  "id": "loading-spinner-never-clears",
  "trackId": "frontend-debugging",
  "arcId": "async-network-and-effects",
  "title": "Spinner Never Goes Away",
  "description": "Severity: High\nComponent: UserCard\nContext: UserCard fetches a user and shows a \"Loading...\" spinner until the data arrives. Users report the spinner stays on screen forever even though the network request succeeds.\n\nReproduction:\n1. Render UserCard with a successful /api/user response.\n2. Wait for the request to resolve.\n3. The component keeps showing \"Loading...\" and never displays the name.\n\nExpected: When the request resolves, the spinner is replaced by the loaded user's name.",
  "difficulty": "Medium",
  "order": 4,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Spinner Never Goes Away</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport UserCard from './UserCard.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <UserCard />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/UserCard.tsx": {
      "file": {
        "contents": "import React, { useEffect, useState } from 'react'\n\nexport default function UserCard() {\n  const [name, setName] = useState('')\n  const [loading, setLoading] = useState(true)\n\n  useEffect(() => {\n    fetch('/api/user')\n      .then((res) => res.json())\n      .then((data) => {\n        setName(data.name)\n        // BUG: loading is never set to false, so the spinner shows forever\n        // even after the data has arrived.\n      })\n  }, [])\n\n  if (loading) return <p data-testid=\"status\">Loading...</p>\n  return <p data-testid=\"status\">{name}</p>\n}\n"
      }
    },
    "src/UserCard.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen } from '@testing-library/react'\nimport { afterEach, expect, test, vi } from 'vitest'\nimport UserCard from './UserCard'\n\nafterEach(() => {\n  vi.restoreAllMocks()\n})\n\ntest('the spinner is replaced by the data once it loads', async () => {\n  vi.stubGlobal(\n    'fetch',\n    vi.fn(() =>\n      Promise.resolve({\n        json: () => Promise.resolve({ name: 'Grace' }),\n      } as Response)\n    )\n  )\n\n  render(<UserCard />)\n  expect(screen.getByTestId('status')).toHaveTextContent('Loading...')\n\n  // Once the request resolves, the loaded name must replace the spinner.\n  await screen.findByText('Grace')\n})\n"
      }
    }
  }
};
