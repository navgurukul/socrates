import { Battle } from "../types";

export const testAssertionMismatchBattle: Battle = {
  id: "test-assertion-mismatch",
  trackId: "frontend-debugging",
  arcId: "debugging-foundations",
  title: "The Test Knows Better",
  description: `
# Bug Report: Tests Failing Despite Correct UI

**Severity:** Low  
**Component:** \`Status.tsx\`

## Context
The UI looks correct, but the test suite is failing.  
A developer claims “the component works fine in the browser.”

## Instructions
1. Run **Tests** and observe the failure.
2. Check the rendered UI in **Preview**.
3. Identify why the test disagrees with what you see.
4. Fix the issue in \`src/Status.tsx\` without changing tests.
  `,
  difficulty: "Easy",
  order: 4,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "test-assertion-mismatch",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              test: "vitest run",
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@types/react": "^18.2.15",
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
        contents: `<div id="root"></div>`,
      },
    },
    "vite.config.js": {
      readOnly: true,
      hidden: true,
      file: {
        contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })`,
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
  test: { environment: 'jsdom', globals: true }
})`,
      },
    },
    "src/Status.tsx": {
      file: {
        contents: `import React from 'react';

export default function Status({ online = false }: { online?: boolean }) {
  return (
    <div>
      <span data-testid="status">
        {online ? "Online" : "Offline"}
      </span>
    </div>
  );
}`,
      },
    },
    "src/Status.test.tsx": {
      readOnly: true,
      file: {
        contents: `import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Status from './Status';

test('shows correct status text', () => {
  render(<Status online={true} />);
  expect(screen.getByTestId('status').textContent).toBe('ONLINE');
});`,
      },
    },
  },
};
