export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

/**
 * File snapshot for rollback operations
 */
export interface FileSnapshot {
  path: string;
  content: string;
  existed: boolean;
}

/**
 * Operation context for tracking file operations and rollback
 */
export interface OperationContext {
  type: "create" | "delete" | "rename";
  snapshots: FileSnapshot[];
}

/**
 * Filesystem interface compatible with WebContainer API
 */
export interface FileSystem {
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

/**
 * Ensures parent directories exist before writing a file
 * @param fs - Filesystem interface with mkdir method
 * @param filePath - Full path to the file
 */
export async function ensureDirectory(
  fs: FileSystem,
  filePath: string
): Promise<void> {
  const parts = filePath.split("/");
  if (parts.length <= 1) return; // No directory needed (root level file)

  const dirPath = parts.slice(0, -1).join("/");
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory might already exist - this is not an error
  }
}

export function buildFileTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (existingNode.type === "folder" && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const isFile = index === parts.length - 1;
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };

        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  // Sort: Folders first, then files (alphabetical)
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);
  return root;
}

/**
 * Create a snapshot of a file's current state
 * @param path - File path
 * @param fileContents - Current file contents map
 * @returns FileSnapshot containing current state
 */
export function createFileSnapshot(
  path: string,
  fileContents: Record<string, string>
): FileSnapshot {
  return {
    path,
    content: fileContents[path] || "",
    existed: path in fileContents,
  };
}

/**
 * Create snapshots for multiple files (e.g., folder operations)
 * @param paths - Array of file paths
 * @param fileContents - Current file contents map
 * @returns Array of FileSnapshots
 */
export function createFileSnapshots(
  paths: string[],
  fileContents: Record<string, string>
): FileSnapshot[] {
  return paths.map((path) => createFileSnapshot(path, fileContents));
}

/**
 * Get all file paths that would be affected by a folder operation
 * @param folderPath - Path to the folder
 * @param fileContents - Current file contents map
 * @returns Array of file paths within the folder
 */
export function getFilesInFolder(
  folderPath: string,
  fileContents: Record<string, string>
): string[] {
  const normalizedPath = folderPath.endsWith("/") ? folderPath : folderPath + "/";
  return Object.keys(fileContents).filter((key) =>
    key.startsWith(normalizedPath)
  );
}
