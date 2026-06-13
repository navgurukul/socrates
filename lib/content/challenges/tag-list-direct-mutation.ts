import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The tag removal function directly mutates the state array and then attempts to update state with the same mutated reference, preventing React from detecting a change and re-rendering.
export const tagListDirectMutationBattle: Battle = {
  "id": "tag-list-direct-mutation",
  "trackId": "frontend-debugging",
  "arcId": "js-logic-and-state",
  "title": "Tag List Fails to Update After Removal",
  "description": "## Bug Report: Tag List Update Failure\n\n**Severity:** Medium\n\n**Component:** `TagInput`\n\n**Context:** The `TagInput` component allows users to add new tags and remove existing ones from a list. When a tag is removed, the user interface does not consistently update to reflect the change, leaving the removed tag visible or displaying an incorrect state.\n\n**Reproduction Steps:**\n\n1.  Render the `TagInput` component.\n2.  In the input field, add the tag \"Apple\" and click \"Add\".\n3.  Add the tag \"Banana\" and click \"Add\".\n4.  Add the tag \"Orange\" and click \"Add\".\n5.  Verify that all three tags (\"Apple\", \"Banana\", \"Orange\") are visible in the tag list.\n6.  Click the 'x' (remove) button next to the \"Banana\" tag.\n7.  **Observe:** The \"Banana\" tag remains visible in the list, even though it should have been removed.",
  "difficulty": "Medium",
  "order": 7,
  "tech": [
    "react",
    "typescript"
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Tag List Fails to Update After Removal</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport TagInput from './TagInput.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <TagInput />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/TagInput.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react';\n\nconst TagInput: React.FC = () => {\n  const [tags, setTags] = useState<string[]>([]);\n  const [inputValue, setInputValue] = useState<string>('');\n\n  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {\n    setInputValue(event.target.value);\n  };\n\n  const handleAddTag = () => {\n    if (inputValue.trim() !== '' && !tags.includes(inputValue.trim())) {\n      setTags([...tags, inputValue.trim()]);\n      setInputValue('');\n    }\n  };\n\n  const handleRemoveTag = (indexToRemove: number) => {\n    tags.splice(indexToRemove, 1); // Bug: Mutates the original array\n    setTags(tags); // Bug: Sets state with the same reference, React doesn't re-render\n  };\n\n  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {\n    if (event.key === 'Enter') {\n      handleAddTag();\n    }\n  };\n\n  return (\n    <div>\n      <div style={{ display: 'flex', marginBottom: '10px' }}>\n        <input\n          type=\"text\"\n          value={inputValue}\n          onChange={handleInputChange}\n          onKeyDown={handleKeyDown}\n          placeholder=\"Add a tag...\"\n          aria-label=\"New tag input\"\n        />\n        <button onClick={handleAddTag}>Add</button>\n      </div>\n      <div style={{ border: '1px solid #ccc', padding: '10px', minHeight: '50px' }}>\n        {tags.length === 0 ? (\n          <p style={{ color: '#888' }}>No tags added yet.</p>\n        ) : (\n          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>\n            {tags.map((tag, index) => (\n              <li\n                key={tag + index}\n                style={{\n                  display: 'inline-block',\n                  backgroundColor: '#e0e0e0',\n                  padding: '5px 10px',\n                  margin: '0 5px 5px 0',\n                  borderRadius: '3px',\n                }}\n              >\n                {tag}\n                <button\n                  onClick={() => handleRemoveTag(index)}\n                  style={{\n                    marginLeft: '5px',\n                    backgroundColor: 'transparent',\n                    border: 'none',\n                    cursor: 'pointer',\n                    color: '#888',\n                  }}\n                  aria-label={`Remove tag ${tag}`}\n                >\n                  &times;\n                </button>\n              </li>\n            ))}\n          </ul>\n        )}\n      </div>\n    </div>\n  );\n};\n\nexport default TagInput;\n"
      }
    },
    "src/TagInput.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react';\nimport { describe, it, expect } from 'vitest';\nimport TagInput from './TagInput';\n\ndescribe('TagInput', () => {\n  it('allows adding and removing tags, and updates the display correctly', async () => {\n    render(<TagInput />);\n\n    const input = screen.getByLabelText('New tag input');\n    const addButton = screen.getByRole('button', { name: 'Add' });\n\n    // Add tags\n    fireEvent.change(input, { target: { value: 'Apple' } });\n    fireEvent.click(addButton);\n    fireEvent.change(input, { target: { value: 'Banana' } });\n    fireEvent.click(addButton);\n    fireEvent.change(input, { target: { value: 'Orange' } });\n    fireEvent.click(addButton);\n\n    // Assert initial state\n    expect(screen.getByText('Apple')).toBeInTheDocument();\n    expect(screen.getByText('Banana')).toBeInTheDocument();\n    expect(screen.getByText('Orange')).toBeInTheDocument();\n\n    // Remove 'Banana' tag\n    const removeBananaButton = screen.getByRole('button', { name: 'Remove tag Banana' });\n    fireEvent.click(removeBananaButton);\n\n    // Assert the display updates correctly\n    expect(screen.getByText('Apple')).toBeInTheDocument();\n    // This assertion will fail on the buggy code as 'Banana' will still be in the DOM\n    expect(screen.queryByText('Banana')).not.toBeInTheDocument();\n    expect(screen.getByText('Orange')).toBeInTheDocument();\n  });\n\n  it('clears the input field after adding a tag', async () => {\n    render(<TagInput />);\n    const input = screen.getByLabelText('New tag input');\n    const addButton = screen.getByRole('button', { name: 'Add' });\n\n    fireEvent.change(input, { target: { value: 'Test Tag' } });\n    expect(input).toHaveValue('Test Tag');\n\n    fireEvent.click(addButton);\n\n    expect(input).toHaveValue('');\n    expect(screen.getByText('Test Tag')).toBeInTheDocument();\n  });\n});"
      }
    }
  }
};
