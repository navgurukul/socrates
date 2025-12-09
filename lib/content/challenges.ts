export interface FileNode {
  file: {
    contents: string;
  };
  readOnly?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  files: Record<string, FileNode>;
}

export const challenges: Challenge[] = [
  {
    id: "basic-math-fix",
    title: "The Broken Adder",
    description: "The add function is returning the wrong result. Fix it!",
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
export function add(a, b) {
  return a - b; // BUG: Should be a + b
}`.trim(),
        },
      },
      "index.test.js": {
        file: {
          contents: `
import { expect, test } from 'vitest';
import { add } from './index.js';

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
    description:
      "The HistoryLog component is supposed to track user actions, but the UI never updates when new entries are added! The developer is directly mutating the state array with .push() instead of creating a new array instance. Fix the addEntry function to update state immutably using spread syntax or Array.concat().",
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
      "index.js": {
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
}

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
      },
      "index.test.js": {
        file: {
          contents: `
import { expect, test } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryLog } from './index.js';

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
  // ... inside your challenges array

  {
    id: "async-race-condition",
    title: "The ATM Double-Withdrawal",
    description:
      "Users are reporting that if they click 'Deposit' twice quickly, the second deposit is lost. Fix the race condition.",
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
