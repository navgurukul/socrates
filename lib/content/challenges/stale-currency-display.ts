import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: A React component stores a formatted string derived from props in local state using `useState`, but the state's initializer is only run once, causing the derived value to become stale when relevant props change.
export const staleCurrencyDisplayBattle: Battle = {
  "id": "stale-currency-display",
  "trackId": "frontend-debugging",
  "arcId": "react-and-components",
  "title": "Price Formatter Displays Stale Currency",
  "description": "## Bug Report: Stale Currency Display\n\n**Severity**: Medium\n\n**Component**: `PriceFormatter`\n\n**Context**: The `PriceFormatter` component is designed to display a numeric value formatted as a currency. It accepts a `value` (number) and a `currency` (string, e.g., \"USD\", \"EUR\") prop. The expectation is that the displayed currency symbol and formatting will update whenever the `currency` prop changes.\n\n**Reproduction Steps**:\n1.  Render the `PriceFormatter` component with `value={100}` and `currency=\"USD\"`.\n    *   **Observe**: The component correctly displays \"$100.00\".\n2.  Update the props of the *same instance* of `PriceFormatter` to `value={100}` and `currency=\"EUR\"`.\n    *   **Expected**: The component should now display \"€100.00\".\n    *   **Actual**: The component continues to display \"$100.00\", ignoring the change in the `currency` prop.",
  "difficulty": "Medium",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Price Formatter Displays Stale Currency</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport PriceFormatter from './PriceFormatter.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <PriceFormatter />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/PriceFormatter.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react';\n\ninterface PriceFormatterProps {\n  value: number;\n  currency: string; // e.g., \"USD\", \"EUR\"\n}\n\nconst PriceFormatter: React.FC<PriceFormatterProps> = ({ value, currency }) => {\n  // Bug: formattedPrice is initialized once and never updated when currency prop changes.\n  // The `currency` value captured here is from the initial render.\n  const [formattedPrice] = useState(() => {\n    // Hardcoding locale 'en-US' for consistency.\n    return new Intl.NumberFormat('en-US', {\n      style: 'currency',\n      currency: currency,\n    }).format(value);\n  });\n\n  return (\n    <div data-testid=\"price-display\">\n      {formattedPrice}\n    </div>\n  );\n};\n\nexport default PriceFormatter;\n"
      }
    },
    "src/PriceFormatter.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen } from '@testing-library/react';\nimport { expect, test, describe } from 'vitest';\nimport PriceFormatter from './PriceFormatter';\n\ndescribe('PriceFormatter', () => {\n  test('should display initial price with correct currency', () => {\n    render(<PriceFormatter value={100} currency=\"USD\" />);\n    expect(screen.getByTestId('price-display')).toHaveTextContent('$100.00');\n  });\n\n  test('should update price display when currency prop changes', () => {\n    const { rerender } = render(<PriceFormatter value={100} currency=\"USD\" />);\n    expect(screen.getByTestId('price-display')).toHaveTextContent('$100.00');\n\n    // Rerender with new currency\n    rerender(<PriceFormatter value={100} currency=\"EUR\" />);\n\n    // Check for Euro symbol and value. Using regex for flexibility with potential non-breaking spaces.\n    expect(screen.getByTestId('price-display')).toHaveTextContent(/€100\\.00/);\n  });\n\n  test('should update price display when value prop changes', () => {\n    const { rerender } = render(<PriceFormatter value={50} currency=\"GBP\" />);\n    expect(screen.getByTestId('price-display')).toHaveTextContent('£50.00');\n\n    rerender(<PriceFormatter value={150} currency=\"GBP\" />);\n    expect(screen.getByTestId('price-display')).toHaveTextContent('£150.00');\n  });\n});\n"
      }
    }
  }
};
