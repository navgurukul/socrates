import { Challenge } from "../types";

export const shoppingCartChallenge: Challenge = {
  id: "shopping-cart-bug",
  title: "Stale Cart Total",
  description: `
# 🛒 Bug Report: Cart Total Not Updating

**Severity:** High  
**Component:** \`Cart.tsx\`

## Context
Customers are complaining that after they remove an item from their cart, the "Total" price displayed at the bottom remains unchanged until they refresh the page. This is causing confusion during checkout.

## Technical Notes
- The cart items state is managed in \`useCart.ts\`.
- The total calculation logic lives in \`Cart.tsx\`.
- We suspect the issue is related to how the total is recalculated when the \`items\` array changes.

## Acceptance Criteria
- [ ] Removing an item updates the total immediately.
- [ ] Adding an item updates the total immediately.
  `,
  difficulty: "Medium",
  order: 2,
  tech: ["react", "typescript", "hooks"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: `{"name":"challenge-2","type":"module","dependencies":{"vitest":"latest","react":"^18.2.0","react-dom":"^18.2.0","@testing-library/react":"^14.0.0","jsdom":"^22.1.0","@types/react":"latest","@types/node":"latest"}}`,
      },
    },
    "vitest.config.js": {
      readOnly: true,
      file: {
        contents: `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});`,
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
    { id: '1', name: 'Headphones', price: 100, qty: 1 },
    { id: '2', name: 'Keyboard', price: 50, qty: 1 }
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

  // 🐛 BUG IS HERE
  // The dev forgot to add 'items' to the dependency array!
  useEffect(() => {
    const newTotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    setTotal(newTotal);
  }, []); // <--- Missing dependency

  return (
    <div>
      <h1>Shopping Cart</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} - \${item.price}
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <div data-testid="total">Total: \${total}</div>
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
  
  // Initial State: 100 + 50 = 150
  expect(screen.getByTestId('total').textContent).toBe('Total: $150');
  
  // Remove Keyboard ($50)
  const removeBtns = screen.getAllByText('Remove');
  fireEvent.click(removeBtns[1]);
  
  // Should be 100
  expect(screen.getByTestId('total').textContent).toBe('Total: $100');
});`,
      },
    },
  },
};
