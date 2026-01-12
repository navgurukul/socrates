import { Battle } from "../types";

export const stateSyncBrokenBattle: Battle = {
  id: "state-sync-broken",
  trackId: "frontend-debugging",
  arcId: "js-logic-and-state",
  title: "Two Counters Out of Sync",
  description: `
# Bug Report: Counter Components Show Different Values

**Severity:** High  
**Component:** \`App.tsx\`, \`Counter.tsx\`

## Context
Two counter components on the page show different values even though they're supposed to display the same count.

## Instructions
1. Run the **Preview**
2. Click "Increment" on Counter A—notice Counter B doesn't update
3. **Right-click** → **Inspect** → Open **React DevTools** (Components tab)
4. Inspect the state tree—notice duplicate state in each component!
5. This violates the **single source of truth** principle
6. Fix the architecture by lifting state up in \`src/App.tsx\`
7. Run **Tests** to verify synchronization
  `,
  difficulty: "Medium",
  order: 5,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "state-sync-broken",
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
    <title>Synchronized Counters</title>
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
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
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
.app-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}
h1 {
  margin: 0 0 0.5rem 0;
}
.subtitle {
  color: #71717a;
  margin: 0 0 2rem 0;
}
.counters {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}
.counter-card {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  min-width: 250px;
}
.counter-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #a1a1aa;
}
.count-display {
  font-size: 4rem;
  font-weight: bold;
  color: #3b82f6;
  margin: 1.5rem 0;
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
.btn:hover {
  background: #2563eb;
}
`,
      },
    },
    "src/App.tsx": {
      file: {
        contents: `import React from 'react';
import Counter from './Counter';

export default function App() {
  // BUG: No shared state - each Counter has its own state
  return (
    <div className="app-container">
      <h1>Synchronized Counters</h1>
      <p className="subtitle">These counters should show the same value</p>
      <div className="counters">
        <Counter label="Counter A" />
        <Counter label="Counter B" />
      </div>
    </div>
  );
}`,
      },
    },
    "src/Counter.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

interface CounterProps {
  label: string;
}

export default function Counter({ label }: CounterProps) {
  // BUG: Each instance has its own state
  const [count, setCount] = useState(0);

  return (
    <div className="counter-card">
      <h2>{label}</h2>
      <div className="count-display" data-testid={\`count-\${label.toLowerCase().replace(' ', '-')}\`}>
        {count}
      </div>
      <button 
        className="btn" 
        onClick={() => setCount(count + 1)}
        data-testid={\`btn-\${label.toLowerCase().replace(' ', '-')}\`}
      >
        Increment
      </button>
    </div>
  );
}`,
      },
    },
    "src/App.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('both counters show the same initial value', () => {
  render(<App />);
  
  const counterA = screen.getByTestId('count-counter-a');
  const counterB = screen.getByTestId('count-counter-b');
  
  expect(counterA.textContent).toBe('0');
  expect(counterB.textContent).toBe('0');
});

test('incrementing Counter A updates Counter B', () => {
  render(<App />);
  
  const btnA = screen.getByTestId('btn-counter-a');
  const counterA = screen.getByTestId('count-counter-a');
  const counterB = screen.getByTestId('count-counter-b');
  
  fireEvent.click(btnA);
  
  expect(counterA.textContent).toBe('1');
  expect(counterB.textContent).toBe('1');
});

test('incrementing Counter B updates Counter A', () => {
  render(<App />);
  
  const btnB = screen.getByTestId('btn-counter-b');
  const counterA = screen.getByTestId('count-counter-a');
  const counterB = screen.getByTestId('count-counter-b');
  
  fireEvent.click(btnB);
  
  expect(counterA.textContent).toBe('1');
  expect(counterB.textContent).toBe('1');
});

test('both counters stay synchronized through multiple clicks', () => {
  render(<App />);
  
  const btnA = screen.getByTestId('btn-counter-a');
  const btnB = screen.getByTestId('btn-counter-b');
  const counterA = screen.getByTestId('count-counter-a');
  const counterB = screen.getByTestId('count-counter-b');
  
  fireEvent.click(btnA);
  fireEvent.click(btnB);
  fireEvent.click(btnA);
  
  expect(counterA.textContent).toBe('3');
  expect(counterB.textContent).toBe('3');
});`,
      },
    },
  },
};
