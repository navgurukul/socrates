import { Battle } from "../types";

export const totalCalculatorOffBattle: Battle = {
  id: "total-calculator-off",
  trackId: "frontend-debugging",
  arcId: "js-logic-and-state",
  title: "Total Calculator Off by Pennies",
  description: `
# Bug Report: Invoice Total Incorrect

**Severity:** Critical  
**Component:** \`Invoice.tsx\`

## Context
Finance team reports invoice totals are off by a few cents. Sometimes shows $100.30000000000001 instead of $100.30.

## Instructions
1. Run the **Preview** and observe the displayed totals
2. **Right-click** → **Inspect** → Open **Console tab**
3. Try typing \`0.1 + 0.2\` in the console (see: 0.30000000000001)
4. This is a **floating-point precision** bug—a common production issue!
5. Fix the calculation and rounding in \`src/Invoice.tsx\`
6. Run **Tests** to verify correct currency formatting
  `,
  difficulty: "Medium",
  order: 4,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "total-calculator-off",
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
    <title>Invoice</title>
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
import Invoice from './Invoice.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Invoice />
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
.invoice-container {
  max-width: 700px;
  margin: 0 auto;
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
}
h1 {
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
}
.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}
.invoice-table th,
.invoice-table td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid #27272a;
}
.invoice-table th {
  color: #a1a1aa;
  font-weight: 500;
  font-size: 14px;
}
.invoice-table td {
  color: white;
}
.invoice-table th:last-child,
.invoice-table td:last-child {
  text-align: right;
}
.invoice-table th:nth-child(2),
.invoice-table td:nth-child(2) {
  text-align: center;
}
.totals {
  border-top: 2px solid #27272a;
  padding-top: 1rem;
}
.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 16px;
}
.grand-total {
  font-size: 20px;
  font-weight: bold;
  color: #3b82f6;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #27272a;
}
`,
      },
    },
    "src/Invoice.tsx": {
      file: {
        contents: `import React from 'react';

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

const ITEMS: LineItem[] = [
  { id: 1, description: 'Web Design Services', quantity: 10, unitPrice: 75.50 },
  { id: 2, description: 'Domain Registration', quantity: 1, unitPrice: 12.99 },
  { id: 3, description: 'Hosting (Monthly)', quantity: 3, unitPrice: 8.33 },
];

export default function Invoice() {
  // BUG: Direct floating-point arithmetic without rounding
  const subtotal = ITEMS.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="invoice-container">
      <h1>Invoice #INV-2024-001</h1>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {ITEMS.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>\${item.unitPrice.toFixed(2)}</td>
              <td>\${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span data-testid="subtotal">\${subtotal}</span>
        </div>
        <div className="total-row">
          <span>Tax (8%):</span>
          <span data-testid="tax">\${tax}</span>
        </div>
        <div className="total-row grand-total">
          <span>Total:</span>
          <span data-testid="total">\${total}</span>
        </div>
      </div>
    </div>
  );
}`,
      },
    },
    "src/Invoice.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Invoice from './Invoice';

test('calculates subtotal correctly', () => {
  render(<Invoice />);
  
  // 10*75.50 + 1*12.99 + 3*8.33 = 755.00 + 12.99 + 24.99 = 792.98
  const subtotal = screen.getByTestId('subtotal');
  expect(subtotal.textContent).toBe('$792.98');
});

test('calculates tax correctly', () => {
  render(<Invoice />);
  
  // 792.98 * 0.08 = 63.44 (rounded)
  const tax = screen.getByTestId('tax');
  expect(tax.textContent).toBe('$63.44');
});

test('calculates total correctly', () => {
  render(<Invoice />);
  
  // 792.98 + 63.44 = 856.42
  const total = screen.getByTestId('total');
  expect(total.textContent).toBe('$856.42');
});

test('does not show floating point errors', () => {
  render(<Invoice />);
  
  const subtotal = screen.getByTestId('subtotal');
  const tax = screen.getByTestId('tax');
  const total = screen.getByTestId('total');
  
  // Should NOT contain long decimal chains
  expect(subtotal.textContent).not.toContain('0000001');
  expect(subtotal.textContent).not.toContain('9999999');
  expect(tax.textContent).not.toContain('0000001');
  expect(tax.textContent).not.toContain('9999999');
  expect(total.textContent).not.toContain('0000001');
  expect(total.textContent).not.toContain('9999999');
});`,
      },
    },
  },
};
