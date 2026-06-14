import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The reveal toggle only swaps a CSS class while the input keeps type="password", so the value is never actually shown.
export const showPasswordTypeToggleBattle: Battle = {
  "id": "show-password-type-toggle",
  "trackId": "frontend-debugging",
  "arcId": "browser-and-dom",
  "title": "Show Password Button Does Nothing",
  "description": "Severity: Medium\nComponent: PasswordInput\nContext: PasswordInput has a \"Show\"/\"Hide\" button meant to reveal the masked value. The button label flips, but the characters stay masked as dots.\n\nReproduction:\n1. Render PasswordInput with a value entered.\n2. Click \"Show\". The button label changes to \"Hide\".\n3. The field still renders masked dots instead of the plain text value.\n\nExpected: Clicking \"Show\" switches the input to plain text so the value is readable, and \"Hide\" masks it again.",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Show Password Button Does Nothing</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport PasswordInput from './PasswordInput.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <PasswordInput />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/PasswordInput.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react'\n\nexport default function PasswordInput() {\n  const [visible, setVisible] = useState(false)\n\n  return (\n    <div className=\"container\">\n      <input\n        aria-label=\"password\"\n        // BUG: only a class changes; type stays \"password\" so it never reveals.\n        type=\"password\"\n        className={visible ? 'is-visible' : 'is-masked'}\n        defaultValue=\"hunter2\"\n      />\n      <button className=\"btn\" onClick={() => setVisible((v) => !v)}>\n        {visible ? 'Hide' : 'Show'}\n      </button>\n    </div>\n  )\n}\n"
      }
    },
    "src/PasswordInput.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react'\nimport { expect, test } from 'vitest'\nimport PasswordInput from './PasswordInput'\n\ntest('toggling reveal switches the input type to text', () => {\n  render(<PasswordInput />)\n  const input = screen.getByLabelText('password')\n\n  expect(input).toHaveAttribute('type', 'password')\n\n  fireEvent.click(screen.getByText('Show'))\n  expect(input).toHaveAttribute('type', 'text')\n})\n"
      }
    }
  }
};
