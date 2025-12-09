import { useCallback } from "react";

export function useFileSystem(
  fileContents: Record<string, string>,
  setFileContents: (files: Record<string, string>) => void
) {
  const createFile = useCallback(
    (path: string) => {
      if (fileContents[path]) return false; // Exists
      setFileContents({ ...fileContents, [path]: "" }); // Empty file
      return true;
    },
    [fileContents, setFileContents]
  );

  const deletePath = useCallback(
    (path: string, type: "file" | "folder") => {
      const newFiles = { ...fileContents };

      if (type === "file") {
        delete newFiles[path];
      } else {
        // Delete all files starting with this folder path
        Object.keys(newFiles).forEach((key) => {
          if (key.startsWith(path + "/")) {
            delete newFiles[key];
          }
        });
      }
      setFileContents(newFiles);
    },
    [fileContents, setFileContents]
  );

  const renamePath = useCallback(
    (oldPath: string, newPath: string, type: "file" | "folder") => {
      const newFiles = { ...fileContents };

      if (type === "file") {
        const content = newFiles[oldPath];
        delete newFiles[oldPath];
        newFiles[newPath] = content;
      } else {
        // Rename folder prefix for all matching files
        Object.keys(newFiles).forEach((key) => {
          if (key.startsWith(oldPath + "/")) {
            const content = newFiles[key];
            delete newFiles[key];
            const renamedKey = key.replace(oldPath, newPath);
            newFiles[renamedKey] = content;
          }
        });
      }
      setFileContents(newFiles);
    },
    [fileContents, setFileContents]
  );

  return { createFile, deletePath, renamePath };
}
