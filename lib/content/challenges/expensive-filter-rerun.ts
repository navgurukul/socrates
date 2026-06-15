import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: An expensive filtering operation is performed on every re-render of the component, even when its dependencies (products or filter term) have not changed, leading to unnecessary CPU cycles and performance degradation. The filtering logic is not memoized.
export const expensiveFilterRerunBattle: Battle = {
  "id": "expensive-filter-rerun",
  "trackId": "frontend-debugging",
  "arcId": "performance-and-memory",
  "title": "Expensive Filter Re-runs Unnecessarily",
  "description": "## Bug Report: Expensive Filter Re-runs Unnecessarily\n\n### Severity\nMedium - Performance Degradation\n\n### Component\n`FilteredProductList`\n\n### Context\nThe `FilteredProductList` component is responsible for displaying a list of products that match a user-provided filter term. The filtering logic involves iterating through a potentially large product list and performing string comparisons, which can be computationally intensive. This component is used in several parts of our e-commerce application.\n\n### Reproducibility\nAlways\n\n### Steps to Reproduce\n1. Navigate to any page that renders the `FilteredProductList` component (e.g., the product catalog).\n2. Observe the initial load time and responsiveness.\n3. Interact with other UI elements on the page (e.g., clicking a 'sort by' button, opening a unrelated modal, or any action that causes a parent component to re-render) without changing the filter text or the underlying product data.\n4. Notice a noticeable lag or reduced responsiveness in the application, even though the displayed products haven't changed and no new filtering criteria were provided.\n5. This issue is more pronounced with larger product datasets or on less powerful devices.",
  "difficulty": "Medium",
  "order": 2,
  "tech": [
    "react",
    "typescript",
    "vitest",
    "@testing-library/react"
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Expensive Filter Re-runs Unnecessarily</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport FilteredProductList from './FilteredProductList.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <FilteredProductList />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/FilteredProductList.tsx": {
      "file": {
        "contents": "import React from 'react';\n\ninterface Product {\n  id: number;\n  name: string;\n  description: string;\n  price: number;\n}\n\ninterface FilteredProductListProps {\n  products: Product[];\n  filterText: string;\n  triggerRender?: boolean; // Dummy prop to trigger re-renders from parent\n}\n\nconst FilteredProductList: React.FC<FilteredProductListProps> = ({ products, filterText, triggerRender }) => {\n  // Simulate an expensive filtering operation\n  // This operation currently runs on every render, even if products and filterText haven't changed.\n  console.count('Expensive filter calculation'); \n\n  const filteredProducts = products.filter(product => {\n    // Simulate a CPU-intensive check within the filter\n    for (let i = 0; i < 100000; i++) { /* busy-wait to simulate complexity */ }\n    return product.name.toLowerCase().includes(filterText.toLowerCase());\n  });\n\n  return (\n    <div>\n      <h2>Filtered Products</h2>\n      {/* This div is only for debugging re-renders in devtools, not part of actual component functionality */}\n      {triggerRender ? <div data-testid=\"rerender-indicator\">Parent triggered a re-render</div> : null}\n      {filteredProducts.length === 0 ? (\n        <p>No products found matching \"{filterText}\".</p>\n      ) : (\n        <ul>\n          {filteredProducts.map(product => (\n            <li key={product.id}>\n              <h3>{product.name}</h3>\n              <p>{product.description}</p>\n              <p>${product.price.toFixed(2)}</p>\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n};\n\nexport default FilteredProductList;\n"
      }
    },
    "src/FilteredProductList.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import React, { useState } from 'react';\nimport { render, screen, cleanup, fireEvent } from '@testing-library/react';\nimport { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\nimport FilteredProductList from './FilteredProductList';\n\ninterface Product {\n  id: number;\n  name: string;\n  description: string;\n  price: number;\n}\n\nconst mockProducts: Product[] = [\n  { id: 1, name: 'Laptop Pro', description: 'Powerful laptop', price: 1200.00 },\n  { id: 2, name: 'Wireless Mouse', description: 'Ergonomic mouse', price: 25.00 },\n  { id: 3, name: 'USB Keyboard', description: 'Mechanical keyboard', price: 75.00 },\n  { id: 4, name: 'Gaming Monitor', description: 'High refresh rate monitor', price: 300.00 },\n];\n\ndescribe('FilteredProductList', () => {\n  let consoleCountSpy: vi.SpyInstance;\n\n  beforeEach(() => {\n    // Mock console.count to track calls without outputting to console during tests\n    consoleCountSpy = vi.spyOn(console, 'count').mockImplementation(() => {});\n  });\n\n  afterEach(() => {\n    cleanup();\n    consoleCountSpy.mockRestore(); // Restore original console.count after each test\n  });\n\n  // Helper component to simulate parent re-renders and pass props to FilteredProductList\n  const TestWrapper: React.FC<{ initialFilter: string }> = ({ initialFilter }) => {\n    const [filter, setFilter] = useState(initialFilter);\n    const [dummyState, setDummyState] = useState(0);\n\n    const handleFilterChange = (newFilter: string) => setFilter(newFilter);\n    const triggerRerender = () => setDummyState(prev => prev + 1);\n\n    return (\n      <div>\n        <input\n          data-testid=\"filter-input\"\n          value={filter}\n          onChange={(e) => handleFilterChange(e.target.value)}\n        />\n        <button onClick={triggerRerender} data-testid=\"rerender-button\">Trigger Parent Rerender</button>\n        <FilteredProductList products={mockProducts} filterText={filter} triggerRender={dummyState > 0} />\n      </div>\n    );\n  };\n\n  it('should perform expensive filter calculation only when filterText or products change', () => {\n    // 1. Initial render\n    render(<TestWrapper initialFilter=\"pro\" />);\n\n    // Expect filter calculation to run once on initial render\n    expect(consoleCountSpy).toHaveBeenCalledTimes(1);\n    expect(screen.getByText('Laptop Pro')).toBeInTheDocument();\n    expect(screen.queryByText('Wireless Mouse')).not.toBeInTheDocument();\n\n    // 2. Trigger a parent re-render *without* changing filterText or products\n    const rerenderButton = screen.getByTestId('rerender-button');\n    fireEvent.click(rerenderButton);\n\n    // Assert that the filter calculation was NOT re-executed (fixed behavior)\n    // In the buggy version, this count would be 2.\n    expect(consoleCountSpy).toHaveBeenCalledTimes(1);\n\n    // 3. Change the filter text\n    const filterInput = screen.getByTestId('filter-input');\n    fireEvent.change(filterInput, { target: { value: 'mouse' } });\n\n    // Expect filter calculation to run again because filterText changed\n    // In the fixed version, this count would be 2 (1 from initial, 1 from filter change).\n    // In the buggy version, this count would be 3 (1 initial, 1 from dummy rerender, 1 from filter change).\n    expect(consoleCountSpy).toHaveBeenCalledTimes(2);\n    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();\n    expect(screen.queryByText('Laptop Pro')).not.toBeInTheDocument();\n\n    // Ensure the rerender indicator appears, confirming a parent re-render happened\n    expect(screen.getByTestId('rerender-indicator')).toBeInTheDocument();\n  });\n\n  it('should display \"No products found matching \\\"xyz\\\".\" when filter yields no results', () => {\n    render(<TestWrapper initialFilter=\"xyz\" />);\n    expect(screen.getByText('No products found matching \"xyz\".')).toBeInTheDocument();\n    expect(consoleCountSpy).toHaveBeenCalledTimes(1);\n  });\n});\n"
      }
    }
  }
};
