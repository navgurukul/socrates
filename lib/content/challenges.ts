export interface FileNode {
  file: {
    contents: string;
  };
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
          contents: `{"name":"challenge","type":"module","dependencies":{"vitest":"latest"}}`,
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
      },
    },
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
