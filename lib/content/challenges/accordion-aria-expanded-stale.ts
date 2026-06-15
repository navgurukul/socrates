import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: aria-expanded is hardcoded to false instead of bound to the open state, so the disclosure's accessible state never updates.
export const accordionAriaExpandedStaleBattle: Battle = {
  "id": "accordion-aria-expanded-stale",
  "trackId": "frontend-debugging",
  "arcId": "browser-and-dom",
  "title": "Accordion Always Reports Collapsed",
  "description": "Severity: Medium\nComponent: Accordion\nContext: Accordion shows a \"Details\" toggle that reveals a content region. Visually it expands and collapses correctly, but screen reader users always hear \"collapsed\", even after opening it.\n\nReproduction:\n1. Render Accordion and inspect the toggle button's aria-expanded value.\n2. Click \"Details\" to reveal the content.\n3. Re-inspect aria-expanded — it still reports the section as collapsed.\n\nExpected: aria-expanded is \"true\" when the content is visible and \"false\" when hidden.",
  "difficulty": "Medium",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Accordion Always Reports Collapsed</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport Accordion from './Accordion.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <Accordion />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/Accordion.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react'\n\nexport default function Accordion() {\n  const [open, setOpen] = useState(false)\n\n  return (\n    <div className=\"container\">\n      <button\n        className=\"btn\"\n        // BUG: aria-expanded is hardcoded to false; it never reflects `open`.\n        aria-expanded={false}\n        onClick={() => setOpen((o) => !o)}\n      >\n        Details\n      </button>\n      {open && <div role=\"region\">Account details here</div>}\n    </div>\n  )\n}\n"
      }
    },
    "src/Accordion.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react'\nimport { expect, test } from 'vitest'\nimport Accordion from './Accordion'\n\ntest('aria-expanded reflects the open state', () => {\n  render(<Accordion />)\n  const toggle = screen.getByRole('button', { name: 'Details' })\n\n  expect(toggle).toHaveAttribute('aria-expanded', 'false')\n\n  fireEvent.click(toggle)\n  expect(toggle).toHaveAttribute('aria-expanded', 'true')\n})\n"
      }
    }
  }
};
