# Socrates - Bug Battle Platform

An interactive "LeetCode for Debugging" platform where users fix broken code in a realistic browser-based environment. Think CSS Battle meets real-world debugging challenges.

## Features

- **Browser-Based Execution** - Code runs entirely in the browser using WebContainers (no backend execution service)
- **Monaco Editor** - VS Code-like editing experience with full IntelliSense support
- **Multi-File Support** - File explorer sidebar for navigating and editing multiple files
- **Real-Time Terminal** - Xterm.js terminal for viewing test output
- **AI Tutor** - Socratic guidance from an AI assistant (never gives direct answers, only hints)
- **Vitest Integration** - Hidden test cases validate user solutions

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Editor:** Monaco Editor
- **Terminal:** Xterm.js
- **Sandboxing:** @webcontainer/api
- **AI:** Vercel AI SDK with Gemini 1.5 Flash

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

> **Note:** WebContainers require specific HTTP headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`). These are configured in `next.config.ts`.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/chat/           # AI tutor API route
│   └── battle/[id]/        # Challenge battle arena
├── components/
│   ├── arena/              # Battle-specific UI (Editor, Terminal, FileTree)
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
│   ├── useWebContainer.ts  # WebContainer lifecycle
│   ├── useFileSystem.ts    # Virtual file system management
│   ├── useShell.ts         # Terminal shell integration
│   └── useTypeBridge.ts    # Monaco IntelliSense setup
├── lib/
│   ├── content/            # Challenge definitions
│   ├── engine/             # WebContainer singleton
│   └── store/              # Zustand stores
```

## Creating Challenges

Challenges are defined in `lib/content/challenges/`. Each challenge includes:

- Buggy source files for users to fix
- Hidden Vitest test cases for validation
- Metadata (difficulty, description, hints)

See existing challenges for examples.

## Browser Compatibility

WebContainers require `SharedArrayBuffer` support, which needs:

- Modern Chrome, Edge, or Firefox
- Proper COOP/COEP headers (configured in Next.js)

Safari is currently not supported.
