import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The component's filtering logic incorrectly filters the currently displayed list of products instead of always filtering the original, full list of products, leading to incorrect results after the first filter application.
export const galleryFilterLogicBattle: Battle = {
  "id": "gallery-filter-logic",
  "trackId": "frontend-debugging",
  "arcId": "js-logic-and-state",
  "title": "Product Gallery Filter Logic Issue",
  "description": "## Bug Report: Product Gallery Filter Logic Issue\n\n**Severity**: Medium\n\n**Component**: `ProductGallery`\n\n**Context**: The `ProductGallery` component is designed to display a list of products and allow users to filter them by category using a dropdown selector. The component is expected to show all products initially and then correctly update the displayed list based on the selected category.\n\n**Reproduction Steps**:\n\n1.  Navigate to a page displaying the `ProductGallery` component.\n2.  Observe that all products are initially displayed correctly.\n3.  Use the category dropdown to select a specific category, for example, \"Electronics\". Verify that only products belonging to the \"Electronics\" category are displayed.\n4.  Now, use the category dropdown again to select a *different* category, for example, \"Books\".\n5.  **Expected Result**: Only products belonging to the \"Books\" category should be displayed.\n6.  **Actual Result**: The gallery displays an empty list or an incorrect subset of products, often appearing empty if there are no products from the newly selected category that were also present in the *previously* filtered list.",
  "difficulty": "Medium",
  "order": 8,
  "tech": [
    "react",
    "typescript",
    "vitest"
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Product Gallery Filter Logic Issue</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport ProductGallery from './ProductGallery.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <ProductGallery />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/ProductGallery.tsx": {
      "file": {
        "contents": "import React from 'react';\n\ninterface Product {\n  id: string;\n  name: string;\n  category: string;\n}\n\ninterface ProductGalleryProps {\n  products: Product[];\n}\n\nconst ProductGallery: React.FC<ProductGalleryProps> = ({ products }) => {\n  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');\n  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>(products);\n\n  React.useEffect(() => {\n    if (selectedCategory === 'All') {\n      setDisplayedProducts(products);\n    } else {\n      // BUG: This filters 'displayedProducts' instead of the original 'products' prop\n      const newFiltered = displayedProducts.filter(p => p.category === selectedCategory);\n      setDisplayedProducts(newFiltered);\n    }\n  }, [selectedCategory, products]);\n\n  const categories = React.useMemo(\n    () => ['All', ...new Set(products.map(p => p.category))],\n    [products]\n  );\n\n  return (\n    <div>\n      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>\n        {categories.map(category => (\n          <option key={category} value={category}>{category}</option>\n        ))}\n      </select>\n      <ul>\n        {displayedProducts.length > 0 ? (\n          displayedProducts.map(product => (\n            <li key={product.id}>{product.name} ({product.category})</li>\n          ))\n        ) : (\n          <li>No products found for this category.</li>\n        )}\n      </ul>\n    </div>\n  );\n};\n\nexport default ProductGallery;"
      }
    },
    "src/ProductGallery.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent, within } from '@testing-library/react';\nimport { describe, it, expect } from 'vitest';\nimport ProductGallery from './ProductGallery';\n\ndescribe('ProductGallery', () => {\n  const mockProducts = [\n    { id: '1', name: 'Laptop', category: 'Electronics' },\n    { id: '2', name: 'Mouse', category: 'Electronics' },\n    { id: '3', name: 'The Great Gatsby', category: 'Books' },\n    { id: '4', name: '1984', category: 'Books' },\n    { id: '5', name: 'T-Shirt', category: 'Apparel' },\n  ];\n\n  it('should display all products initially', () => {\n    render(<ProductGallery products={mockProducts} />);\n\n    expect(screen.getByText('Laptop (Electronics)')).toBeInTheDocument();\n    expect(screen.getByText('The Great Gatsby (Books)')).toBeInTheDocument();\n    expect(screen.getByText('T-Shirt (Apparel)')).toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(5);\n  });\n\n  it('should filter products by category correctly', () => {\n    render(<ProductGallery products={mockProducts} />);\n\n    const select = screen.getByRole('combobox');\n    fireEvent.change(select, { target: { value: 'Electronics' } });\n\n    expect(screen.getByText('Laptop (Electronics)')).toBeInTheDocument();\n    expect(screen.getByText('Mouse (Electronics)')).toBeInTheDocument();\n    expect(screen.queryByText('The Great Gatsby (Books)')).not.toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(2);\n  });\n\n  it('should correctly re-filter when changing categories multiple times', () => {\n    render(<ProductGallery products={mockProducts} />);\n\n    const select = screen.getByRole('combobox');\n\n    // Filter by Electronics first\n    fireEvent.change(select, { target: { value: 'Electronics' } });\n    expect(screen.getByText('Laptop (Electronics)')).toBeInTheDocument();\n    expect(screen.getByText('Mouse (Electronics)')).toBeInTheDocument();\n    expect(screen.queryByText('The Great Gatsby (Books)')).not.toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(2);\n\n    // Now re-filter by Books\n    fireEvent.change(select, { target: { value: 'Books' } });\n\n    // Expect only Books products to be displayed\n    expect(screen.queryByText('Laptop (Electronics)')).not.toBeInTheDocument();\n    expect(screen.queryByText('Mouse (Electronics)')).not.toBeInTheDocument();\n    expect(screen.getByText('The Great Gatsby (Books)')).toBeInTheDocument();\n    expect(screen.getByText('1984 (Books)')).toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(2);\n  });\n\n  it('should display all products when \"All\" category is selected after filtering', () => {\n    render(<ProductGallery products={mockProducts} />);\n\n    const select = screen.getByRole('combobox');\n\n    // Filter by Apparel\n    fireEvent.change(select, { target: { value: 'Apparel' } });\n    expect(screen.getByText('T-Shirt (Apparel)')).toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(1);\n\n    // Select \"All\" again\n    fireEvent.change(select, { target: { value: 'All' } });\n\n    // Expect all products to be displayed again\n    expect(screen.getByText('Laptop (Electronics)')).toBeInTheDocument();\n    expect(screen.getByText('The Great Gatsby (Books)')).toBeInTheDocument();\n    expect(screen.getByText('T-Shirt (Apparel)')).toBeInTheDocument();\n    expect(screen.getAllByRole('listitem')).toHaveLength(5);\n  });\n\n  it('should display \"No products found\" message if no products match the filter', () => {\n    render(<ProductGallery products={mockProducts} />);\n\n    const select = screen.getByRole('combobox');\n    fireEvent.change(select, { target: { value: 'NonExistentCategory' } });\n\n    expect(screen.getByText('No products found for this category.')).toBeInTheDocument();\n    expect(screen.queryAllByRole('listitem')).toHaveLength(1);\n  });\n});"
      }
    }
  }
};
