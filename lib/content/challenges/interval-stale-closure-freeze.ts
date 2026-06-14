import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: setInterval callback closes over the initial state value and uses a non-functional setter, so every tick recomputes from 0 and the counter is stuck at 1.
export const intervalStaleClosureFreezeBattle: Battle = {
  "id": "interval-stale-closure-freeze",
  "trackId": "frontend-debugging",
  "arcId": "production-debugging-boss",
  "title": "Session Timer Frozen at One Second",
  "description": "Severity: Medium\nComponent: SessionTimer\nContext: SessionTimer shows how long the current session has been active, updating once per second from a setInterval. Users report the timer jumps to 1 and then never moves.\n\nReproduction:\n1. Mount SessionTimer.\n2. Wait several seconds.\n3. Observe the displayed value stays at 1 instead of climbing (2, 3, ...).\n\nExpected: The displayed seconds increase by one every second for as long as the component is mounted.",
  "difficulty": "Hard",
  "order": 3,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Session Timer Frozen at One Second</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport SessionTimer from './SessionTimer.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <SessionTimer />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/SessionTimer.tsx": {
      "file": {
        "contents": "import React, { useEffect, useState } from 'react'\n\nexport default function SessionTimer() {\n  const [seconds, setSeconds] = useState(0)\n\n  useEffect(() => {\n    const id = setInterval(() => {\n      // BUG: this closes over the initial `seconds` (0), so every tick sets the\n      // value to 0 + 1. The timer is stuck at 1 instead of incrementing.\n      setSeconds(seconds + 1)\n    }, 1000)\n    return () => clearInterval(id)\n  }, [])\n\n  return (\n    <div className=\"container\">\n      <span data-testid=\"seconds\">{seconds}</span>\n    </div>\n  )\n}\n"
      }
    },
    "src/SessionTimer.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, act } from '@testing-library/react'\nimport { afterEach, expect, test, vi } from 'vitest'\nimport SessionTimer from './SessionTimer'\n\nafterEach(() => {\n  vi.useRealTimers()\n})\n\ntest('the timer counts up each second instead of freezing at 1', () => {\n  vi.useFakeTimers()\n  render(<SessionTimer />)\n\n  act(() => {\n    vi.advanceTimersByTime(3000)\n  })\n\n  // Three seconds elapsed => the display must read 3, not 1.\n  expect(screen.getByTestId('seconds')).toHaveTextContent('3')\n})\n"
      }
    }
  }
};
