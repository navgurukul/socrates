import React, { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export function useFileSystem(
  fileContents: Record<string, string>,
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  instance: WebContainer | null
) {
  const createFile = useCallback(
    async (path: string) => {
      // Use functional update to check and avoid stale closures
      let alreadyExists = false;
      setFileContents((prev) => {
        if (prev[path]) {
          alreadyExists = true;
          return prev;
        }
        return { ...prev, [path]: "" };
      });

      if (alreadyExists) return false;

      // 2. Update Container (Real System)
      if (instance) {
        try {
          await instance.fs.writeFile(path, "");
        } catch (e) {
          console.error("Failed to create file in container", e);
        }
      }
      return true;
    },
    [setFileContents, instance]
  );

  const deletePath = useCallback(
    async (path: string, type: "file" | "folder") => {
      // 1. Update State (UI) with functional update
      setFileContents((prev) => {
        const newFiles = { ...prev };
        if (type === "file") {
          delete newFiles[path];
        } else {
          Object.keys(newFiles).forEach((key) => {
            if (key.startsWith(path + "/")) {
              delete newFiles[key];
            }
          });
        }
        return newFiles;
      });

      // 2. Update Container (Real System)
      if (instance) {
        try {
          await instance.fs.rm(path, { recursive: true, force: true });
        } catch (e) {
          console.error("Failed to delete path in container", e);
        }
      }
    },
    [setFileContents, instance]
  );

  const renamePath = useCallback(
    async (oldPath: string, newPath: string, type: "file" | "folder") => {
      // 1. Update State (UI) with functional update
      setFileContents((prev) => {
        const newFiles = { ...prev };

        if (type === "file") {
          const content = newFiles[oldPath];
          delete newFiles[oldPath];
          newFiles[newPath] = content;
        } else {
          Object.keys(newFiles).forEach((key) => {
            if (key.startsWith(oldPath + "/")) {
              const content = newFiles[key];
              delete newFiles[key];
              const renamedKey = key.replace(oldPath, newPath);
              newFiles[renamedKey] = content;
            }
          });
        }
        return newFiles;
      });

      // 2. Update Container (Real System)
      if (instance) {
        try {
          await instance.fs.rename(oldPath, newPath);
        } catch (e) {
          console.error("Failed to rename path in container", e);
        }
      }
    },
    [setFileContents, instance]
  );

  return { createFile, deletePath, renamePath };
}
