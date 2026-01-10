import { Battle } from "../types";

export const listRenderingBattle: Battle = {
  id: "list-rendering-mismatch",
  trackId: "frontend-debugging",
  arcId: "react-and-components",
  title: "List Rendering Mismatch",
  description: `
# Bug Report: List Items Duplicating

**Severity:** Medium  
**Component:** \`TodoList.tsx\`

## Context
When users add new items to the todo list, sometimes the list shows duplicate items or items appear in the wrong order after editing.

## Instructions
1. Run the **Preview**.
2. Add a few todo items. Notice React warnings in the console.
3. Try editing or deleting items. Notice unexpected behavior.
4. Fix the bug in \`src/TodoList.tsx\`.
5. Run Tests to verify.
  `,
  difficulty: "Easy",
  order: 2,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "list-rendering-challenge",
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
    <title>List Rendering Bug</title>
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
import TodoList from './TodoList.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TodoList />
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
}
.todo-container {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  width: 100%;
  max-width: 400px;
}
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #27272a;
}
.btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn:hover { background: #2563eb; }
.btn-delete {
  background: #dc2626;
  padding: 4px 12px;
}
.btn-delete:hover { background: #b91c1c; }
input {
  padding: 8px;
  border: 1px solid #27272a;
  border-radius: 4px;
  background: #09090b;
  color: white;
  flex: 1;
  margin-right: 8px;
}
`,
      },
    },
    "src/TodoList.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

interface Todo {
  text: string;
  completed: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { text: 'Buy groceries', completed: false },
    { text: 'Walk the dog', completed: false },
  ]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { text: input, completed: false }]);
      setInput('');
    }
  };

  const deleteTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div className="todo-container">
      <h1>Todo List</h1>
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button className="btn" onClick={addTodo}>Add</button>
      </div>
      <div data-testid="todo-list">
        {todos.map((todo, index) => (
          <div className="todo-item" key={index}>
            <span>{todo.text}</span>
            <button className="btn btn-delete" onClick={() => deleteTodo(index)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      },
    },
    "src/TodoList.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import TodoList from './TodoList';

test('renders todo list without console warnings', () => {
  const consoleSpy = vi.spyOn(console, 'error');
  render(<TodoList />);
  
  // Should not have React key warnings
  expect(consoleSpy).not.toHaveBeenCalledWith(
    expect.stringContaining('Each child in a list should have a unique "key"')
  );
  
  consoleSpy.mockRestore();
});

test('maintains correct order when deleting items', () => {
  render(<TodoList />);
  
  const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
  
  // Delete first item
  fireEvent.click(deleteButtons[0]);
  
  const items = screen.getAllByText(/groceries|dog/);
  expect(items[0].textContent).toBe('Walk the dog');
});`,
      },
    },
  },
};
