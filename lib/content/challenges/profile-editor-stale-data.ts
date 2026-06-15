import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: The component's internal state for name and email is initialized once from props but does not re-synchronize when the `initialUser` prop changes, leading to stale UI.
export const profileEditorStaleDataBattle: Battle = {
  "id": "profile-editor-stale-data",
  "trackId": "frontend-debugging",
  "arcId": "react-and-components",
  "title": "Profile Editor Displays Stale Data After Prop Change",
  "description": "### Severity: Medium\n\n### Component: `UserProfileEditor`\n\n### Context\nThe `UserProfileEditor` component is used to display and allow editing of a user's profile information. It receives an `initialUser` object as a prop and provides input fields for the user's name and email, along with a save button.\n\n### Reproduction Steps\n1. Render the `UserProfileEditor` component with an `initialUser` prop, for example, `{ id: '1', name: 'Alice', email: 'alice@example.com' }`.\n2. Observe that the input fields correctly display \"Alice\" and \"alice@example.com\".\n3. Now, simulate a scenario where the *parent component* re-renders the `UserProfileEditor` component, but this time passing a *different* `initialUser` prop, such as `{ id: '2', name: 'Bob', email: 'bob@example.com' }`.\n4. **Expected:** The input fields should update to display \"Bob\" and \"bob@example.com\".\n5. **Actual:** The input fields continue to display the previous user's data (\"Alice\" and \"alice@example.com\"), even though a new `initialUser` prop was provided.",
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
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Profile Editor Displays Stale Data After Prop Change</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
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
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport UserProfileEditor from './UserProfileEditor.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <UserProfileEditor />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/UserProfileEditor.tsx": {
      "file": {
        "contents": "import React, { useState } from 'react';\n\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\ninterface UserProfileEditorProps {\n  initialUser: User;\n  onSave: (user: Omit<User, 'id'>) => void;\n}\n\nconst UserProfileEditor: React.FC<UserProfileEditorProps> = ({ initialUser, onSave }) => {\n  const [name, setName] = useState(initialUser.name);\n  const [email, setEmail] = useState(initialUser.email);\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    onSave({ name, email });\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <h2>Edit Profile</h2>\n      <div>\n        <label htmlFor=\"name\">Name:</label>\n        <input\n          id=\"name\"\n          type=\"text\"\n          value={name}\n          onChange={(e) => setName(e.target.value)}\n        />\n      </div>\n      <div>\n        <label htmlFor=\"email\">Email:</label>\n        <input\n          id=\"email\"\n          type=\"email\"\n          value={email}\n          onChange={(e) => setEmail(e.target.value)}\n        />\n      </div>\n      <button type=\"submit\">Save</button>\n      <button type=\"button\" onClick={() => { setName(initialUser.name); setEmail(initialUser.email); }}>Reset</button>\n    </form>\n  );\n};\n\nexport default UserProfileEditor;\n"
      }
    },
    "src/UserProfileEditor.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, fireEvent } from '@testing-library/react';\nimport { describe, it, expect, vi } from 'vitest';\nimport UserProfileEditor from './UserProfileEditor';\n\ndescribe('UserProfileEditor', () => {\n  const mockOnSave = vi.fn();\n\n  const user1 = { id: '1', name: 'Alice', email: 'alice@example.com' };\n  const user2 = { id: '2', name: 'Bob', email: 'bob@example.com' };\n  const user3 = { id: '3', name: 'Charlie', email: 'charlie@example.com' };\n\n  it('displays initial user data', () => {\n    render(<UserProfileEditor initialUser={user1} onSave={mockOnSave} />);\n\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice');\n    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');\n  });\n\n  it('updates input fields when initialUser prop changes', () => {\n    const { rerender } = render(<UserProfileEditor initialUser={user1} onSave={mockOnSave} />);\n\n    // Initially displays user1\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice');\n    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');\n\n    // Re-render with user2\n    rerender(<UserProfileEditor initialUser={user2} onSave={mockOnSave} />);\n\n    // Should now display user2's data\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Bob');\n    expect(screen.getByLabelText(/email/i)).toHaveValue('bob@example.com');\n\n    // Re-render with user3 to ensure it works multiple times\n    rerender(<UserProfileEditor initialUser={user3} onSave={mockOnSave} />);\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Charlie');\n    expect(screen.getByLabelText(/email/i)).toHaveValue('charlie@example.com');\n  });\n\n  it('allows editing and saving user data', async () => {\n    render(<UserProfileEditor initialUser={user1} onSave={mockOnSave} />);\n\n    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alicia' } });\n    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alicia@example.com' } });\n    fireEvent.click(screen.getByRole('button', { name: /save/i }));\n\n    expect(mockOnSave).toHaveBeenCalledWith({ name: 'Alicia', email: 'alicia@example.com' });\n  });\n\n  it('resets to initial user data', () => {\n    render(<UserProfileEditor initialUser={user1} onSave={mockOnSave} />);\n\n    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alicia' } });\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Alicia');\n\n    fireEvent.click(screen.getByRole('button', { name: /reset/i }));\n    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice');\n    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');\n  });\n});\n"
      }
    }
  }
};
