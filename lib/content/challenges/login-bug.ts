import { Challenge } from "../types";

export const loginBugChallenge: Challenge = {
  id: "login-spinner-bug",
  title: "Infinite Login Spinner",
  description: `
# Bug Report
The login button enters a loading state but never resolves if the API errors out.

## Acceptance Criteria
- [ ] Spinner stops on error
- [ ] Error message is displayed
  `,
  difficulty: "Easy",
  order: 1,
  tech: ["react", "typescript", "vitest"],
  files: {
    "package.json": {
      file: {
        contents: `{"name":"challenge","type":"module","dependencies":{"vitest":"latest","react":"^18.2.0","react-dom":"^18.2.0","@testing-library/react":"^14.0.0","jsdom":"^22.1.0","@types/react":"latest","@types/node":"latest"}}`,
      },
      readOnly: true,
    },
    "vitest.config.js": {
      file: {
        contents: `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});`,
      },
      readOnly: true,
    },
    "src/App.tsx": {
      file: {
        contents: `import React, { useState } from 'react';
export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    // Bug: We never set loading false if it fails!
    try {
      await fakeApi();
    } catch (e) {
      setError('Failed to login');
    }
  };

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Loading...' : 'Login'}
    </button>
  );
}

const fakeApi = () => new Promise((_, reject) => setTimeout(reject, 1000));`,
      },
    },
    "src/App.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';
import LoginForm from './App';

test('stops loading on error', async () => {
  render(<LoginForm />);
  const btn = screen.getByText('Login');
  fireEvent.click(btn);
  
  // Wait for the API to fail (takes 1s) and button to revert
  await waitFor(() => {
    expect(screen.getByText('Login')).toBeDefined();
  }, { timeout: 3000 });
});`,
      },
    },
  },
};
