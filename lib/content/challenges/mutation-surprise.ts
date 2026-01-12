import { Battle } from "../types";

export const mutationSurpriseBattle: Battle = {
  id: "mutation-surprise",
  trackId: "frontend-debugging",
  arcId: "js-logic-and-state",
  title: "Undo Feature Corrupts History",
  description: `
# Bug Report: Undo Breaks After First Use

**Severity:** Critical  
**Component:** \`DrawingApp.tsx\`

## Context
Users report the undo feature only works once, then breaks. After clicking "Undo", all previous states become corrupted—they all show the same shape!

## Instructions
1. Run the **Preview**
2. Click "Add Red Circle", "Add Blue Square", "Add Green Triangle"
3. Click "Undo" once—notice it works correctly
4. Click "Undo" again—notice **all history shows the same shapes**!
5. **Right-click** → **Inspect** → **Console tab**
6. Add \`console.log(history)\` to debug the history array structure
7. This is an **immutability bug**—objects are mutated instead of copied
8. Fix it in \`src/DrawingApp.tsx\` using the spread operator
9. Run **Tests** to verify undo works correctly through multiple steps
  `,
  difficulty: "Hard",
  order: 6,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "mutation-surprise",
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
    <title>Drawing App</title>
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
import DrawingApp from './DrawingApp.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DrawingApp />
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
.drawing-app {
  max-width: 700px;
  margin: 0 auto;
}
h1 {
  margin: 0 0 1.5rem 0;
}
.controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: white;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-red {
  background: #dc2626;
}
.btn-red:hover:not(:disabled) {
  background: #b91c1c;
}
.btn-blue {
  background: #2563eb;
}
.btn-blue:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-green {
  background: #16a34a;
}
.btn-green:hover:not(:disabled) {
  background: #15803d;
}
.btn-undo {
  background: #71717a;
  margin-left: auto;
}
.btn-undo:hover:not(:disabled) {
  background: #52525b;
}
.canvas {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  min-height: 200px;
}
.canvas p {
  margin: 0 0 1rem 0;
  color: #71717a;
  font-size: 14px;
}
.canvas ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.canvas li {
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  background: #09090b;
  border-radius: 6px;
  border: 1px solid #27272a;
  font-size: 16px;
}
`,
      },
    },
    "src/DrawingApp.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

interface Shape {
  id: number;
  type: string;
  color: string;
}

export default function DrawingApp() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addShape = (type: string, color: string) => {
    const newShape: Shape = {
      id: Date.now(),
      type,
      color,
    };

    // BUG: Direct mutation of shapes array!
    shapes.push(newShape);
    setShapes(shapes);

    // BUG: Pushing reference to same array - all history points to same object!
    history.push(shapes);
    setHistory(history);
    setHistoryIndex(history.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setShapes(previousState);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const canUndo = historyIndex > 0;

  return (
    <div className="drawing-app">
      <h1>Drawing App with Undo</h1>
      <div className="controls">
        <button className="btn btn-red" onClick={() => addShape('circle', 'red')}>
          Add Red Circle
        </button>
        <button className="btn btn-blue" onClick={() => addShape('square', 'blue')}>
          Add Blue Square
        </button>
        <button className="btn btn-green" onClick={() => addShape('triangle', 'green')}>
          Add Green Triangle
        </button>
        <button 
          className="btn btn-undo" 
          onClick={undo} 
          disabled={!canUndo}
          data-testid="undo-btn"
        >
          ⟲ Undo
        </button>
      </div>
      <div className="canvas" data-testid="canvas">
        <p>Shapes: {shapes.length}</p>
        <ul>
          {shapes.map((shape) => (
            <li key={shape.id} style={{ color: shape.color }}>
              {shape.type}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}`,
      },
    },
    "src/DrawingApp.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import DrawingApp from './DrawingApp';

test('undo works correctly after multiple additions', () => {
  render(<DrawingApp />);
  
  const redBtn = screen.getByText(/add red circle/i);
  const blueBtn = screen.getByText(/add blue square/i);
  const greenBtn = screen.getByText(/add green triangle/i);
  const undoBtn = screen.getByTestId('undo-btn');
  
  // Add 3 shapes
  fireEvent.click(redBtn);
  fireEvent.click(blueBtn);
  fireEvent.click(greenBtn);
  
  expect(screen.getByText(/shapes: 3/i)).toBeDefined();
  
  // Undo once - should show 2 shapes
  fireEvent.click(undoBtn);
  expect(screen.getByText(/shapes: 2/i)).toBeDefined();
  
  // Undo again - should show 1 shape
  fireEvent.click(undoBtn);
  expect(screen.getByText(/shapes: 1/i)).toBeDefined();
  
  // Undo again - should show 0 shapes
  fireEvent.click(undoBtn);
  expect(screen.getByText(/shapes: 0/i)).toBeDefined();
});

test('history is not corrupted by mutations', () => {
  render(<DrawingApp />);
  
  const redBtn = screen.getByText(/add red circle/i);
  const blueBtn = screen.getByText(/add blue square/i);
  const undoBtn = screen.getByTestId('undo-btn');
  
  fireEvent.click(redBtn);
  fireEvent.click(blueBtn);
  
  // After undo, should show only red circle
  fireEvent.click(undoBtn);
  
  const canvas = screen.getByTestId('canvas');
  expect(canvas.textContent).toContain('circle');
  expect(canvas.textContent).not.toContain('square');
});

test('multiple undo steps preserve correct history', () => {
  render(<DrawingApp />);
  
  const redBtn = screen.getByText(/add red circle/i);
  const blueBtn = screen.getByText(/add blue square/i);
  const greenBtn = screen.getByText(/add green triangle/i);
  const undoBtn = screen.getByTestId('undo-btn');
  
  // Add shapes in sequence
  fireEvent.click(redBtn);
  fireEvent.click(blueBtn);
  fireEvent.click(greenBtn);
  
  // Undo twice
  fireEvent.click(undoBtn); // Remove triangle
  fireEvent.click(undoBtn); // Remove square
  
  const canvas = screen.getByTestId('canvas');
  
  // Should only show red circle
  expect(canvas.textContent).toContain('circle');
  expect(canvas.textContent).toContain('red');
  expect(canvas.textContent).not.toContain('square');
  expect(canvas.textContent).not.toContain('triangle');
});

test('undo button disabled when no history', () => {
  render(<DrawingApp />);
  
  const undoBtn = screen.getByTestId('undo-btn');
  
  // Should be disabled initially
  expect(undoBtn.hasAttribute('disabled')).toBe(true);
});`,
      },
    },
  },
};
