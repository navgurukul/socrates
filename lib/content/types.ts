export interface FileNode {
  file: {
    contents: string;
  };
  readOnly?: boolean; // Lock specific files (like tests)
  hidden?: boolean; // Internal config files
}

export type Difficulty = "Easy" | "Medium" | "Hard";

// ============================================
// HIERARCHY: Platform → Tracks → Arcs → Battles
// ============================================

/**
 * Execution type determines how the challenge is run
 * - code: Full WebContainer execution with editor/terminal
 * - analysis: Diagram/text-based reasoning (no code execution)
 * - hybrid: Combination of both approaches
 */
export type ExecutionType = "code" | "analysis" | "hybrid";

/**
 * Track represents a domain of reasoning (e.g., Frontend Debugging)
 * Tracks are the top-level curriculum containers.
 */
export interface Track {
  id: string; // e.g., "frontend-debugging"
  title: string; // e.g., "Frontend Debugging"
  description: string;
  primarySkill: string; // e.g., "Debugging UI & stateful systems"
  executionType: ExecutionType;
  supportedTools: string[]; // e.g., ["editor", "terminal", "preview"]
  order: number; // Display order on platform
}

/**
 * Arc represents a focused set of problems that train one mental model.
 * Arcs are the curriculum units within a Track.
 */
export interface Arc {
  id: string; // e.g., "state-and-effects"
  trackId: string; // Parent track reference
  title: string; // e.g., "State & Effects"
  description: string;
  mentalModel: string; // The core concept being taught
  order: number; // Order within the track
}

/**
 * Battle is a single debugging challenge (formerly "Challenge").
 * Battles are the atomic learning units within an Arc.
 */
export interface Battle {
  id: string; // Unique slug (e.g., "login-spinner-bug")
  trackId: string; // Parent track reference
  arcId: string; // Parent arc reference
  title: string;
  description: string; // Markdown
  difficulty: Difficulty;
  order: number; // Order within the arc
  tech: string[]; // e.g., ["react", "ts", "tailwind"]
  files: Record<string, FileNode>; // Flat map of filepath -> content
}

/**
 * @deprecated Use Battle instead. Kept for backward compatibility.
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  tech: string[];
  files: Record<string, FileNode>;
}
