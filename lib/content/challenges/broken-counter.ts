import { Battle } from "../types";

export const brokenCounterBattle: Battle = {
  id: "broken-counter",
  trackId: "frontend-debugging",
  arcId: "debugging-foundations",
  title: "Broken Counter UI",
  description: `
# Bug Report: Counter Not Incrementing

**Severity:** Low  
**Component:** \`Counter.tsx\`

## Context
The counter button should increment the count when clicked, but nothing happens.

## Instructions
1. Run the **Preview** to see the issue.
2. Click the "Increment" button. Notice the count doesn't change.
3. Fix the bug in \`src/Counter.tsx\`.
4. Run Tests to verify.
  `,
  difficulty: "Easy",
  order: 1,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "broken-counter-challenge",
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
    <title>Broken Counter</title>
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
import Counter from './Counter.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Counter />
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
}
.counter-container {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  text-align: center;
  min-width: 300px;
}
.count-display {
  font-size: 3rem;
  font-weight: bold;
  margin: 1rem 0;
  color: #3b82f6;
}
.btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}
.btn:hover { background: #2563eb; }
`,
      },
    },
    "src/Counter.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export default function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue);

  const handleIncrement = () => {
    setCount(count + 1);
  };

  return (
    <div className="counter-container">
      <h1>Counter</h1>
      <div className="count-display" data-testid="count">
        {initialValue}
      </div>
      <button className="btn" onClick={handleIncrement}>
        Increment
      </button>
    </div>
  );
}`,
      },
    },
    "src/Counter.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import Counter from './Counter';

test('increments count when button is clicked', () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });
  const countDisplay = screen.getByTestId('count');
  
  expect(countDisplay.textContent).toBe('0');
  
  fireEvent.click(button);
  expect(countDisplay.textContent).toBe('1');
  
  fireEvent.click(button);
  expect(countDisplay.textContent).toBe('2');
});`,
      },
    },
  },
};
