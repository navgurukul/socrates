import { FileNode } from "../../lib/content/types";

/**
 * Per-track scaffold: the deterministic, non-AI-generated boilerplate that
 * wraps every Battle. Only the buggy component + its test vary between
 * challenges; everything here stays constant so generated challenges always
 * compile and run with a known-good toolchain.
 *
 * `entry` is the editable file the learner fixes (NOT readOnly).
 * `test`  is the readOnly spec that fails on the bug and passes on the fix.
 */
export interface ScaffoldFiles {
  /** Flat map of readOnly/hidden boilerplate files (configs, html, css, entry). */
  boilerplate: Record<string, FileNode>;
  /** Path the buggy component must be written to (e.g. "src/Widget.tsx"). */
  entryPath: (componentName: string) => string;
  /** Path the test must be written to (e.g. "src/Widget.test.tsx"). */
  testPath: (componentName: string) => string;
  /** Files needed on disk to run vitest (everything except the per-challenge src). */
  verifyFiles: Record<string, string>;
}

const FRONTEND_PKG = JSON.stringify(
  {
    name: "battle-challenge",
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
      "@testing-library/jest-dom": "^6.1.4",
    },
  },
  null,
  2
);

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

const VITEST_CONFIG = `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    watch: false,
    setupFiles: ['./vitest.setup.ts'],
  },
})`;

const VITEST_SETUP = `import '@testing-library/jest-dom';`;

const INDEX_CSS = `body { font-family: system-ui; margin: 0; background:#09090b; color:#fff; }
.container { max-width: 480px; margin: 3rem auto; padding: 2rem; background:#18181b; border:1px solid #27272a; border-radius:8px; }
.btn { background:#3b82f6; color:#fff; border:none; padding:12px 24px; border-radius:6px; cursor:pointer; font-size:16px; }
.btn:hover { background:#2563eb; }`;

const htmlFor = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const mainFor = (componentName: string) => `import React from 'react'
import ReactDOM from 'react-dom/client'
import ${componentName} from './${componentName}.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <${componentName} />
  </React.StrictMode>,
)`;

/**
 * Frontend (React + Vite + Vitest) scaffold. Matches the toolchain the
 * hand-authored frontend Battles already ship with.
 */
export function frontendScaffold(title: string, componentName: string): ScaffoldFiles {
  const main = mainFor(componentName);
  const html = htmlFor(title);

  const boilerplate: Record<string, FileNode> = {
    "package.json": { readOnly: true, file: { contents: FRONTEND_PKG } },
    "index.html": { readOnly: true, hidden: true, file: { contents: html } },
    "vite.config.js": { readOnly: true, hidden: true, file: { contents: VITE_CONFIG } },
    "vitest.config.js": { readOnly: true, hidden: true, file: { contents: VITEST_CONFIG } },
    "vitest.setup.ts": { readOnly: true, hidden: true, file: { contents: VITEST_SETUP } },
    "src/main.tsx": { readOnly: true, hidden: true, file: { contents: main } },
    "src/index.css": { readOnly: true, hidden: true, file: { contents: INDEX_CSS } },
  };

  return {
    boilerplate,
    entryPath: (c) => `src/${c}.tsx`,
    testPath: (c) => `src/${c}.test.tsx`,
    verifyFiles: {
      "package.json": FRONTEND_PKG,
      "index.html": html,
      "vite.config.js": VITE_CONFIG,
      "vitest.config.js": VITEST_CONFIG,
      "vitest.setup.ts": VITEST_SETUP,
      "src/main.tsx": main,
      "src/index.css": INDEX_CSS,
    },
  };
}

// ── Backend (Node + Vitest) scaffold ─────────────────────────────────────────

const BACKEND_PKG = JSON.stringify(
  {
    name: "battle-challenge",
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      test: "vitest run",
    },
    devDependencies: {
      vitest: "^0.34.1",
      typescript: "^5.2.2",
      "@types/node": "^20.8.0",
    },
  },
  null,
  2
);

const BACKEND_VITEST_CONFIG = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    watch: false,
  },
})`;

/**
 * Backend (Node + TypeScript + Vitest) scaffold. Pure-logic challenges — no
 * DOM, no React. The learner fixes an exported function/module in src/<Name>.ts
 * and a readOnly spec in src/<Name>.test.ts drives the verify gate.
 */
export function backendScaffold(_title: string, _componentName: string): ScaffoldFiles {
  const boilerplate: Record<string, FileNode> = {
    "package.json": { readOnly: true, file: { contents: BACKEND_PKG } },
    "vitest.config.js": {
      readOnly: true,
      hidden: true,
      file: { contents: BACKEND_VITEST_CONFIG },
    },
  };

  return {
    boilerplate,
    entryPath: (c) => `src/${c}.ts`,
    testPath: (c) => `src/${c}.test.ts`,
    verifyFiles: {
      "package.json": BACKEND_PKG,
      "vitest.config.js": BACKEND_VITEST_CONFIG,
    },
  };
}

export type SupportedTrack = "frontend-debugging" | "backend-debugging";

export function scaffoldForTrack(
  trackId: SupportedTrack,
  title: string,
  componentName: string
): ScaffoldFiles {
  switch (trackId) {
    case "frontend-debugging":
      return frontendScaffold(title, componentName);
    case "backend-debugging":
      return backendScaffold(title, componentName);
    default:
      throw new Error(`No scaffold defined for track "${trackId}"`);
  }
}
