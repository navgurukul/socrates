export interface FileNode {
  file: {
    contents: string;
  };
  readOnly?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  files: Record<string, FileNode>;
}

export const challenges: Challenge[] = [
  {
    id: "basic-math-fix",
    title: "The Broken Adder",
    difficulty: "Easy",
    description: `
# Bug Report: Calculator Returns Wrong Sum

**Severity:** High  
**Component:** \`index.js\`

## Context
Users are reporting that the calculator app is giving incorrect results when adding numbers. For example, \`add(5, 3)\` returns \`2\` instead of \`8\`.

## Acceptance Criteria
- [ ] The \`add\` function should return the correct sum of two numbers.
- [ ] \`add(2, 2)\` should return \`4\`.

## Technical Notes
- The function takes two parameters \`a\` and \`b\`.
- Check the arithmetic operator being used.
    `,
    files: {
      "package.json": {
        file: {
          contents: `{"name":"challenge","type":"module","dependencies":{"vitest":"latest", "@types/react": "^18.2.0",
    "@types/node": "latest"}}`,
        },
      },
      "src/index.js": {
        file: {
          contents: `
export function add(a, b) {
  return a - b; // BUG: Should be a + b
}`.trim(),
        },
      },
      "src/utils/helpers.js": {
        file: {
          contents: `
export function formatResult(result) {
  return \`Result: \${result}\`;
}`.trim(),
        },
        readOnly: true,
      },
      "tests/index.test.js": {
        file: {
          contents: `
import { expect, test } from 'vitest';
import { add } from '../src/index.js';

test('adds numbers correctly', () => {
  expect(add(2, 2)).toBe(4);
});`.trim(),
        },
        readOnly: true,
      },
    },
  },
  {
    id: "mutable-state-fix",
    title: "Fixing Mutable State Updates",
    difficulty: "Medium",
    description: `
# Bug Report: History Log Never Updates

**Severity:** High  
**Component:** \`index.js\` - \`useHistoryLog\` hook

## Context
The HistoryLog component is supposed to track user actions, but the UI never updates when new entries are added! Users click "Perform Action" but nothing appears in the list.

## Root Cause Analysis
The developer is directly mutating the state array with \`.push()\` instead of creating a new array instance. React's reconciliation process uses reference equality checks, so mutating the same array reference doesn't trigger a re-render.

## Acceptance Criteria
- [ ] Clicking "Perform Action" should immediately show the new entry in the list.
- [ ] The \`addEntry\` function must create a new array reference.
- [ ] All existing entries should be preserved when adding new ones.

## Technical Notes
- Use spread syntax \`[...array, newItem]\` or \`Array.concat()\` for immutable updates.
- Never mutate state directly in React—always create new references.
    `,
    files: {
      "package.json": {
        file: {
          contents: `{"name":"challenge","type":"module","dependencies":{"vitest":"latest","react":"^18.2.0","@testing-library/react":"^14.0.0","jsdom":"^22.1.0", "@types/react": "^18.2.0",
    "@types/node": "latest"}}`,
        },
      },
      "vitest.config.js": {
        file: {
          contents: `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});`.trim(),
        },
      },
      "src/hooks/useHistoryLog.js": {
        file: {
          contents: `
import { useState } from 'react';

export function useHistoryLog() {
  const [history, setHistory] = useState([]);

  const addEntry = (entry) => {
    // BUG: Directly mutating state array!
    // React won't detect this change because the array reference stays the same
    history.push(entry);
    setHistory(history);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addEntry, clearHistory };
}`.trim(),
        },
      },
      "src/components/HistoryLog.js": {
        file: {
          contents: `
import { useState } from 'react';
import { useHistoryLog } from '../hooks/useHistoryLog.js';

export function HistoryLog() {
  const { history, addEntry, clearHistory } = useHistoryLog();
  const [counter, setCounter] = useState(0);

  const handleAction = () => {
    const newCount = counter + 1;
    setCounter(newCount);
    addEntry(\`Action #\${newCount} at \${new Date().toLocaleTimeString()}\`);
  };

  return (
    <div>
      <h2>History Log</h2>
      <button onClick={handleAction}>Perform Action</button>
      <button onClick={clearHistory}>Clear History</button>
      <ul>
        {history.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ul>
      <p>Total entries: {history.length}</p>
    </div>
  );
}`.trim(),
        },
        readOnly: true,
      },
      "src/index.js": {
        file: {
          contents: `
export { useHistoryLog } from './hooks/useHistoryLog.js';
export { HistoryLog } from './components/HistoryLog.js';`.trim(),
        },
        readOnly: true,
      },
      "tests/hooks/useHistoryLog.test.js": {
        file: {
          contents: `
import { expect, test } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryLog } from '../../src/hooks/useHistoryLog.js';

test('addEntry should trigger re-render with new history', () => {
  const { result } = renderHook(() => useHistoryLog());
  
  // Store initial history reference
  const initialHistory = result.current.history;
  
  // Add an entry
  act(() => {
    result.current.addEntry('First action');
  });
  
  // The history array should be a NEW reference (immutable update)
  // If mutating directly, this will be the same reference and test fails
  expect(result.current.history).not.toBe(initialHistory);
  expect(result.current.history).toHaveLength(1);
  expect(result.current.history[0]).toBe('First action');
});

test('multiple entries should accumulate correctly', () => {
  const { result } = renderHook(() => useHistoryLog());
  
  act(() => {
    result.current.addEntry('Action 1');
  });
  
  const afterFirstAdd = result.current.history;
  
  act(() => {
    result.current.addEntry('Action 2');
  });
  
  // Each update should create a new array reference
  expect(result.current.history).not.toBe(afterFirstAdd);
  expect(result.current.history).toHaveLength(2);
  expect(result.current.history).toEqual(['Action 1', 'Action 2']);
});`.trim(),
        },
        readOnly: true,
      },
    },
  },
  {
    id: "async-race-condition",
    title: "The ATM Double-Withdrawal",
    difficulty: "Hard",
    description: `
# Bug Report: Lost Deposits on Rapid Clicks

**Severity:** Critical  
**Component:** \`index.js\` - \`deposit\` function

## Context
Users are reporting that when they click "Deposit" twice quickly, the second deposit seems to disappear! For example, depositing $100 twice from a $1000 balance should result in $1200, but users end up with only $1100.

## Root Cause Analysis
This is a classic **race condition**. When two deposits fire simultaneously:
1. Both read the current balance (e.g., $1000)
2. Both calculate their new balance independently ($1000 + $100 = $1100)
3. The second write overwrites the first—**last write wins**

## Acceptance Criteria
- [ ] Concurrent deposits must be handled atomically.
- [ ] Three simultaneous $100 deposits from $1000 should result in $1300.
- [ ] The solution must work with the existing network latency simulation.

## Technical Notes
- Do NOT remove the \`setTimeout\` delay—it simulates real network latency.
- Consider using a mutex/lock pattern or atomic operations.
- The \`getBalance\` and \`resetBalance\` helpers should not be modified.
    `,
    files: {
      "package.json": {
        file: {
          contents: `{"name":"challenge","type":"module","dependencies":{"vitest":"latest", "@types/react": "^18.2.0",
    "@types/node": "latest"}}`,
        },
      },
      "index.js": {
        file: {
          contents: `
let dbBalance = 1000;

// Helper to check balance (Do not change)
export const getBalance = () => dbBalance;
export const resetBalance = () => { dbBalance = 1000; };

// BUG: This function handles deposits insecurely
export async function deposit(amount) {
  const currentBalance = dbBalance;

  // Simulate Network Latency (Do not remove this line!)
  await new Promise(resolve => setTimeout(resolve, 50));

  dbBalance = currentBalance + amount;
  return dbBalance;
}
`.trim(),
        },
      },
      "index.test.js": {
        file: {
          contents: `
import { expect, test, beforeEach } from 'vitest';
import { deposit, getBalance, resetBalance } from './index.js';

beforeEach(() => {
  resetBalance();
});

test('handles single deposit', async () => {
  await deposit(100);
  expect(getBalance()).toBe(1100);
});

test('handles rapid concurrent deposits (Race Condition)', async () => {
  // Fire 3 deposits of $100 at the exact same time
  await Promise.all([
    deposit(100),
    deposit(100),
    deposit(100)
  ]);
  
  // If the race condition exists, the balance will be 1100 (last write wins)
  // If fixed, it should be 1300
  expect(getBalance()).toBe(1300);
});`.trim(),
        },
        readOnly: true,
      },
    },
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
