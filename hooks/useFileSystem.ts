import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { createLogger } from "@/lib/logger";
import { useEditorStore } from "@/lib/store/editorStore";

const logger = createLogger("FileSystem");

export function useFileSystem(instance: WebContainer | null) {
  const createFileInStore = useEditorStore((state) => state.createFile);
  const deleteFile = useEditorStore((state) => state.deleteFile);
  const fileContents = useEditorStore((state) => state.fileContents);
  const createFile = useCallback(
    async (path: string): Promise<{ success: boolean; reason?: string }> => {
      // 1. Update store (existence check is handled by store)
      const result = createFileInStore(path);
      if (!result.success) {
        return result;
      }

      // 2. Update WebContainer filesystem
      if (instance) {
        try {
          await instance.fs.writeFile(path, "");
        } catch (error) {
          logger.error("Failed to create file in container", { path, error });
          // Rollback store state on failure
          deleteFile(path);
          return { success: false, reason: "Filesystem error" };
        }
      }
      return { success: true };
    },
    [createFileInStore, deleteFile, instance]
  );

  const deletePath = useCallback(
    async (path: string, type: "file" | "folder") => {
      // 1. Update Store (UI)
      if (type === "file") {
        deleteFile(path);
      } else {
        // Delete all files in folder
        Object.keys(fileContents).forEach((key) => {
          if (key.startsWith(path + "/")) {
            deleteFile(key);
          }
        });
      }

      // 2. Update Container (Real System)
      if (instance) {
        try {
          await instance.fs.rm(path, { recursive: true, force: true });
        } catch (error) {
          logger.error("Failed to delete path in container", { path, error });
        }
      }
    },
    [deleteFile, fileContents, instance]
  );

  const renamePath = useCallback(
    async (oldPath: string, newPath: string, type: "file" | "folder") => {
      // 1. Save old content before renaming
      const oldContent = fileContents[oldPath];
      const filesToRename: Array<{ old: string; new: string; content: string }> = [];

      if (type === "file") {
        filesToRename.push({ old: oldPath, new: newPath, content: oldContent });
      } else {
        Object.keys(fileContents).forEach((key) => {
          if (key.startsWith(oldPath + "/")) {
            const renamedKey = key.replace(oldPath, newPath);
            filesToRename.push({
              old: key,
              new: renamedKey,
              content: fileContents[key],
            });
          }
        });
      }

      // 2. Update Container first (can fail)
      if (instance) {
        try {
          await instance.fs.rename(oldPath, newPath);
        } catch (error) {
          logger.error("Failed to rename path in container", {
            oldPath,
            newPath,
            error,
          });
          return; // Don't update store if container fails
        }
      }

      // 3. Update Store only after successful container update
      filesToRename.forEach(({ old: oldKey, new: newKey, content }) => {
        deleteFile(oldKey);
        createFileInStore(newKey);
        // Content will be synced back by useContainerSync
      });
    },
    [fileContents, deleteFile, createFileInStore, instance]
  );

  return { createFile, deletePath, renamePath };
}
