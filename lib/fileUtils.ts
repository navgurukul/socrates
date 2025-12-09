export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
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
