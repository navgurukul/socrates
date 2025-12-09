# Agents.md - Project Context & Directives

## 1. Shared Mental Model

### Project Purpose

We are building an **Educational Bug Battle Platform** (think "LeetCode for Debugging" or "Real-world CSS Battle").

- **Goal:** Users fix broken code (bugs) in a realistic environment to pass hidden test cases.
- **Vibe:** Educational, not competitive "code golf." Readability and understanding > code length.
- **Platform:** Web-based, running entirely in the browser (client-side execution).

### High-Level Architecture

- **Frontend:** Next.js (App Router).
- **Execution Engine:** **WebContainers** (Node.js in the browser). _Crucial: We do not use a backend execution service._
- **Editor:** Monaco Editor (VS Code core).
- **Output:** Xterm.js (Terminal emulator).
- **Validation:** `Vitest` running inside the WebContainer.

### Data Flow

1.  **Load:** User selects a Challenge (fetched from local config `challenges.ts` for MVP).
2.  **Mount:** Next.js mounts the WebContainer and writes the challenge files (`index.js`, `test.spec.js`) to the virtual filesystem.
3.  **Edit:** User types in Monaco -> Updates virtual file.
4.  **Run:** User clicks "Test" -> WebContainer runs `npx vitest` -> Output piped to Xterm.js.

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
- **State Management:** **Zustand** (for global battle state: `isRunning`, `testResults`, `terminalOutput`).
- **Sandboxing:** `@webcontainer/api`.

### Component Architecture

- **Server vs. Client:**
  - Default to Server Components (`.tsx`).
  - Use `'use client'` **only** for the Editor, Terminal, and Hooks interacting with WebContainers.
- **Folder Structure:**
  - `/components/arena`: Battle-specific UI (Editor, Terminal).
  - `/components/ui`: **shadcn/ui** primitives (Button, Card, Badge, etc.).
  - `/lib/engine`: WebContainer logic (singleton pattern).
  - `/stores`: Zustand stores.
  - `/content`: Challenge definitions (JSON/TS objects).

### Coding Guidelines

- **UI Components:** Do not reinvent the wheel. Use shadcn components (`pnpm dlx shadcn@latest add ...`) for buttons, dialogs, toasts, cards, and layouts.
- **Hooks:** Encapsulate logic in custom hooks (e.g., `useWebContainer`, `useBattleRunner`). Do not dump logic inside UI components.
- **Types:** Explicitly type all Props and Store interfaces. Avoid `any`.
- **Styling:** Focus on a clean, dark-mode IDE aesthetic.
- **Error Handling:** Fail gracefully. If WebContainer fails to boot, show a friendly "Browser not supported" message (check for `SharedArrayBuffer` support).

## 4. Workflow & Decision Rules

### Current Phase: Phase 2 - "Realism & Depth"

- **Status:** Core Engine is stable. Now adding depth.
- **Priorities:**
  1. **Multi-File Support:** Implement a File Explorer (Sidebar) to allow editing multiple files.
  2. **React Support:** Enable `.jsx/.tsx` compilation in WebContainers.
  3. **Persistance:** Save user progress locally.
- **Constraint:** Continue to avoid a real backend database. Use `localStorage` for progress.

### Architecture Directives

- **State Management:**
  - Continue using Custom Hooks (`useShell`, `useWebContainer`) for logic.
  - Use **Zustand** only if we need to share state between the File Explorer (Sidebar) and the Editor (Main View).
- **UI Patterns:**
  - Use `ResizablePanel` (shadcn) for the layout (Sidebar | Editor | Terminal).
  - Keep the "Success Modal" flow for winning.

## 5. The AI Agent (Socratic Tutor)

**Role:** Senior Mentor & Debugging Partner.
**Model:** Gemini 1.5 Flash (via Vercel AI SDK).
**Core Directive:** NEVER provide the direct solution/code fix.
**Behavior:**

1.  **Analyze:** Read the user's current code and the latest Vitest error output.
2.  **Guide:** Ask leading questions ("Have you checked the array index bounds?").
3.  **Explain:** Clarify concepts ("React state updates are asynchronous because...").
4.  **Tone:** Encouraging, concise, and technical but accessible.

### Critical "Do Not"s

- **DO NOT** suggest backend execution (Docker/Python). Stick to JS/TS/WebContainers.
- **DO NOT** use heavy external UI libraries. Stick to shadcn.
