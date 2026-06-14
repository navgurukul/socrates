import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Input is controlled (value from state) but has no onChange handler, so React resets it on every keystroke and the value never changes.
export const controlledInputNoOnchangeBattle: Battle = {
  "id": "controlled-input-no-onchange",
  "trackId": "frontend-debugging",
  "arcId": "react-and-components",
  "title": "Name Field Won't Accept Typing",
  "description": "Severity: High\nComponent: NameField\nContext: NameField lets a user type their name, which is echoed in a greeting below the input. Users report they cannot type anything into the field.\n\nReproduction:\n1. Render NameField.\n2. Click the input and type \"Ada\".\n3. The field stays empty and the greeting keeps saying \"Hello, stranger\".\n\nExpected: Typing updates the field's value and the greeting reflects what was typed.",
  "difficulty": "Easy",
  "order": 5,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Name Field Won't Accept Typing</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport NameField from './NameField.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <NameField />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/NameField.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react'\n\nexport default function NameField() {\n  const [name, setName] = useState('')\n\n  return (\n    <div className=\"container\">\n      <input\n        aria-label=\"name\"\n        value={name}\n        placeholder=\"Your name\"\n        // BUG: no onChange — the value is controlled by state that never\n        // updates, so React resets the field on every keystroke.\n      />\n      <p data-testid=\"greeting\">Hello, {name || 'stranger'}</p>\n    </div>\n  )\n}\n"
      }
    },
    "src/NameField.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react'\nimport { expect, test } from 'vitest'\nimport NameField from './NameField'\n\ntest('typing into the field updates its value and the greeting', () => {\n  render(<NameField />)\n  const input = screen.getByLabelText('name')\n\n  fireEvent.change(input, { target: { value: 'Ada' } })\n\n  expect(input).toHaveValue('Ada')\n  expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, Ada')\n})\n"
      }
    }
  }
};
