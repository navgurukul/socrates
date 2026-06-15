import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Using array index as `key` for list items, causing incorrect component reuse after filtering/reordering, leading to state bleed.
export const productListKeyIssueBattle: Battle = {
  "id": "product-list-key-issue",
  "trackId": "frontend-debugging",
  "arcId": "react-and-components",
  "title": "Product List Items Lose State On Filter",
  "description": "## Bug Report: Product List Items Lose State On Filter\n\n**Severity**: Medium\n\n**Component**: `ProductList`\n\n**Context**: On an e-commerce product listing page, users can filter products by a search term. Each product item has an \"Add to Cart\" button that changes its text to \"Added!\" and becomes disabled after being clicked.\n\n**Description**:\nWhen a user adds an item to their cart and then filters the list, other products that were not added to the cart incorrectly display the \"Added!\" state. This suggests that the internal state of `ProductItem` components is being incorrectly reused across different products after a filter operation.\n\n**Reproduction Steps**:\n1. Navigate to the product listing page (e.g., `/products`).\n2. Observe the list of products, each with an \"Add to Cart\" button.\n3. Click the \"Add to Cart\" button for the first product displayed (e.g., \"Apple\"). The button text should change to \"Added!\" and become disabled.\n4. In the search bar, type a term that filters the list to display a product that was *not* the first product initially (e.g., type \"cherry\").\n5. Observe the displayed \"Cherry\" product. It will incorrectly show \"Added!\" on its button, even though it was never clicked.\n6. Clear the search term. The original list will reappear, and the state of some items might be unexpectedly reset or transferred.",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Product List Items Lose State On Filter</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport ProductList from './ProductList.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <ProductList />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/ProductList.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react';\n\ninterface Product {\n  id: number;\n  name: string;\n}\n\ninterface ProductItemProps {\n  product: Product;\n}\n\nconst ProductItem: React.FC<ProductItemProps> = ({ product }) => {\n  const [addedToCart, setAddedToCart] = useState(false);\n\n  const handleAddToCart = () => {\n    setAddedToCart(true);\n  };\n\n  return (\n    <div data-testid={`product-item-${product.id}`}>\n      <h3>{product.name}</h3>\n      <button onClick={handleAddToCart} disabled={addedToCart}>\n        {addedToCart ? 'Added!' : 'Add to Cart'}\n      </button>\n    </div>\n  );\n};\n\ninterface ProductListProps {\n  products: Product[];\n}\n\nconst ProductList: React.FC<ProductListProps> = ({ products }) => {\n  const [searchTerm, setSearchTerm] = useState('');\n\n  const filteredProducts = products.filter(product =>\n    product.name.toLowerCase().includes(searchTerm.toLowerCase())\n  );\n\n  return (\n    <div>\n      <input\n        type=\"text\"\n        placeholder=\"Search products...\"\n        value={searchTerm}\n        onChange={(e) => setSearchTerm(e.target.value)}\n      />\n      <div data-testid=\"product-list\">\n        {filteredProducts.map((product, index) => (\n          <ProductItem key={index} product={product} />\n        ))}\n      </div>\n    </div>\n  );\n};\n\nexport default ProductList;"
      }
    },
    "src/ProductList.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react';\nimport { describe, it, expect } from 'vitest';\nimport ProductList from './ProductList';\n\ndescribe('ProductList', () => {\n  const initialProducts = [\n    { id: 1, name: 'Apple' },\n    { id: 2, name: 'Banana' },\n    { id: 3, name: 'Cherry' }\n  ];\n\n  it('maintains product item state correctly when filtering', async () => {\n    render(<ProductList products={initialProducts} />);\n\n    // 1. Find and click \"Add to Cart\" for Apple (product ID 1)\n    const appleAddToCartButton = screen.getByTestId('product-item-1').querySelector('button');\n    expect(appleAddToCartButton).toHaveTextContent('Add to Cart');\n    fireEvent.click(appleAddToCartButton!); // Click to add Apple to cart\n    expect(appleAddToCartButton).toHaveTextContent('Added!');\n\n    // 2. Search for \"cherry\" which will reorder and filter the list\n    const searchInput = screen.getByPlaceholderText('Search products...');\n    fireEvent.change(searchInput, { target: { value: 'cherry' } });\n\n    // 3. Verify that only Cherry is visible\n    expect(screen.queryByText('Apple')).not.toBeInTheDocument();\n    expect(screen.queryByText('Banana')).not.toBeInTheDocument();\n    expect(screen.getByText('Cherry')).toBeInTheDocument();\n\n    // 4. Crucial assertion: The Cherry item (product ID 3) should NOT have the \"Added!\" state\n    // because it was never clicked. With the bug (key={index}), Cherry (now at index 0) will\n    // incorrectly inherit the state of Apple (which was at index 0 initially and clicked).\n    const cherryItemButton = screen.getByTestId('product-item-3').querySelector('button');\n    expect(cherryItemButton).toBeInTheDocument();\n    // This assertion should FAIL on the buggy version (because it will show 'Added!')\n    // and PASS on the fixed version (because it will show 'Add to Cart').\n    expect(cherryItemButton).toHaveTextContent('Add to Cart');\n  });\n});"
      }
    }
  }
};
