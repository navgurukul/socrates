import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: An event handler function passed as a prop to a React.memo-ized child component is recreated on every parent re-render, causing the child components to re-render unnecessarily due to prop instability, negating the performance benefits of React.memo.
export const callbackPropInvalidationBattle: Battle = {
  "id": "callback-prop-invalidation",
  "trackId": "frontend-debugging",
  "arcId": "performance-and-memory",
  "title": "Memoized Children Re-render Due to Unstable Callback Prop",
  "description": "## Bug Report: Memoized Children Re-render Due to Unstable Callback Prop\n\n### Severity\nMedium\n\n### Component\n`ItemList`\n\n### Context\nThe `ItemList` component displays a list of `Item` components, where each `Item` is memoized using `React.memo` to prevent unnecessary re-renders. The parent `ItemList` component also includes a button to explicitly force its own re-render for debugging and performance testing purposes.\n\n### Reproduce\n1.  **Open the application** displaying the `ItemList` component.\n2.  **Open your browser's developer console** and observe the initial logs. You should see \"Rendering Item X - [Item Name]\" for each item, indicating their initial render.\n3.  **Click the \"Force Parent Re-render\" button.**\n4.  **Observe the console logs again.** You will notice that all \"Rendering Item X - [Item Name]\" messages reappear, indicating that every memoized `Item` component has re-rendered, despite their individual `id`, `name`, and `isSelected` props remaining unchanged. This behavior negates the performance benefits of `React.memo` for the child components.\n",
  "difficulty": "Medium",
  "order": 3,
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Memoized Children Re-render Due to Unstable Callback Prop</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport ItemList from './ItemList.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <ItemList />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/ItemList.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react';\n\ninterface ItemProps {\n  id: number;\n  name: string;\n  isSelected: boolean;\n  onSelect: (id: number) => void;\n}\n\nconst Item: React.FC<ItemProps> = React.memo(({ id, name, isSelected, onSelect }) => {\n  console.log(`Rendering Item ${id} - ${name}`);\n  return (\n    <div style={{ padding: '8px', border: '1px solid gray', margin: '4px', backgroundColor: isSelected ? '#e0f7fa' : 'white' }}>\n      <span>{name}</span>\n      <button onClick={() => onSelect(id)} style={{ marginLeft: '10px' }}>\n        {isSelected ? 'Deselect' : 'Select'}\n      </button>\n    </div>\n  );\n});\n\ninterface ItemData {\n  id: number;\n  name: string;\n}\n\nconst initialItems: ItemData[] = [\n  { id: 1, name: 'Apple' },\n  { id: 2, name: 'Banana' },\n  { id: 3, name: 'Cherry' }\n];\n\nconst ItemList: React.FC = () => {\n  const [items] = useState(initialItems);\n  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());\n  const [renderCount, setRenderCount] = useState(0);\n\n  // BUG: This function is recreated on every render of ItemList\n  const handleSelectItem = (id: number) => {\n    setSelectedItemIds(prev => {\n      const newSet = new Set(prev);\n      if (newSet.has(id)) {\n        newSet.delete(id);\n      } else {\n        newSet.add(id);\n      }\n      return newSet;\n    });\n  };\n\n  const forceRerender = () => {\n    setRenderCount(prev => prev + 1);\n  };\n\n  return (\n    <div>\n      <h1>Item List (Render Count: {renderCount})</h1>\n      <button onClick={forceRerender}>Force Parent Re-render</button>\n      {items.map(item => (\n        <Item\n          key={item.id}\n          id={item.id}\n          name={item.name}\n          isSelected={selectedItemIds.has(item.id)}\n          onSelect={handleSelectItem}\n        />\n      ))}\n    </div>\n  );\n};\n\nexport default ItemList;\n"
      }
    },
    "src/ItemList.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react';\nimport { describe, it, expect, vi } from 'vitest';\nimport ItemList from './ItemList';\n\ndescribe('ItemList performance', () => {\n  it('should not re-render memoized child components unnecessarily when parent re-renders without prop changes', () => {\n    // Spy on console.log to detect re-renders of the Item component\n    const consoleSpy = vi.spyOn(console, 'log');\n\n    render(<ItemList />);\n\n    // Initially, all items should render once\n    expect(consoleSpy).toHaveBeenCalledWith('Rendering Item 1 - Apple');\n    expect(consoleSpy).toHaveBeenCalledWith('Rendering Item 2 - Banana');\n    expect(consoleSpy).toHaveBeenCalledWith('Rendering Item 3 - Cherry');\n    expect(consoleSpy).toHaveBeenCalledTimes(3); // Initial render of 3 items\n\n    consoleSpy.mockClear(); // Clear previous calls to focus on subsequent renders\n\n    // Force a re-render of the parent component (ItemList) without affecting item data\n    const forceRerenderButton = screen.getByText('Force Parent Re-render');\n    fireEvent.click(forceRerenderButton);\n\n    // Assertion: No additional Item components should re-render if the callback is stable.\n    // If the bug is present, all 3 items will re-render, leading to 3 more calls to console.log.\n    expect(consoleSpy).not.toHaveBeenCalled(); // This assertion fails with the bug, passes with the fix.\n\n    consoleSpy.mockRestore(); // Clean up the spy\n  });\n\n  it('should re-render only the relevant item when its selection status changes', () => {\n    const consoleSpy = vi.spyOn(console, 'log');\n\n    render(<ItemList />);\n\n    consoleSpy.mockClear();\n\n    // Find the 'Select' button specifically for 'Apple'\n    const appleItemDiv = screen.getByText('Apple').closest('div');\n    const appleSelectButton = appleItemDiv?.querySelector('button');\n    expect(appleSelectButton).toBeInTheDocument();\n\n    fireEvent.click(appleSelectButton!); // Click to select Apple\n\n    // Only the Apple item should have re-rendered (from unselected to selected)\n    expect(consoleSpy).toHaveBeenCalledWith('Rendering Item 1 - Apple');\n    expect(consoleSpy).toHaveBeenCalledTimes(1); // Only one item should have re-rendered\n\n    consoleSpy.mockRestore();\n  });\n});\n"
      }
    }
  }
};
