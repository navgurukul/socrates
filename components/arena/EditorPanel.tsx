"use client";

import { memo } from "react";
import { CodeEditor } from "./CodeEditor";
import { OnMount } from "@monaco-editor/react";

interface EditorPanelProps {
  activeFile: string;
  content: string;
  language: string;
  readOnly: boolean;
  onChange: (newContent: string | undefined) => void;
  onMount?: OnMount;
}

export const EditorPanel = memo(function EditorPanel({
  activeFile,
  content,
  language,
  readOnly,
  onChange,
  onMount,
}: EditorPanelProps) {
  return (
    <div className="relative flex flex-col h-full bg-[#1e1e1e]">
      {readOnly && (
        <div className="absolute top-0 right-4 z-10 bg-red-900/80 text-red-200 text-xs px-2 py-1 rounded-b">
          Read Only
        </div>
      )}

      <CodeEditor
        key={activeFile}
        filePath={activeFile}
        initialCode={content}
        language={language}
        onChange={onChange}
        readOnly={readOnly}
        onMount={onMount}
      />
    </div>
  );
});
