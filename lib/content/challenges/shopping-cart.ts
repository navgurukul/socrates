import { Battle } from "../types";

export const shoppingCartBattle: Battle = {
  id: "shopping-cart-bug",
  trackId: "frontend-debugging",
  arcId: "state-and-mutations",
  title: "Stale Cart Total",
  description: `
# Bug Report: Cart Total Not Updating

**Severity:** High  
**Component:** \`Cart.tsx\`

## Context
Customers are complaining that after they remove an item from their cart, the "Total" price displayed at the bottom remains unchanged.

## Instructions
1. Run the **Preview** to see the bug in action.
2. Try removing an item. Notice the Total doesn't change.
3. Fix the bug in \`src/Cart.tsx\`.
4. Run Tests to verify.
  `,
  difficulty: "Medium",
  order: 2,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "vite-react-starter",
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
    <title>Bug Battle Preview</title>
    <style>body { background-color: #09090b; color: white; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
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
    "src/main.tsx": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import Cart from './Cart.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Cart />
  </React.StrictMode>,
)`,
      },
    },
    "src/index.css": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `
            body { font-family: system-ui; padding: 20px; }
            button { background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #b91c1c; }
            ul { list-style: none; padding: 0; }
            li { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; align-items: center; }
            `,
      },
    },
    "src/types.ts": {
      file: {
        contents: `export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}`,
      },
    },
    "src/useCart.ts": {
      file: {
        contents: `import { useState } from 'react';
import { CartItem } from './types';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([
    { id: '1', name: 'Gaming Mouse', price: 45, qty: 1 },
    { id: '2', name: 'Mechanical Keyboard', price: 120, qty: 1 },
    { id: '3', name: 'USB-C Hub', price: 30, qty: 1 }
  ]);

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  return { items, removeItem };
}`,
      },
    },
    "src/Cart.tsx": {
      file: {
        contents: `import React, { useState, useEffect } from 'react';
import { useCart } from './useCart';

export default function Cart() {
  const { items, removeItem } = useCart();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    setTotal(newTotal);
  }, []); 

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Shopping Cart</h1>
      <div style={{ background: '#18181b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a' }}>
        <ul>
          {items.map(item => (
            <li key={item.id}>
              <span>{item.name} <span style={{color: '#71717a'}}>(\${item.price})</span></span>
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <div data-testid="total" style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '1rem', textAlign: 'right' }}>
          Total: \${total}
        </div>
      </div>
    </div>
  );
}`,
      },
    },
    "src/Cart.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import Cart from './Cart';

test('updates total when item is removed', async () => {
  render(<Cart />);
  
  // Initial: 45 + 120 + 30 = 195
  expect(screen.getByTestId('total').textContent).toContain('195');
  
  // Remove Keyboard (120) - 2nd button
  const removeBtns = screen.getAllByText('Remove');
  fireEvent.click(removeBtns[1]);
  
  // Should be 195 - 120 = 75
  expect(screen.getByTestId('total').textContent).toContain('75');
});`,
      },
    },
  },
};
