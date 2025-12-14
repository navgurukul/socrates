import { create } from "zustand";
import { Monaco } from "@monaco-editor/react";

interface EditorState {
  fileContents: Record<string, string>;
  activeFile: string;
  monacoInstance: Monaco | null;
}

interface EditorStore extends EditorState {
  setFileContents: (contents: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  createFile: (path: string) => { success: boolean; reason?: string };
  deleteFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  setMonacoInstance: (monaco: Monaco) => void;
  resetEditor: () => void;
}

const initialState: EditorState = {
  fileContents: {},
  activeFile: "",
  monacoInstance: null,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  setFileContents: (contents) => set({ fileContents: contents }),

  updateFile: (path, content) =>
    set((state) => ({
      fileContents: { ...state.fileContents, [path]: content },
    })),

  createFile: (path) => {
    const { fileContents } = get();
    if (fileContents[path]) {
      return { success: false, reason: "File already exists" };
    }
    set({
      fileContents: { ...fileContents, [path]: "" },
    });
    return { success: true };
  },

  deleteFile: (path) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [path]: _removed, ...rest } = state.fileContents;
      return { fileContents: rest };
    }),

  setActiveFile: (path) => set({ activeFile: path }),

  setMonacoInstance: (monaco) => set({ monacoInstance: monaco }),

  resetEditor: () => set(initialState),
}));
