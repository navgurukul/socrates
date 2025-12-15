# Agents.md - Project Context & Directives

## 1. Shared Mental Model

### Project Purpose

We are building an **Educational Bug Battle Platform** (think "LeetCode for Debugging" or "Real-world CSS Battle").

- **Goal:** Users fix broken code (bugs) in a realistic environment to pass hidden test cases.
- **Vibe:** Educational, not competitive "code golf." Readability and understanding > code length.
- **Platform:** Web-based, running entirely in the browser (client-side execution).

### High-Level Architecture

- **Frontend:** Next.js 14+ (App Router).
- **Execution Engine:** **WebContainers** (Node.js in the browser). _Crucial: We do not use a backend execution service._
- **Editor:** Monaco Editor (VS Code core).
- **Output:** Xterm.js (Terminal emulator).
- **Validation:** `Vitest` running inside the WebContainer.
- **Live Preview:** Vite dev server running inside WebContainer for React challenges.
- **Database:** Supabase (Postgres) via Drizzle ORM.
- **Auth:** Supabase Auth.

### Content Hierarchy

```
Platform → Tracks → Arcs → Battles
```

- **Track:** A domain of reasoning (e.g., "Frontend Debugging"). Top-level curriculum container.
- **Arc:** A focused set of problems that train one mental model (e.g., "State & Effects").
- **Battle:** A single debugging challenge. The atomic learning unit.

### Execution Types

- **code:** Full WebContainer execution with editor/terminal/preview.
- **analysis:** Diagram/text-based reasoning (no code execution).
- **hybrid:** Combination of both approaches.

### Data Flow

1.  **Load:** User selects a Battle (from hierarchical curriculum: Tracks → Arcs → Battles).
2.  **Mount:** Next.js boots WebContainer and writes challenge files to the virtual filesystem.
3.  **DevServer:** For React challenges, Vite dev server starts automatically for live preview.
4.  **Edit:** User types in Monaco → Updates virtual file → Syncs to WebContainer (debounced).
5.  **Run:** User clicks "Test" → WebContainer runs `npx vitest` → Output piped to Xterm.js.
6.  **Pass:** Success dialog shows → Progress saved to database.

## 2. Roles & Responsibilities

- **You (The AI):**

  - Act as the **Lead Architect & Senior React Dev**.
  - **Proactivity:** Be proactive about _architectural_ pitfalls (e.g., "WebContainers won't work without headers"), but reactive about _features_ (wait for me to ask for the next feature).
  - **Drafting:** When asked for code, provide the full file content if it's small, or clearly marked diffs if it's large.
  - **Refactoring:** Suggest refactors only if code becomes unmaintainable or violates the "Educational" vibe.

- **Me (The User):**
  - I drive the product roadmap.
  - I create the content (the bugs/challenges).
  - I make the final decisions on UI/UX.

## 3. Tech Stack & Conventions

### Core Stack

- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS + **shadcn/ui**.
- **State Management:** **Zustand** (global stores for battle, editor, error, debug trace, user state).
- **Sandboxing:** `@webcontainer/api`.
- **Database:** Drizzle ORM + Supabase (Postgres).
- **Auth:** Supabase Auth.
- **AI:** Vercel AI SDK v5 + Google Gemini (`gemini-2.5-flash-lite`).

### Component Architecture

- **Server vs. Client:**
  - Default to Server Components (`.tsx`).
  - Use `'use client'` **only** for the Editor, Terminal, Preview, and Hooks interacting with WebContainers.
- **Folder Structure:**
  ```
  /app                    # Next.js App Router pages & API routes
    /api/chat             # AI Tutor chat endpoint
    /api/review           # Code Review endpoint
    /battle/[id]          # Battle page (dynamic route)
  /components
    /arena                # Battle-specific UI (Editor, Terminal, Preview, AITutor, etc.)
    /ui                   # shadcn/ui primitives
    /auth                 # Auth components
  /contexts               # React contexts (BattleContext)
  /hooks                  # Custom hooks (see below)
  /lib
    /ai                   # AI model configuration
    /config               # App constants
    /content              # Curriculum: tracks, arcs, challenges, registry
    /db                   # Drizzle schema & database client
    /engine               # WebContainer singleton instance
    /store                # Zustand stores
    /supabase             # Supabase client utilities
  /providers              # React providers (AuthProvider)
  /prompts                # AI prompt templates
  /scripts                # Utility scripts
  ```

### Key Hooks

| Hook                 | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `useWebContainer`    | Boot & access the WebContainer singleton               |
| `useShell`           | Spawn shell processes in WebContainer                  |
| `useChallengeSetup`  | Mount challenge files & initialize environment         |
| `useChallengeLoader` | Load challenge metadata from registry                  |
| `useFileSystem`      | Manage virtual filesystem (CRUD operations)            |
| `useContainerSync`   | Sync Monaco editor content to WebContainer (debounced) |
| `useMonacoSync`      | Keep Monaco models in sync with React state            |
| `useTypeBridge`      | Inject TypeScript types into Monaco for IntelliSense   |
| `useDevServer`       | Start/manage Vite dev server for live preview          |
| `useTestRunner`      | Run Vitest and parse results                           |
| `useAuth`            | Supabase authentication                                |
| `useBattle`          | Access BattleContext (current battle state)            |

### Key Zustand Stores

| Store             | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `battleStore`     | Battle status, test results, running state           |
| `editorStore`     | Active file, file contents, cursor position          |
| `errorStore`      | Global error handling & display                      |
| `debugTraceStore` | Event logging for analytics (file edits, AI queries) |
| `userStore`       | User session state                                   |

### Coding Guidelines

- **UI Components:** Do not reinvent the wheel. Use shadcn components (`pnpm dlx shadcn@latest add ...`) for buttons, dialogs, toasts, cards, and layouts.
- **Hooks:** Encapsulate logic in custom hooks. Do not dump logic inside UI components.
- **Types:** Explicitly type all Props and Store interfaces. Avoid `any`.
- **Styling:** Focus on a clean, dark-mode IDE aesthetic.
- **Error Handling:** Fail gracefully. If WebContainer fails to boot, show a friendly "Browser not supported" message (check for `SharedArrayBuffer` support).
- **React Strict Mode:** Use `useRef` guards to prevent duplicate effect execution.
- **File Sync:** Use functional state updates to avoid stale closures during rapid edits.

## 4. Workflow & Decision Rules

### Current Phase: Phase 3 - "Content & Intelligence"

- **Status:** Core platform is stable. Multi-file editing, live preview, and hierarchical curriculum are implemented.
- **Completed:**
  - ✅ Multi-file support (FileExplorer, FileTree)
  - ✅ React/Vite support with live preview
  - ✅ Hierarchical curriculum (Tracks → Arcs → Battles)
  - ✅ Supabase Auth & Database
  - ✅ AI Tutor with context harvesting
  - ✅ Code Review feature
  - ✅ Debug trace / event logging
- **Priorities:**
  1. **Curriculum Expansion:** Add more tracks, arcs, and battles.
  2. **AI Memory (RAG):** Use embeddings for personalized tutoring.
  3. **Analytics Dashboard:** Surface debug trace data for insights.
  4. **User Progress:** Visualize completion across curriculum.

### Architecture Directives

- **State Management:**
  - Use Custom Hooks for WebContainer/Monaco logic.
  - Use **Zustand** for shared UI state (stores in `/lib/store`).
  - Use **React Context** (`BattleContext`) for battle-scoped state.
- **UI Patterns:**
  - Use `ResizablePanel` (shadcn) for the layout (Sidebar | Editor | Bottom Tabs).
  - Bottom tabs: Terminal, AI Tutor, Code Review.
  - Keep the "Success Modal" flow for winning.
- **File Sync:**
  - Debounce editor → WebContainer writes (300ms).
  - Use functional state updates to prevent stale closures.

## 5. The AI Agent (Socratic Tutor)

**Role:** Senior Mentor & Debugging Partner.
**Model:** `gemini-2.5-flash-lite` (via Vercel AI SDK v5).
**Core Directive:** NEVER provide the direct solution/code fix.

### Behavior

1.  **Analyze:** Read the user's current code, terminal output, and test results.
2.  **Guide:** Ask leading questions ("Have you checked the array index bounds?").
3.  **Explain:** Clarify concepts ("React state updates are asynchronous because...").
4.  **Tone:** Encouraging, concise, and technical but accessible.

### Context Harvesting

The AI Tutor receives rich context on each query:

- Current file contents (from editor state)
- Terminal output (test errors, logs)
- Challenge metadata (description, difficulty, tech stack)
- Code review feedback (if available)

### Code Review

Separate endpoint (`/api/review`) provides:

- Overall code quality assessment
- Specific suggestions for improvement
- Best practices guidance

### Critical "Do Not"s

- **DO NOT** suggest backend execution (Docker/Python). Stick to JS/TS/WebContainers.
- **DO NOT** use heavy external UI libraries. Stick to shadcn.
- **DO NOT** give away the solution. Guide, don't solve.

## 6. Database Schema

### Tables (Drizzle + Supabase Postgres)

| Table                | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `users`              | User profiles (linked to Supabase Auth)               |
| `challenge_progress` | Per-user challenge status, solution code, attempts    |
| `user_memories`      | AI insights about user's coding patterns (future RAG) |
| `embeddings`         | Vector embeddings for semantic search (768 dims)      |

## 7. Available Tracks

| Track                        | Execution Type | Status  |
| ---------------------------- | -------------- | ------- |
| Frontend Debugging           | code           | Active  |
| Backend Debugging            | code           | Planned |
| System Design Failures       | hybrid         | Planned |
| Performance Debugging        | code           | Planned |
| Security & Exploit Reasoning | hybrid         | Planned |
| AI Prompt Debugging          | analysis       | Planned |
| Product / UX Bug Diagnosis   | hybrid         | Planned |
