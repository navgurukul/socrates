"use client";

import { useState } from "react";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

function FileTreeNode({
  node,
  level,
  activeFile,
  onSelect,
  onAction,
}: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = node.path === activeFile;

  if (activeFile.startsWith(node.path + "/") && !isOpen) {
    setIsOpen(true);
  }

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
            className={`
              flex items-center gap-1.5 py-1 px-2 cursor-pointer text-xs select-none transition-colors group
              ${
                isSelected
                  ? "bg-emerald-900/30 text-emerald-100 border-l-2 border-emerald-500"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              }
            `}
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
}

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [targetPath, setTargetPath] = useState("");
  const [targetType, setTargetType] = useState<"file" | "folder">("file");
  const [inputValue, setInputValue] = useState("");

  const handleAction = (
    action: "create" | "delete" | "rename",
    path: string,
    type: "file" | "folder"
  ) => {
    if (action === "delete") {
      if (confirm(`Delete ${path}?`)) onDelete(path, type);
      return;
    }

    setTargetPath(path);
    setTargetType(type);
    setDialogMode(action);
    setInputValue(action === "rename" ? path.split("/").pop() || "" : "");
    setDialogOpen(true);
  };

  const submitDialog = () => {
    if (!inputValue.trim()) return;

    if (dialogMode === "create") {
      // Create new file inside the target folder path
      const newPath = `${targetPath}/${inputValue}`;
      onCreateFile(newPath);
    } else {
      // Rename logic: reconstruct path with new name
      const parts = targetPath.split("/");
      parts.pop(); // remove old name
      const newPath =
        parts.length > 0 ? `${parts.join("/")}/${inputValue}` : inputValue;
      onRename(targetPath, newPath, targetType);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <ScrollArea className="h-full bg-zinc-950">
        <div className="py-2 pb-10">
          {/* Add a "Root" creator just in case */}
          {/* You might want a button here to create files at root level */}

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create New File" : "Rename File"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-zinc-500">
                {dialogMode === "create"
                  ? `Creating in: ${targetPath}/`
                  : `Original: ${targetPath}`}
              </span>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-zinc-950 border-zinc-700 focus-visible:ring-emerald-600"
                placeholder="filename.tsx"
                onKeyDown={(e) => e.key === "Enter" && submitDialog()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitDialog}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {dialogMode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
