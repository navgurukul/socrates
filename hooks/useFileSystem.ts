import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { createLogger } from "@/lib/logger";
import { useEditorStore } from "@/lib/store/editorStore";
import { useErrorStore } from "@/lib/store/errorStore";
import {
  createFileSnapshot,
  createFileSnapshots,
  getFilesInFolder,
  type FileSnapshot,
} from "@/lib/fileUtils";

const logger = createLogger("FileSystem");

export function useFileSystem(instance: WebContainer | null) {
  const createFileInStore = useEditorStore((state) => state.createFile);
  const deleteFile = useEditorStore((state) => state.deleteFile);
  const fileContents = useEditorStore((state) => state.fileContents);
  const setFileOperationError = useErrorStore((state) => state.setFileOperationError);
  
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
          // Set error in error store
          setFileOperationError("create", path, error as Error, true);
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
      // 1. Validate
      if (type === "file" && !fileContents[path]) {
        logger.warn("Cannot delete: file does not exist", { path });
        return;
      }

      // 2. Create snapshot for rollback
      const affectedPaths = type === "file" ? [path] : getFilesInFolder(path, fileContents);
      const snapshots = createFileSnapshots(affectedPaths, fileContents);

      // 3. Execute container operation first (can fail)
      if (instance) {
        try {
          await instance.fs.rm(path, { recursive: true, force: true });
        } catch (error) {
          logger.error("Failed to delete path in container", { path, error });
          // Set error in error store
          setFileOperationError("delete", path, error as Error, true);
          // Container operation failed - no rollback needed (UI not yet updated)
          return;
        }
      }

      // 4. Update Store only after successful container operation
      if (type === "file") {
        deleteFile(path);
      } else {
        // Delete all files in folder
        affectedPaths.forEach((filePath) => {
          deleteFile(filePath);
        });
      }

      logger.debug("Path deleted successfully", { path, type });
    },
    [deleteFile, fileContents, instance]
  );

  const renamePath = useCallback(
    async (oldPath: string, newPath: string, type: "file" | "folder") => {
      // 1. Validate
      if (type === "file" && !fileContents[oldPath]) {
        logger.warn("Cannot rename: file does not exist", { oldPath });
        return;
      }

      // 2. Prepare rename mapping
      const filesToRename: Array<{ old: string; new: string; content: string }> = [];

      if (type === "file") {
        filesToRename.push({
          old: oldPath,
          new: newPath,
          content: fileContents[oldPath],
        });
      } else {
        const affectedFiles = getFilesInFolder(oldPath, fileContents);
        affectedFiles.forEach((key) => {
          const renamedKey = key.replace(oldPath, newPath);
          filesToRename.push({
            old: key,
            new: renamedKey,
            content: fileContents[key],
          });
        });
      }

      // 3. Execute container operation first (can fail)
      if (instance) {
        try {
          await instance.fs.rename(oldPath, newPath);
        } catch (error) {
          logger.error("Failed to rename path in container", {
            oldPath,
            newPath,
            error,
          });
          // Set error in error store
          setFileOperationError("rename", oldPath, error as Error, true);
          // Container operation failed - no rollback needed (UI not yet updated)
          return;
        }
      }

      // 4. Update Store only after successful container update
      filesToRename.forEach(({ old: oldKey, new: newKey, content }) => {
        deleteFile(oldKey);
        createFileInStore(newKey);
        // Content will be synced back by useContainerSync
      });

      logger.debug("Path renamed successfully", { oldPath, newPath, type });
    },
    [fileContents, deleteFile, createFileInStore, instance]
  );

  return { createFile, deletePath, renamePath };
}
