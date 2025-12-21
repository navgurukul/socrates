# Agents.md - Project Context & Directives

## Recent Updates ✨

**Last Updated**: December 2025

### Latest Features & Improvements

#### Memory Loop System (✅ Completed)

- **Observation Phase**: On battle completion, debug trace is analyzed to extract learning insights
- **Storage Phase**: Insights are embedded (768-dim vectors) and stored in Supabase with pgvector
- **Recall Phase**: When users ask for help, relevant past insights are retrieved and injected into AI tutor context
- **New Tables**: Extended `user_memories` (added `challengeId`, `traceSummary`) and `embeddings` (added `userId`)
- **New Endpoints**: `/api/insight` for insight creation
- **New Utilities**: `lib/ai/insights.ts` (generation), `lib/ai/retrieval.ts` (semantic search)
- **Personalized AI**: Tutor adapts guidance based on user's historical debugging patterns

#### Daily Battles System (✅ Completed)

- **Scheduled Challenges**: Admin-curated daily battles with optional themes
- **Streak Tracking**: Current and max streak persistence with timezone-aware date handling
- **Visual Carousel**: Interactive carousel showing past/present/future challenges with countdown timers
- **New Database Tables**: `daily_schedule`, `daily_progress`, `user_streaks`
- **Server Actions**: Optimized data fetching with `getDailyBattlesForCarousel()`, `getUserStreak()`, etc.

#### Track Visualization (✅ Completed)

- **Arc Timeline**: Visual SVG-based timeline showing learning progression
- **Battle Nodes**: Interactive nodes with completion states (locked, available, in-progress, completed)
- **Progress Tracking**: Server-side calculation of completion percentages
- **New Components**: `ArcTimeline`, `BattleNode`, `TrackHeader`, `ProgressBar`

#### AI Enhancements (✅ Completed)

- **Vercel AI SDK v5**: Migrated to new `Chat` class with `DefaultChatTransport`
- **Enhanced Context**: Auto-refresh on test output changes, review data integration
- **Debug Trace Logging**: All AI interactions tracked for analytics
- **Auto Code Review**: Triggered on battle completion with structured feedback

#### Infrastructure Improvements

- **Server Actions Pattern**: Moved from client-side fetching to Next.js server actions
- **Timezone Handling**: Local date storage for consistent daily experience
- **Optimistic UI**: Streak updates and progress tracking
- **Script Utilities**: `seed-daily-schedule.ts`, `verify-tracks.ts` for admin tasks

---

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
    /api/insight          # AI Insight creation endpoint (Memory Loop)
    /api/review           # Code Review endpoint
    /battle/[id]          # Battle page (dynamic route)
    /tracks               # Learning tracks pages
      /[trackId]          # Track detail pages with arc timeline
  /components
    /arena                # Battle-specific UI (Editor, Terminal, Preview, AITutor, etc.)
    /daily                # Daily battle components (Carousel, Cards)
    /tracks               # Track-specific UI (TrackCard, ArcTimeline, BattleNode)
    /ui                   # shadcn/ui primitives
    /auth                 # Auth components
  /contexts               # React contexts (BattleContext)
  /hooks                  # Custom hooks (see below)
  /lib
    /actions              # Server actions (daily-battles, progress, track-progress)
    /ai                   # AI model configuration
    /config               # App constants
    /content              # Curriculum: tracks, arcs, challenges, registry
    /db                   # Drizzle schema & database client
    /engine               # WebContainer singleton instance
    /store                # Zustand stores
    /supabase             # Supabase client utilities
  /providers              # React providers (AuthProvider)
  /prompts                # AI prompt templates
  /scripts                # Utility scripts (seed-daily-schedule, verify-tracks)
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

### Current Phase: Phase 4 - "Daily Battles & Progress Visualization"

- **Status:** Core platform is stable. Multi-file editing, live preview, hierarchical curriculum, and daily battles are implemented.
- **Completed:**
  - ✅ Multi-file support (FileExplorer, FileTree)
  - ✅ React/Vite support with live preview
  - ✅ Hierarchical curriculum (Tracks → Arcs → Battles)
  - ✅ Supabase Auth & Database
  - ✅ AI Tutor with context harvesting
  - ✅ Code Review feature
  - ✅ Debug trace / event logging
  - ✅ **Daily Battles System** - Scheduled daily challenges with streak tracking
  - ✅ **Daily Battle Carousel** - Visual carousel showing past, present, and future daily challenges
  - ✅ **User Streak Tracking** - Current and max streak persistence
  - ✅ **Track Progress Pages** - Visual arc timeline with battle nodes
  - ✅ **Server Actions** - Optimized data fetching for daily battles and progress
- **Priorities:**
  1. **Curriculum Expansion:** Add more tracks, arcs, and battles.
  2. **AI Memory (RAG):** Use embeddings for personalized tutoring.
  3. **Analytics Dashboard:** Surface debug trace data for insights.
  4. **Social Features:** Leaderboards, sharing solutions, community challenges.

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

- **Current file contents** (from editor state)
- **Terminal output** (test errors, logs)
- **Challenge metadata** (description, difficulty, tech stack)
- **Code review feedback** (if available, auto-generated on battle completion)
- **Attempt count** (tracked for personalized guidance)

**Context Refresh Strategy:**

- Context automatically refreshes when test output changes
- Manual refresh available via key increment
- Review data injected into transport body for seamless context updates

**Debug Trace Integration:**
All AI interactions are logged to the debug trace store:

```typescript
// Tracked events:
- ai_hint_requested: When user asks a question
- ai_hint_received: When assistant responds
- Metadata includes attempt count for analysis
```

### Code Review

Separate endpoint ([`/api/review`](file:///Users/souvik/Desktop/socrates/app/api/review/route.ts)) provides:

- **Overall code quality assessment** (summary of solution approach)
- **Specific suggestions for improvement** (targeted feedback on code patterns)
- **Best practices guidance** (React best practices, anti-patterns to avoid)
- **Senior dev tip** (one actionable insight for growth)

**Auto-Trigger on Success:**
When a user passes a battle, code review is automatically fetched and displayed in the AI Tutor panel:

```typescript
// In BattleContext.tsx
useEffect(() => {
  if (status === "passed" && !hasHandledPassRef.current) {
    hasHandledPassRef.current = true;

    // Fetch review with final code
    fetch("/api/review", {
      method: "POST",
      body: JSON.stringify({ files: fileContents }),
    });
  }
}, [status, fileContents]);
```

**UI Integration:**
Review displays in AI Tutor panel with structured sections:

- ✅ Summary (overall assessment)
- ⚠️ Suggestions (areas for improvement)
- 💡 Senior Tip (one key insight)

**Model Configuration:**
Uses `gemini-2.5-flash-lite` for balanced speed and quality (defined in [`lib/ai/models.ts`](file:///Users/souvik/Desktop/socrates/lib/ai/models.ts)).

### Critical "Do Not"s

- **DO NOT** suggest backend execution (Docker/Python). Stick to JS/TS/WebContainers.
- **DO NOT** use heavy external UI libraries. Stick to shadcn.
- **DO NOT** give away the solution. Guide, don't solve.

## 5.1 Recent AI Enhancements

### Vercel AI SDK v5 Migration

The platform now uses Vercel AI SDK v5 with improved streaming and context management:

**Key Changes:**

- Migrated from legacy `useChat` to new `Chat` class with `DefaultChatTransport`
- Context injection via transport body (not URL params)
- Improved message handling with typed `UIMessage` interface
- Better streaming performance with reduced latency

**Implementation Pattern:**

```typescript
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

const chat = useMemo(() => {
  const transport = new DefaultChatTransport<UIMessage>({
    api: "/api/chat",
    body: {
      context: { files, error, review },
    },
  });
  return new Chat({ transport });
}, [contextRefreshKey, reviewData]);

const { messages, sendMessage, status } = useChat<UIMessage>({ chat });
```

**Benefits:**

- Automatic context updates when dependencies change
- Type-safe message parts extraction
- Better error handling and retry logic
- Reduced bundle size

### Context-Aware Tutoring

The AI Tutor adapts its guidance based on:

1. **User Progress**: Number of attempts tracked and passed to AI
2. **Test Results**: Real-time terminal output analyzed for hints
3. **Code Quality**: Post-success review provides growth-focused feedback
4. **Conversation History**: Maintains context across multiple questions

**Prompt Engineering:**

- System prompt emphasizes Socratic method
- Context injected as structured data (not plain text)
- Model instructed to never provide direct solutions
- Encourages leading questions and concept explanations

## 6. Daily Battles System

### Overview

Daily Battles provide a "daily challenge" experience similar to Wordle or LeetCode's daily problems. Users can complete one curated challenge per day to maintain streaks and build consistent learning habits.

### Key Features

**1. Scheduled Challenges**

- Admin-curated schedule maps dates to specific challenge IDs
- Supports optional themes (e.g., "Flexbox Friday", "Async Monday")
- Seeded via script: `npx tsx scripts/seed-daily-schedule.ts seed [days]`

**2. Streak Tracking**

- **Current Streak**: Consecutive days of completing daily battles
- **Max Streak**: Personal record for longest streak
- Streaks reset if a day is missed (no completion on user's local date)
- Cached in `user_streaks` table for performance

**3. Visual Carousel**

- Shows past, present (today), and future daily battles
- Past battles display completion status and score
- Today's battle is highlighted with special styling
- Future battles show countdown timers
- Built with shadcn carousel (Embla Carousel)

**4. Timezone Handling**

- All dates stored as local dates (YYYY-MM-DD), not UTC timestamps
- Server actions accept `timezoneOffset` parameter for accurate date calculation
- Ensures consistent "daily" experience regardless of user location

### Server Actions

| Action                         | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `getTodaysBattle()`            | Fetch today's scheduled battle with user progress          |
| `getUserStreak()`              | Get current and max streak for authenticated user          |
| `getDailyBattlesForCarousel()` | Fetch carousel data (past/present/future) with progress    |
| `getDailyBattleHistory()`      | Get last N days of user's daily battle completions         |
| `completeDailyBattle()`        | Mark battle as complete and update streak (called on pass) |

### UI Components

**Components:**

- [`DailyBattleCarousel`](file:///Users/souvik/Desktop/socrates/components/daily/DailyBattleCarousel.tsx) - Main carousel container with navigation
- [`DailyChallengeCard`](file:///Users/souvik/Desktop/socrates/components/daily/DailyChallengeCard.tsx) - Single challenge card (deprecated in favor of carousel)
- [`DailyBattleSection`](file:///Users/souvik/Desktop/socrates/components/daily/DailyBattleSection.tsx) - Section wrapper for homepage

**Design Patterns:**

- Use `'use client'` for interactive components (countdown timers, carousel navigation)
- Server Components for data fetching (async/await in page components)
- Optimistic UI updates for streak increments

### Integration Example

```typescript
// In a Server Component (page.tsx)
import { DailyBattleCarousel } from "@/components/daily/DailyBattleCarousel";
import { getDailyBattlesForCarousel } from "@/lib/actions/daily-battles";

export default async function HomePage() {
  const dailyBattles = await getDailyBattlesForCarousel(1, 3); // 1 past, 3 future

  return (
    <main>
      <DailyBattleCarousel items={dailyBattles} />
    </main>
  );
}
```

### Migration & Seeding

**Database Migration:**

```bash
# Migration file: drizzle/0001_daily_battles_only.sql
# Creates: daily_schedule, daily_progress, user_streaks tables
```

**Seeding Daily Schedule:**

```bash
# Seed 30 days of challenges (round-robin through available battles)
npx tsx scripts/seed-daily-schedule.ts seed 30

# Clear existing schedule
npx tsx scripts/seed-daily-schedule.ts clear
```

## 7. Database Schema

### Tables (Drizzle + Supabase Postgres)

| Table                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `users`              | User profiles (linked to Supabase Auth)                          |
| `challenge_progress` | Per-user challenge status, solution code, attempts               |
| `user_memories`      | AI insights about user's coding patterns (future RAG)            |
| `embeddings`         | Vector embeddings for semantic search (768 dims)                 |
| `daily_schedule`     | Admin-curated daily battle schedule (date → challengeId mapping) |
| `daily_progress`     | User completion tracking for daily battles (composite PK)        |
| `user_streaks`       | Cached streak data (current streak, max streak, last completed)  |

### Daily Battles Data Model

The daily battles system uses three interconnected tables:

1. **`daily_schedule`**: Maps dates (YYYY-MM-DD) to challenge IDs. Supports optional themes (e.g., "Flexbox Friday").
2. **`daily_progress`**: Tracks completion per user per date with status (`solved`, `failed`, `skipped`).
3. **`user_streaks`**: Cached aggregation of consecutive daily completions for performance.

**Key Design Decisions:**

- Dates are stored as local dates (user timezone), not UTC timestamps
- Composite primary key on `(userId, date)` ensures one completion per day
- Streaks are calculated server-side and cached for efficient retrieval

## 8. Track Visualization & Progress

### Arc Timeline

The track detail pages ([`/tracks/[trackId]`](file:///Users/souvik/Desktop/socrates/app/tracks/[trackId]/page.tsx)) feature a visual arc timeline that shows the learning progression within a track.

**Components:**

- [`ArcTimeline`](file:///Users/souvik/Desktop/socrates/components/tracks/ArcTimeline.tsx) - Main timeline container with SVG path
- [`BattleNode`](file:///Users/souvik/Desktop/socrates/components/tracks/BattleNode.tsx) - Individual battle nodes with completion status
- [`TrackHeader`](file:///Users/souvik/Desktop/socrates/components/tracks/TrackHeader.tsx) - Track metadata and progress summary
- [`ProgressBar`](file:///Users/souvik/Desktop/socrates/components/tracks/ProgressBar.tsx) - Visual progress indicator

**Visual Design:**

- Battles arranged along a curved SVG path
- Nodes show completion status (locked, available, in-progress, completed)
- Arc sections grouped with labels and descriptions
- Responsive layout adapts to mobile/desktop

**Server Actions:**

- `getTracksWithProgress()` - Fetch all tracks with user completion percentages
- `getTrackWithProgress(trackId)` - Fetch single track with arc and battle details

### Progress Tracking

**Completion States:**

- **Locked**: Previous battles in arc not completed
- **Available**: Ready to attempt
- **In Progress**: Started but not completed
- **Completed**: All tests passed

**Progress Calculation:**

```typescript
// Calculated server-side in track-progress.ts
const completionPercentage = (completedBattles / totalBattles) * 100;
```

## 9. Available Tracks & Arcs

### Tracks Overview

| Track                        | Execution Type | Status  | Arcs |
| ---------------------------- | -------------- | ------- | ---- |
| Frontend Debugging           | code           | Active  | 5    |
| Backend Debugging            | code           | Planned | 2    |
| System Design Failures       | hybrid         | Planned | 1    |
| Performance Debugging        | code           | Planned | 0    |
| Security & Exploit Reasoning | hybrid         | Planned | 1    |
| AI Prompt Debugging          | analysis       | Planned | 1    |
| Product / UX Bug Diagnosis   | hybrid         | Planned | 1    |

### Frontend Debugging Arcs (Active Track)

| Arc                   | Mental Model                                                  | Battles |
| --------------------- | ------------------------------------------------------------- | ------- |
| Foundations           | Disciplined observation before editing                        | 3       |
| State & Mutations     | State is immutable. Mutations break React's update detection. | 1       |
| Effects & Closures    | Effects capture values at render time                         | 1       |
| Async & Data Flow     | Track data through async boundaries. Handle all states.       | 0       |
| Performance & Renders | Understand when and why components re-render                  | 1       |

### Planned Arcs (Other Tracks)

- **Backend:** Race Conditions, N+1 Queries
- **System Design:** Memory Leaks
- **Security:** Input Sanitization
- **AI Prompt:** Hallucination Debugging
- **Product/UX:** Broken User Flows
