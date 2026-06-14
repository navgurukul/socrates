import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: A race condition causes an older, slower network request to overwrite data from a newer, faster request, leading to stale UI.
export const staleProfileDisplayBattle: Battle = {
  "id": "stale-profile-display",
  "trackId": "frontend-debugging",
  "arcId": "async-network-and-effects",
  "title": "Stale User Profile Displayed After Rapid ID Change",
  "description": "### Severity: Medium\n\n### Component: `UserProfileFetcher`\n\n### Context:\nThe `UserProfileFetcher` component is responsible for fetching and displaying a user's profile based on a `userId` prop. It shows a loading state during data fetching and an error message if the fetch fails. The component is used in a section where users can switch between different profiles quickly, such as an admin panel or a user directory.\n\n### Repro Steps:\n1. Render the `UserProfileFetcher` component with `userId=\"1\"`.\n2. Observe the 'Loading profile...' message.\n3. Immediately, re-render the component with `userId=\"2\"` before the request for `userId=\"1\"` completes.\n4. Ensure the request for `userId=\"2\"` completes successfully and *faster* than the request for `userId=\"1\"`.\n5. Wait for the (slower) request for `userId=\"1\"` to eventually complete.\n\n### Expected Result:\nAfter step 4, the component should display the profile for `userId=\"2\"`. After step 5, the component should *continue* to display the profile for `userId=\"2\"`, ignoring the completion of the `userId=\"1\"` request.\n\n### Actual Result:\nAfter step 4, the component correctly displays the profile for `userId=\"2\"`. However, after step 5, the component reverts and displays the stale profile data for `userId=\"1\"`.",
  "difficulty": "Medium",
  "order": 3,
  "tech": [
    "react",
    "typescript"
  ],
  "files": {
    "package.json": {
      "readOnly": true,
      "file": {
        "contents": "{\n  \"name\": \"battle-challenge\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"preview\": \"vite preview\",\n    \"test\": \"vitest run\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\"\n  },\n  \"devDependencies\": {\n    \"@types/react\": \"^18.2.15\",\n    \"@types/react-dom\": \"^18.2.7\",\n    \"@vitejs/plugin-react\": \"^4.0.3\",\n    \"vite\": \"^4.4.5\",\n    \"vitest\": \"^0.34.1\",\n    \"jsdom\": \"^22.1.0\",\n    \"@testing-library/react\": \"^14.0.0\",\n    \"@testing-library/jest-dom\": \"^6.1.4\"\n  }\n}"
      }
    },
    "index.html": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Stale User Profile Displayed After Rapid ID Change</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.tsx\"></script>\n  </body>\n</html>"
      }
    },
    "vite.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})"
      }
    },
    "vitest.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vitest/config'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: 'jsdom',\n    globals: true,\n    watch: false,\n    setupFiles: ['./vitest.setup.ts'],\n  },\n})"
      }
    },
    "vitest.setup.ts": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import '@testing-library/jest-dom';"
      }
    },
    "src/main.tsx": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport UserProfileFetcher from './UserProfileFetcher.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <UserProfileFetcher />\n  </React.StrictMode>,\n)"
      }
    },
    "src/index.css": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }\n.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }\n.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }\n.btn:hover { background:#2563eb; }"
      }
    },
    "src/UserProfileFetcher.tsx": {
      "file": {
        "contents": "import React, { useEffect, useState } from 'react';\n\ninterface UserProfile {\n  id: string;\n  name: string;\n  email: string;\n}\n\ninterface UserProfileFetcherProps {\n  userId: string;\n}\n\nconst UserProfileFetcher: React.FC<UserProfileFetcherProps> = ({ userId }) => {\n  const [profile, setProfile] = useState<UserProfile | null>(null);\n  const [loading, setLoading] = useState<boolean>(false);\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    setLoading(true);\n    setError(null);\n    setProfile(null);\n\n    fetch(`/api/users/${userId}`)\n      .then(res => {\n        if (!res.ok) {\n          throw new Error(`HTTP error! status: ${res.status}`);\n        }\n        return res.json();\n      })\n      .then(data => {\n        setProfile(data);\n        setLoading(false);\n      })\n      .catch(err => {\n        // In a real app, you might want to differentiate between AbortError and other errors\n        // For this challenge, we'll assume a network error if not aborted explicitly by browser.\n        setError(err.message);\n        setLoading(false);\n      });\n  }, [userId]);\n\n  if (loading) {\n    return <div>Loading profile...</div>;\n  }\n\n  if (error) {\n    return <div style={{ color: 'red' }}>Error: {error}</div>;\n  }\n\n  if (!profile) {\n    return <div>No profile selected or found.</div>;\n  }\n\n  return (\n    <div>\n      <h2>{profile.name}</h2>\n      <p>ID: {profile.id}</p>\n      <p>Email: {profile.email}</p>\n    </div>\n  );\n};\n\nexport default UserProfileFetcher;\n"
      }
    },
    "src/UserProfileFetcher.test.tsx": {
      "readOnly": true,
      "file": {
        "contents": "import { render, screen, waitFor, act } from '@testing-library/react';\nimport { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';\nimport UserProfileFetcher from './UserProfileFetcher';\n\n// Custom fetch mock utility\nconst setupFetchMock = () => {\n  const pendingRequests = new Map<string, [(value: Response) => void, (reason?: any) => void]>();\n\n  global.fetch = vi.fn((url: RequestInfo) => {\n    return new Promise<Response>((resolve, reject) => {\n      pendingRequests.set(url.toString(), [resolve, reject]);\n    });\n  }) as any;\n\n  const resolveRequest = (url: string, data: any, status = 200) => {\n    const request = pendingRequests.get(url);\n    if (request) {\n      const [resolve] = request;\n      resolve(new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }));\n      pendingRequests.delete(url);\n    } else {\n      console.warn(`No pending request found for URL: ${url}`);\n    }\n  };\n\n  const rejectRequest = (url: string, error: any) => {\n    const request = pendingRequests.get(url);\n    if (request) {\n      const [, reject] = request;\n      reject(error);\n      pendingRequests.delete(url);\n    } else {\n      console.warn(`No pending request found for URL: ${url}`);\n    }\n  };\n\n  return { resolveRequest, rejectRequest, fetchMock: global.fetch };\n};\n\ndescribe('UserProfileFetcher', () => {\n  let fetchMocks: ReturnType<typeof setupFetchMock>;\n\n  beforeEach(() => {\n    fetchMocks = setupFetchMock();\n  });\n\n  afterEach(() => {\n    vi.restoreAllMocks();\n  });\n\n  it('displays loading state, then user profile', async () => {\n    const { resolveRequest } = fetchMocks;\n    render(<UserProfileFetcher userId=\"1\" />);\n\n    expect(screen.getByText('Loading profile...')).toBeInTheDocument();\n\n    const user1Profile = { id: '1', name: 'John Doe', email: 'john@example.com' };\n    await act(async () => {\n      resolveRequest('/api/users/1', user1Profile);\n    });\n\n    await waitFor(() => {\n      expect(screen.getByText('John Doe')).toBeInTheDocument();\n      expect(screen.getByText('ID: 1')).toBeInTheDocument();\n      expect(screen.getByText('Email: john@example.com')).toBeInTheDocument();\n    });\n\n    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();\n    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();\n  });\n\n  it('displays error state on failed fetch', async () => {\n    const { rejectRequest } = fetchMocks;\n    render(<UserProfileFetcher userId=\"1\" />);\n\n    expect(screen.getByText('Loading profile...')).toBeInTheDocument();\n\n    await act(async () => {\n      rejectRequest('/api/users/1', new Error('Network error!'));\n    });\n\n    await waitFor(() => {\n      expect(screen.getByText(/Error: Network error!/)).toBeInTheDocument();\n    });\n\n    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();\n    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();\n  });\n\n  it('displays the correct user profile when userId changes rapidly, avoiding stale data', async () => {\n    const { resolveRequest } = fetchMocks;\n    const { rerender } = render(<UserProfileFetcher userId=\"1\" />);\n\n    // Initial loading for user 1\n    expect(screen.getByText('Loading profile...')).toBeInTheDocument();\n\n    // Immediately change userId to 2\n    rerender(<UserProfileFetcher userId=\"2\" />);\n\n    // Still loading, now for user 2\n    expect(screen.getByText('Loading profile...')).toBeInTheDocument();\n    expect(fetchMocks.fetchMock).toHaveBeenCalledWith('/api/users/1');\n    expect(fetchMocks.fetchMock).toHaveBeenCalledWith('/api/users/2');\n\n    const user2Profile = { id: '2', name: 'Jane Doe', email: 'jane@example.com' };\n    const user1Profile = { id: '1', name: 'John Doe', email: 'john@example.com' };\n\n    // Resolve request for user 2 first (faster response)\n    await act(async () => {\n      resolveRequest('/api/users/2', user2Profile);\n    });\n\n    // Wait for the UI to update with user 2's data\n    await waitFor(() => {\n      expect(screen.getByText('Jane Doe')).toBeInTheDocument();\n      expect(screen.getByText('ID: 2')).toBeInTheDocument();\n      expect(screen.getByText('Email: jane@example.com')).toBeInTheDocument();\n    });\n    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();\n    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();\n\n    // Now, resolve the slower request for user 1.\n    // In the buggy version, this would overwrite user 2's data.\n    // In the fixed version, it should be ignored.\n    await act(async () => {\n      resolveRequest('/api/users/1', user1Profile);\n    });\n\n    // After both requests have resolved, the UI should still show Jane Doe.\n    // It should NOT have reverted to John Doe.\n    expect(screen.getByText('Jane Doe')).toBeInTheDocument();\n    expect(screen.getByText('ID: 2')).toBeInTheDocument();\n    expect(screen.getByText('Email: jane@example.com')).toBeInTheDocument();\n    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();\n    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();\n    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();\n  });\n\n  it('clears profile and shows loading when userId changes, then displays new profile', async () => {\n    const { resolveRequest } = fetchMocks;\n    const { rerender } = render(<UserProfileFetcher userId=\"1\" />);\n\n    // Resolve user 1\n    const user1Profile = { id: '1', name: 'John Doe', email: 'john@example.com' };\n    await act(async () => {\n      resolveRequest('/api/users/1', user1Profile);\n    });\n\n    await waitFor(() => {\n      expect(screen.getByText('John Doe')).toBeInTheDocument();\n    });\n\n    // Change to user 2, component should go to loading state\n    rerender(<UserProfileFetcher userId=\"2\" />);\n\n    expect(screen.getByText('Loading profile...')).toBeInTheDocument();\n    expect(screen.queryByText('John Doe')).not.toBeInTheDocument(); // Old profile cleared\n\n    // Resolve user 2\n    const user2Profile = { id: '2', name: 'Jane Doe', email: 'jane@example.com' };\n    await act(async () => {\n      resolveRequest('/api/users/2', user2Profile);\n    });\n\n    await waitFor(() => {\n      expect(screen.getByText('Jane Doe')).toBeInTheDocument();\n      expect(screen.getByText('ID: 2')).toBeInTheDocument();\n    });\n\n    expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();\n    expect(screen.queryByText(/Error/)).not.toBeInTheDocument();\n  });\n});\n"
      }
    }
  }
};
