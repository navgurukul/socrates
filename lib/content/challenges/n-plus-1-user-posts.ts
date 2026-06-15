import { Battle } from "../types";

// AUTHORED via scripts/author-challenge.ts — verified buggy (fails) + fixable (passes).
// Bug: Loops users and awaits getPostsByUser per user (N+1). Fix batches into a single getPostsByUsers call keyed by id.
export const nPlus1UserPostsBattle: Battle = {
  "id": "n-plus-1-user-posts",
  "trackId": "backend-debugging",
  "arcId": "n-plus-1-queries",
  "title": "User List Fires a Query per User",
  "description": "Severity: High\nComponent: getUsersWithPosts\nContext: getUsersWithPosts returns all users with their posts attached. As the user count grows, the endpoint slows down dramatically and the database shows a flood of near-identical post queries.\n\nReproduction:\n1. Load the endpoint with N users in the database.\n2. Inspect the query log.\n3. Observe 1 query for users plus one additional query per user (N+1 total).\n\nExpected: Posts for all users are fetched with a single batched query; total queries stay constant (does not grow per user).",
  "difficulty": "Medium",
  "order": 1,
  "tech": [
    "typescript",
    "node",
    "vitest"
  ],
  "files": {
    "package.json": {
      "readOnly": true,
      "file": {
        "contents": "{\n  \"name\": \"battle-challenge\",\n  \"private\": true,\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"test\": \"vitest run\"\n  },\n  \"devDependencies\": {\n    \"vitest\": \"^0.34.1\",\n    \"typescript\": \"^5.2.2\",\n    \"@types/node\": \"^20.8.0\"\n  }\n}"
      }
    },
    "vitest.config.js": {
      "readOnly": true,
      "hidden": true,
      "file": {
        "contents": "import { defineConfig } from 'vitest/config'\n\nexport default defineConfig({\n  test: {\n    environment: 'node',\n    globals: true,\n    watch: false,\n  },\n})"
      }
    },
    "src/UserService.ts": {
      "file": {
        "contents": "export interface Db {\n  getUsers: () => Promise<{ id: number; name: string }[]>\n  getPostsByUser: (userId: number) => Promise<string[]>\n  getPostsByUsers: (userIds: number[]) => Promise<Record<number, string[]>>\n}\n\nexport interface UserWithPosts {\n  id: number\n  name: string\n  posts: string[]\n}\n\n/**\n * Returns every user with their posts attached.\n */\nexport async function getUsersWithPosts(db: Db): Promise<UserWithPosts[]> {\n  const users = await db.getUsers()\n\n  // BUG: N+1 queries — one getPostsByUser call per user. With N users this is\n  // 1 + N round trips to the database.\n  const result: UserWithPosts[] = []\n  for (const user of users) {\n    const posts = await db.getPostsByUser(user.id)\n    result.push({ ...user, posts })\n  }\n  return result\n}\n"
      }
    },
    "src/UserService.test.ts": {
      "readOnly": true,
      "file": {
        "contents": "import { expect, test, vi } from 'vitest'\nimport { getUsersWithPosts, type Db } from './UserService'\n\ntest('posts are loaded in one batched query, not one per user', async () => {\n  const getPostsByUser = vi.fn(async (id: number) => [`post-${id}`])\n  const getPostsByUsers = vi.fn(async (ids: number[]) =>\n    Object.fromEntries(ids.map((id) => [id, [`post-${id}`]]))\n  )\n  const db: Db = {\n    getUsers: async () => [\n      { id: 1, name: 'a' },\n      { id: 2, name: 'b' },\n      { id: 3, name: 'c' },\n    ],\n    getPostsByUser,\n    getPostsByUsers,\n  }\n\n  const result = await getUsersWithPosts(db)\n\n  expect(result).toEqual([\n    { id: 1, name: 'a', posts: ['post-1'] },\n    { id: 2, name: 'b', posts: ['post-2'] },\n    { id: 3, name: 'c', posts: ['post-3'] },\n  ])\n  // The per-user query must not be used; a single batched call replaces it.\n  expect(getPostsByUser).not.toHaveBeenCalled()\n  expect(getPostsByUsers).toHaveBeenCalledTimes(1)\n})\n"
      }
    }
  }
};
