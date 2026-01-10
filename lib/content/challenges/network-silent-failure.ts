import { Battle } from "../types";

export const networkSilentFailureBattle: Battle = {
  id: "network-silent-failure",
  trackId: "frontend-debugging",
  arcId: "debugging-foundations",
  title: "Network Request Failed Silently",
  description: `
# Bug Report: Data Won't Load in Production

**Severity:** Critical  
**Component:** \`PostList.tsx\`

## Context
Users report the post list shows "Loading..." forever. No error message appears.

## Instructions
1. Run the **Preview** to see the app stuck in loading state
2. **Right-click** → **Inspect** → Open **Network tab**
3. Observe the failed API request (red status line)
4. Click the failed request to see the 404 error details
5. Check **Console tab** for any logged errors (notice there are none!)
6. Fix the missing error handling in \`src/PostList.tsx\`
7. Run **Tests** to verify proper error display
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
            name: "network-silent-failure",
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
    <title>Post List</title>
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
import PostList from './PostList.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostList />
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
.container {
  background: #18181b;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #27272a;
  min-width: 500px;
  max-width: 600px;
}
.loading {
  text-align: center;
  padding: 2rem;
  color: #71717a;
}
.error {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
  background: #7f1d1d;
  border-radius: 6px;
  border: 1px solid #991b1b;
}
.post-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
}
.post-list li {
  padding: 1rem;
  margin: 0.5rem 0;
  background: #09090b;
  border-radius: 6px;
  border: 1px solid #27272a;
}
h1 {
  margin: 0 0 1rem 0;
}
`,
      },
    },
    "src/PostList.tsx": {
      file: {
        contents: `import React, { useState, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BUG: No error handling - failures are swallowed
    fetch('https://jsonplaceholder.typicode.com/postssss')  // Wrong URL (404)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
    // Missing .catch() - errors are silent!
  }, []);

  if (loading) {
    return (
      <div className="container">
        <h1>Latest Posts</h1>
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Latest Posts</h1>
      <ul className="post-list">
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}`,
      },
    },
    "src/PostList.test.tsx": {
      readOnly: true,
      file: {
        contents: `import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import PostList from './PostList';

// Mock fetch
global.fetch = vi.fn();

test('displays error message when fetch fails', async () => {
  // Simulate a 404 error
  (global.fetch as any).mockRejectedValueOnce(new Error('HTTP 404'));

  render(<PostList />);

  // Should show error message instead of infinite loading
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeDefined();
  });
});

test('displays posts when fetch succeeds', async () => {
  const mockPosts = [
    { id: 1, title: 'First Post' },
    { id: 2, title: 'Second Post' },
  ];

  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => mockPosts,
  });

  render(<PostList />);

  await waitFor(() => {
    expect(screen.getByText('First Post')).toBeDefined();
    expect(screen.getByText('Second Post')).toBeDefined();
  });
});

test('handles network errors gracefully', async () => {
  (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

  render(<PostList />);

  await waitFor(() => {
    const errorEl = screen.getByText(/error/i);
    expect(errorEl).toBeDefined();
  });
});`,
      },
    },
  },
};
