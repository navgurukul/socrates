"use client";

import { useState, useEffect, memo } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  FileJson,
  FileType,
  Plus,
  Trash2,
  Pencil,
  FilePlus,
} from "lucide-react";
import { TreeNode } from "@/lib/fileUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { FileActionDialog } from "@/components/ui/file-action-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// ... existing getFileIcon helper ...
const getFileIcon = (filename: string) => {
  if (filename.endsWith(".json"))
    return <FileJson className="w-4 h-4 text-yellow-400" />;
  if (filename.endsWith(".ts") || filename.endsWith(".tsx"))
    return <FileCode className="w-4 h-4 text-blue-400" />;
  if (filename.endsWith(".js") || filename.endsWith(".jsx"))
    return <FileCode className="w-4 h-4 text-blue-400" />;
  if (filename.endsWith(".css"))
    return <FileType className="w-4 h-4 text-sky-300" />;
  return <FileCode className="w-4 h-4 text-zinc-400" />;
};

interface FileTreeNodeProps {
  node: TreeNode;
  level: number;
  activeFile: string;
  onSelect: (path: string) => void;
  onAction: (
    action: "create" | "delete" | "rename",
    path: string,
    type: "file" | "folder"
  ) => void;
}

const FileTreeNode = memo(function FileTreeNode({
  node,
  level,
  activeFile,
  onSelect,
  onAction,
}: FileTreeNodeProps) {
  // Initialize isOpen based on whether active file is in this folder's subtree
  const [isOpen, setIsOpen] = useState(() => {
    return node.type === "folder" && activeFile.startsWith(node.path + "/");
  });
  const isSelected = node.path === activeFile;

  // Auto-expand folder when active file is within its subtree
  useEffect(() => {
    if (node.type === "folder" && activeFile.startsWith(node.path + "/")) {
      setIsOpen(true);
    }
  }, [activeFile, node.path, node.type]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") setIsOpen(!isOpen);
    else onSelect(node.path);
  };

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onClick={handleClick}
            className={cn(
              "flex items-center gap-1.5 py-1 px-2 cursor-pointer text-xs select-none transition-colors group",
              isSelected && "bg-emerald-900/30 text-emerald-100 border-l-2 border-emerald-500",
              !isSelected && "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {node.type === "folder" ? (
              <span className="opacity-70">
                {isOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </span>
            ) : (
              <span className="w-3" />
            )}

            {node.type === "folder" ? (
              isOpen ? (
                <FolderOpen className="w-4 h-4 text-zinc-200" />
              ) : (
                <Folder className="w-4 h-4 text-zinc-500" />
              )
            ) : (
              getFileIcon(node.name)
            )}

            <span>{node.name}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300">
          {node.type === "folder" && (
            <ContextMenuItem
              onClick={() => onAction("create", node.path, "file")}
            >
              <FilePlus className="mr-2 h-3.5 w-3.5" /> New File
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={() => onAction("rename", node.path, node.type)}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-zinc-800" />
          <ContextMenuItem
            onClick={() => onAction("delete", node.path, node.type)}
            className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              activeFile={activeFile}
              onSelect={onSelect}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// --------------------------------------------------------
// MAIN EXPORTED COMPONENT
// --------------------------------------------------------

interface FileTreeProps {
  tree: TreeNode[];
  activeFile: string;
  onSelect: (path: string) => void;
  // New props for handling actions
  onCreateFile: (path: string) => void;
  onDelete: (path: string, type: "file" | "folder") => void;
  onRename: (oldPath: string, newPath: string, type: "file" | "folder") => void;
}

export function FileTree({
  tree,
  activeFile,
  onSelect,
  onCreateFile,
  onDelete,
  onRename,
}: FileTreeProps) {
  // Dialog state management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Dialog context
  const [dialogContext, setDialogContext] = useState<{
    path: string;
    type: "file" | "folder";
  }>({ path: "", type: "file" });

  const handleAction = (
    action: "create" | "delete" | "rename",
    path: string,
    type: "file" | "folder"
  ) => {
    setDialogContext({ path, type });
    
    if (action === "delete") {
      setDeleteDialogOpen(true);
    } else if (action === "create") {
      setCreateDialogOpen(true);
    } else if (action === "rename") {
      setRenameDialogOpen(true);
    }
  };

  const handleCreate = (filename: string) => {
    const newPath = dialogContext.path
      ? `${dialogContext.path}/${filename}`
      : filename;
    onCreateFile(newPath);
  };

  const handleRename = (newName: string) => {
    const parts = dialogContext.path.split("/");
    parts.pop(); // remove old name
    const newPath = parts.length > 0 ? `${parts.join("/")}/${newName}` : newName;
    onRename(dialogContext.path, newPath, dialogContext.type);
  };

  const handleDelete = () => {
    onDelete(dialogContext.path, dialogContext.type);
  };

  const handleRootCreate = () => {
    setDialogContext({ path: "", type: "file" });
    setCreateDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={handleRootCreate}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="New file at root"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <ScrollArea className="h-full bg-zinc-950">
        <div className="py-2 pb-10">
          {tree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              level={0}
              activeFile={activeFile}
              onSelect={onSelect}
              onAction={handleAction}
            />
          ))}
        </div>
      </ScrollArea>

      <FileActionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
        targetPath={dialogContext.path}
        onSubmit={handleCreate}
      />

      <FileActionDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        mode="rename"
        targetPath={dialogContext.path}
        defaultValue={dialogContext.path.split("/").pop() || ""}
        onSubmit={handleRename}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${dialogContext.type === "folder" ? "Folder" : "File"}?`}
        message={
          <>
            <p className="text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="text-zinc-200 font-mono">
                {dialogContext.path}
              </span>
              ?
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              This action cannot be undone.
            </p>
          </>
        }
        actionLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
