import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Optimistic increment is applied before the request, but the catch branch only shows an error and never reverts the count, so failed likes are still counted.
export const optimisticUpdateNoRollbackBattle: Battle = {
  "id": "optimistic-update-no-rollback",
  "trackId": "frontend-debugging",
  "arcId": "production-debugging-boss",
  "title": "Failed Like Still Counts",
  "description": "Severity: High\nComponent: LikeButton\nContext: LikeButton optimistically increments the visible like count, then persists the like with a POST. Users report likes that \"stick\" on screen even when the save fails (e.g. offline), so the count no longer matches the server.\n\nReproduction:\n1. Simulate a failing /api/like request (server error or offline).\n2. Click \"Like\". The count increments immediately to 1.\n3. The request fails and an error message appears.\n\nExpected: When the save fails, the optimistic increment is undone so the displayed count reflects what was actually persisted.",
  "difficulty": "Hard",
  "order": 2,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Failed Like Still Counts</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport LikeButton from './LikeButton.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <LikeButton />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/LikeButton.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react'\n\nexport default function LikeButton() {\n  const [likes, setLikes] = useState(0)\n  const [failed, setFailed] = useState(false)\n\n  async function handleLike() {\n    setFailed(false)\n    setLikes((n) => n + 1) // optimistic update\n    try {\n      const res = await fetch('/api/like', { method: 'POST' })\n      if (!res.ok) throw new Error('request failed')\n    } catch {\n      // BUG: the error is surfaced but the optimistic increment is never rolled\n      // back, so a failed like still shows as counted.\n      setFailed(true)\n    }\n  }\n\n  return (\n    <div className=\"container\">\n      <button className=\"btn\" onClick={handleLike}>\n        Like\n      </button>\n      <span data-testid=\"like-count\">{likes}</span>\n      {failed && <p role=\"alert\">Could not save your like.</p>}\n    </div>\n  )\n}\n"
      }
    },
    "src/LikeButton.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent, waitFor } from '@testing-library/react'\nimport { afterEach, expect, test, vi } from 'vitest'\nimport LikeButton from './LikeButton'\n\nafterEach(() => {\n  vi.restoreAllMocks()\n})\n\ntest('a failed like is rolled back to the original count', async () => {\n  vi.stubGlobal(\n    'fetch',\n    vi.fn(() => Promise.resolve({ ok: false } as Response))\n  )\n\n  render(<LikeButton />)\n  fireEvent.click(screen.getByText('Like'))\n\n  // The failure is surfaced to the user...\n  await screen.findByRole('alert')\n\n  // ...and the optimistic increment must be undone (back to 0).\n  await waitFor(() => {\n    expect(screen.getByTestId('like-count')).toHaveTextContent('0')\n  })\n})\n"
      }
    }
  }
};
