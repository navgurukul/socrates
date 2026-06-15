import { FileNode } from "./types";

/**
 * Whether a battle ships a live preview. Only Vite-app battles (a vite config or
 * a `dev` script) have one; pure-logic battles — e.g. the backend track — have
 * neither and are tests-only, so the arena should not promise a dev server.
 *
 * Single source of truth shared by the dev-server gate (useChallengeSetup) and
 * the preview pane (PreviewPanel) so the two never drift apart.
 */
export function battleHasPreview(files: Record<string, FileNode>): boolean {
  const hasViteConfig =
    "vite.config.js" in files || "vite.config.ts" in files;
  const packageJson = files["package.json"]?.file?.contents ?? "";
  const hasDevScript = packageJson.includes('"dev"');
  return hasViteConfig || hasDevScript;
}
