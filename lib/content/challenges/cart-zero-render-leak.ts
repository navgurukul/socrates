import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Uses a number as the && guard (`itemCount && ...`); when itemCount is 0 React renders the 0 instead of nothing. Guard must be a boolean (itemCount > 0).
export const cartZeroRenderLeakBattle: Battle = {
  "id": "cart-zero-render-leak",
  "trackId": "frontend-debugging",
  "arcId": "react-and-components",
  "title": "Empty Cart Shows a Stray Zero",
  "description": "Severity: Low\nComponent: CartBadge\nContext: CartBadge shows a count badge next to the word \"Cart\" when there are items. When the cart is empty, a lone \"0\" appears next to \"Cart\" instead of nothing.\n\nReproduction:\n1. Render CartBadge with itemCount set to 0.\n2. Observe a stray \"0\" next to \"Cart\".\n\nExpected: When the cart is empty, no badge (and no \"0\") is rendered; the badge only appears when there is at least one item.",
  "difficulty": "Medium",
  "order": 6,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Empty Cart Shows a Stray Zero</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport CartBadge from './CartBadge.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <CartBadge />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/CartBadge.tsx": {
      "file": {
        "contents": "import React from 'react'\n\nexport default function CartBadge({ itemCount = 0 }: { itemCount?: number }) {\n  return (\n    <div className=\"container\">\n      <span>Cart</span>\n      {/* BUG: when itemCount is 0, `0 && ...` evaluates to 0, which React\n          renders as a stray \"0\" instead of rendering nothing. */}\n      {itemCount && <span data-testid=\"badge\">{itemCount}</span>}\n    </div>\n  )\n}\n"
      }
    },
    "src/CartBadge.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen } from '@testing-library/react'\nimport { expect, test } from 'vitest'\nimport CartBadge from './CartBadge'\n\ntest('an empty cart renders no badge and no stray zero', () => {\n  render(<CartBadge itemCount={0} />)\n\n  expect(screen.queryByTestId('badge')).not.toBeInTheDocument()\n  // The \"0\" must not leak into the DOM.\n  expect(screen.queryByText('0')).not.toBeInTheDocument()\n})\n\ntest('a non-empty cart still shows the count', () => {\n  render(<CartBadge itemCount={3} />)\n  expect(screen.getByTestId('badge')).toHaveTextContent('3')\n})\n"
      }
    }
  }
};
