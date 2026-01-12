import { Battle } from "../types";

export const filterNotWorkingBattle: Battle = {
  id: "filter-not-working",
  trackId: "frontend-debugging",
  arcId: "js-logic-and-state",
  title: "Filter Not Working",
  description: `
# Bug Report: Search Filter Shows All Results

**Severity:** Medium  
**Component:** \`ProductList.tsx\`

## Context
Users report that the search filter doesn't work—typing in the search box shows all products regardless of the search term.

## Instructions
1. Run the **Preview** and observe all products displayed
2. Type "macbook" in the search box (notice all products still show)
3. **Right-click** → **Inspect** → Open **Console tab**
4. Add \`console.log\` to debug the filter callback return value
5. Fix the filter logic in \`src/ProductList.tsx\`
6. Run **Tests** to verify filtering works correctly
  `,
  difficulty: "Easy",
  order: 3,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "filter-not-working",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview",
              test: "vitest run",
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.15",
              "@types/react-dom": "^18.2.7",
              "@vitejs/plugin-react": "^4.0.3",
              vite: "^4.4.5",
              vitest: "^0.34.1",
              jsdom: "^22.1.0",
              "@testing-library/react": "^14.0.0",
            },
          },
          null,
          2
        ),
      },
    },
    "index.html": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Product List</title>
    <style>body { background-color: #09090b; color: white; margin: 0; font-family: system-ui; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
    },
    "vite.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
      },
    },
    "vitest.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
  },
})`,
      },
    },
    "src/main.tsx": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import ProductList from './ProductList.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProductList />
  </React.StrictMode>,
)`,
      },
    },
    "src/index.css": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `
body { 
  font-family: system-ui; 
  padding: 2rem;
  margin: 0;
}
.container {
  max-width: 600px;
  margin: 0 auto;
}
h1 {
  margin: 0 0 1.5rem 0;
}
.search-box {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #18181b;
  border-radius: 8px;
  border: 1px solid #27272a;
}
.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #27272a;
  border-radius: 4px;
  background: #09090b;
  color: white;
  font-size: 16px;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
}
.results-count {
  margin: 0;
  color: #71717a;
  font-size: 14px;
}
.product-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.product-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  background: #18181b;
  border-radius: 6px;
  border: 1px solid #27272a;
}
.product-list strong {
  font-size: 16px;
}
.category {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 2px 8px;
  background: #27272a;
  border-radius: 4px;
  font-size: 12px;
  color: #a1a1aa;
}
.price {
  font-size: 18px;
  font-weight: bold;
  color: #3b82f6;
}
`,
      },
    },
    "src/ProductList.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'MacBook Pro', category: 'Laptop', price: 1999 },
  { id: 2, name: 'Magic Mouse', category: 'Accessories', price: 79 },
  { id: 3, name: 'Dell XPS 15', category: 'Laptop', price: 1499 },
  { id: 4, name: 'USB-C Cable', category: 'Accessories', price: 19 },
  { id: 5, name: 'ThinkPad X1', category: 'Laptop', price: 1299 },
];

export default function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');

  // BUG: Filter callback doesn't return the boolean result
  const filteredProducts = PRODUCTS.filter((product) => {
    product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container">
      <h1>Product Catalog</h1>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <p className="results-count">{filteredProducts.length} results</p>
      </div>
      <ul className="product-list">
        {filteredProducts.map((product) => (
          <li key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <span className="category">{product.category}</span>
            </div>
            <span className="price">\${product.price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      },
    },
    "src/ProductList.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import ProductList from './ProductList';

test('shows all products initially', () => {
  render(<ProductList />);
  expect(screen.getByText(/5 results/i)).toBeDefined();
});

test('filters products by search term', () => {
  render(<ProductList />);
  
  const input = screen.getByPlaceholderText(/search products/i);
  
  fireEvent.change(input, { target: { value: 'macbook' } });
  
  expect(screen.getByText(/1 result/i)).toBeDefined();
  expect(screen.getByText(/MacBook Pro/i)).toBeDefined();
});

test('filters are case-insensitive', () => {
  render(<ProductList />);
  
  const input = screen.getByPlaceholderText(/search products/i);
  
  fireEvent.change(input, { target: { value: 'MOUSE' } });
  
  expect(screen.getByText(/1 result/i)).toBeDefined();
  expect(screen.getByText(/Magic Mouse/i)).toBeDefined();
});

test('shows no results for non-matching search', () => {
  render(<ProductList />);
  
  const input = screen.getByPlaceholderText(/search products/i);
  
  fireEvent.change(input, { target: { value: 'xyz123' } });
  
  expect(screen.getByText(/0 results/i)).toBeDefined();
});

test('shows multiple matching results', () => {
  render(<ProductList />);
  
  const input = screen.getByPlaceholderText(/search products/i);
  
  // Should match "Dell XPS 15" and "ThinkPad X1" (both contain "X")
  fireEvent.change(input, { target: { value: 'x' } });
  
  expect(screen.getByText(/2 results/i)).toBeDefined();
});`,
      },
    },
  },
};
