import { Battle } from "../types";

export const consoleErrorProductionBattle: Battle = {
  id: "console-error-production",
  trackId: "frontend-debugging",
  arcId: "debugging-foundations",
  title: "Console Error Slips Through",
  description: `
# Bug Report: Production Error in Console

**Severity:** High  
**Component:** \`UserCard.tsx\`

## Context
QA reports a TypeError in production console logs:
\`Uncaught TypeError: Cannot read properties of undefined (reading 'startsWith')\`

The app appears to work, but errors in production console hurt user experience and SEO.

## Instructions
1. Run the **Preview** to see the rendered app
2. **Right-click** the preview → **Inspect** → Open **Console tab**
3. Observe the red TypeError in browser console
4. Click the error to jump to the source line
5. Add defensive null checking in \`src/UserCard.tsx\`
6. Refresh Preview and verify console is clean
7. Run **Tests** to verify the fix
  `,
  difficulty: "Easy",
  order: 3,
  tech: ["react", "typescript", "vite"],
  files: {
    "package.json": {
      readOnly: true,
      file: {
        contents: JSON.stringify(
          {
            name: "console-error-production",
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
    <title>User Card</title>
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
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
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
.app {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  min-width: 400px;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #09090b;
  border-radius: 6px;
  margin-top: 1rem;
}
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  background: #27272a;
}
.user-card h2 {
  margin: 0;
  font-size: 1.2rem;
}
`,
      },
    },
    "src/App.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import UserCard from './UserCard';

export default function App() {
  // User object sometimes missing avatar (real-world API scenario)
  const user = {
    id: 1,
    name: 'Alice Chen',
    // avatar: 'alice.jpg'  // <-- Sometimes undefined from API
  };

  return (
    <div className="app">
      <h1>User Profile</h1>
      <UserCard user={user} />
    </div>
  );
}`,
      },
    },
    "src/UserCard.tsx": {
      file: {
        contents: `import React from 'react';

interface User {
  id: number;
  name: string;
  avatar?: string;  // Optional avatar URL
}

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  // BUG: Accessing avatar.startsWith without checking if avatar exists
  const avatarUrl = user.avatar.startsWith('http') 
    ? user.avatar 
    : \`/avatars/\${user.avatar}\`;

  return (
    <div className="user-card">
      <img src={avatarUrl} alt={user.name} className="avatar" />
      <h2>{user.name}</h2>
    </div>
  );
}`,
      },
    },
    "src/UserCard.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import UserCard from './UserCard';

test('renders user card with avatar URL', () => {
  const user = {
    id: 1,
    name: 'Alice Chen',
    avatar: 'https://example.com/avatar.jpg'
  };
  
  render(<UserCard user={user} />);
  
  const img = screen.getByAltText('Alice Chen');
  expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
});

test('renders user card with relative avatar path', () => {
  const user = {
    id: 2,
    name: 'Bob Smith',
    avatar: 'bob.jpg'
  };
  
  render(<UserCard user={user} />);
  
  const img = screen.getByAltText('Bob Smith');
  expect(img.getAttribute('src')).toBe('/avatars/bob.jpg');
});

test('handles missing avatar without crashing', () => {
  const user = {
    id: 3,
    name: 'Charlie Davis'
    // No avatar property
  };
  
  render(<UserCard user={user} />);
  
  const img = screen.getByAltText('Charlie Davis');
  // Should use default avatar
  expect(img.getAttribute('src')).toBe('/avatars/default.png');
});`,
      },
    },
  },
};
