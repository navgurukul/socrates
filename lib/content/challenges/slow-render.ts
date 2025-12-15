import { Battle } from "../types";

export const slowRenderBattle: Battle = {
  id: "slow-render",
  trackId: "frontend-debugging",
  arcId: "render-performance",
  title: "The Laggy Input",
  description: `
# Bug Report: Typing is Extremely Slow

**Severity:** Medium  
**Component:** \`App.tsx\` / \`HeavyList.tsx\`

## Context
Users are complaining that the application "freezes" or "lags" whenever they try to type in the search bar or toggle the Dark Mode theme. The interface feels unresponsive.

## Technical Notes
- The app renders a list of **5,000 items**.
- We suspect that updating the "Theme" or "Input" is forcing the **Entire List** to re-render unnecessarily.

## Instructions
1. Run the **Preview**.
2. Try typing quickly in the "Search" box. Notice the delay between keystrokes.
3. Toggle the "Dark Mode" button. Notice the stutter.
4. **Fix the performance issue** in \`src/HeavyList.tsx\` or \`src/App.tsx\` so that typing is smooth.
5. Run Tests to ensure the app still functions correctly.
  `,
  difficulty: "Hard",
  order: 1,
  tech: ["react", "performance", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "slow-render-challenge",
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
              "lucide-react": "^0.294.0",
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
    <title>Slow Render</title>
    <style>body { margin: 0; font-family: system-ui; }</style>
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
  server: { host: '0.0.0.0' }
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
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)`,
      },
    },
    "src/data.ts": {
      readOnly: true,
      file: {
        contents: `// Generates fake data
export const generateItems = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: \`Item #\${i + 1}\`,
    value: Math.floor(Math.random() * 1000)
  }));
};`,
      },
    },
    "src/HeavyList.tsx": {
      file: {
        contents: `import React from 'react';

export const HeavyList = ({ items }: { items: any[] }) => {
  console.log("HeavyList is rendering..."); // Watch the console!
  
  // Artificial delay to simulate complex DOM structure or heavy calculation
  const start = performance.now();
  while (performance.now() - start < 5) {
    // block main thread for 5ms per render to make lag obvious
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '5px' }}>
      {items.map(item => (
        <div key={item.id} style={{ 
          padding: '10px', 
          background: '#27272a', 
          borderRadius: '4px',
          fontSize: '10px',
          color: '#a1a1aa'
        }}>
          {item.name}
        </div>
      ))}
    </div>
  );
};
`,
      },
    },
    "src/App.tsx": {
      file: {
        contents: `import React, { useState } from 'react';
import { generateItems } from './data';
import { HeavyList } from './HeavyList';
import { Moon, Sun } from 'lucide-react';

// Generate data ONCE outside component (or useMemo inside)
const initialItems = generateItems(3000); 

export default function App() {
  const [text, setText] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  
  const styles = {
    container: {
      padding: '20px',
      minHeight: '100vh',
      background: darkMode ? '#09090b' : '#ffffff',
      color: darkMode ? 'white' : 'black',
      transition: 'all 0.3s ease'
    },
    input: {
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #3f3f46',
      background: darkMode ? '#18181b' : '#f4f4f5',
      color: 'inherit',
      width: '100%',
      marginBottom: '20px',
      fontSize: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Performance Challenge</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          {darkMode ? <Sun /> : <Moon />}
        </button>
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here rapidly to feel the lag..."
        style={styles.input}
      />

      <HeavyList items={initialItems} />
    </div>
  );
}
`,
      },
    },
    "src/App.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

// We just check that the app still works functionally.
// The real test is the user experience (smoothness).

test('renders items and handles input', () => {
  render(<App />);
  
  // Check if items are rendered
  expect(screen.getByText('Item #1')).toBeDefined();
  
  // Check if input works
  const input = screen.getByPlaceholderText('Type here rapidly to feel the lag...') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Hello' } });
  
  expect(input.value).toBe('Hello');
  
  // Check theme toggle
  const toggleBtn = screen.getByRole('button');
  fireEvent.click(toggleBtn);
});
`,
      },
    },
  },
};
