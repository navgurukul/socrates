"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useRef, memo } from "react";

interface CodeEditorProps {
  filePath: string; // ✅ File path for model URI
  initialCode: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  onMount?: OnMount;
}

export const CodeEditor = memo(function CodeEditor({
  filePath,
  initialCode,
  language = "javascript",
  onChange,
  readOnly = false,
  onMount,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        path={filePath}
        language={language}
        theme="vs-dark"
        value={initialCode}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          domReadOnly: readOnly,
          renderValidationDecorations: "on",
        }}
      />
    </div>
  );
});
