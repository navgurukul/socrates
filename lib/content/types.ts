export interface FileNode {
  file: {
    contents: string;
  };
  readOnly?: boolean; // Lock specific files (like tests)
  hidden?: boolean; // Internal config files
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Challenge {
  id: string; // Unique slug (e.g., "login-spinner")
  title: string;
  description: string; // Markdown
  difficulty: Difficulty;
  order: number; // For sorting the campaign (1, 2, 3...)
  tech: string[]; // e.g., ["react", "ts", "tailwind"]
  files: Record<string, FileNode>; // Flat map of filepath -> content
}
