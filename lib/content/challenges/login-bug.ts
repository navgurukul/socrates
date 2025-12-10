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
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "login-bug-challenge",
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
    <title>Login Bug Challenge</title>
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
import LoginForm from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoginForm />
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.login-container {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  text-align: center;
  min-width: 300px;
}
.login-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  margin-top: 1rem;
}
.login-btn:hover { background: #2563eb; }
.login-btn:disabled { background: #6b7280; cursor: not-allowed; }
.error { color: #ef4444; margin-top: 1rem; }
`,
      },
    },
    "src/App.tsx": {
      file: {
        contents: `import React, { useState } from 'react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await fakeApi();
    } catch (e) {
      setError('Failed to login');
    }
  };

  return (
    <div className="login-container">
      <h1 style={{ marginBottom: '1rem' }}>Login</h1>
      <button className="login-btn" onClick={handleLogin} disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
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
  
  await waitFor(() => {
    expect(screen.getByText('Login')).toBeDefined();
  }, { timeout: 3000 });
});`,
      },
    },
  },
};
