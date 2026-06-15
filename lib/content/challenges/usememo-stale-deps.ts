import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: useMemo dependency array omits taxRate, so the memoized total is never recomputed when the tax rate changes.
export const usememoStaleDepsBattle: Battle = {
  "id": "usememo-stale-deps",
  "trackId": "frontend-debugging",
  "arcId": "performance-and-memory",
  "title": "Total Ignores Tax Rate Changes",
  "description": "Severity: High\nComponent: PriceSummary\nContext: PriceSummary shows an order total that should include tax. Users report that changing the tax rate does not update the displayed total.\n\nReproduction:\n1. Render PriceSummary (total shows the pre-tax amount).\n2. Change the tax rate input.\n3. The total does not change.\n\nExpected: The total recomputes whenever the tax rate changes and reflects price plus tax.",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Total Ignores Tax Rate Changes</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport PriceSummary from './PriceSummary.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <PriceSummary />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/PriceSummary.tsx": {
      "file": {
        "contents": "import React, { useMemo, useState } from 'react'\n\nexport default function PriceSummary() {\n  const [price] = useState(100)\n  const [taxRate, setTaxRate] = useState(0)\n\n  // BUG: deps omit taxRate, so the memoized total never recomputes when the\n  // tax rate changes — it stays stuck at the no-tax value.\n  const total = useMemo(() => price + price * taxRate, [price])\n\n  return (\n    <div className=\"container\">\n      <input\n        aria-label=\"tax\"\n        type=\"number\"\n        value={taxRate}\n        onChange={(e) => setTaxRate(Number(e.target.value))}\n      />\n      <span data-testid=\"total\">{total}</span>\n    </div>\n  )\n}\n"
      }
    },
    "src/PriceSummary.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react'\nimport { expect, test } from 'vitest'\nimport PriceSummary from './PriceSummary'\n\ntest('the total recomputes when the tax rate changes', () => {\n  render(<PriceSummary />)\n  expect(screen.getByTestId('total')).toHaveTextContent('100')\n\n  fireEvent.change(screen.getByLabelText('tax'), { target: { value: '0.1' } })\n\n  // 100 + 100 * 0.1 = 110\n  expect(screen.getByTestId('total')).toHaveTextContent('110')\n})\n"
      }
    }
  }
};
