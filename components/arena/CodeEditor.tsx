"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeEditorProps {
  initialCode: string;
  onChange?: (value: string | undefined) => void;
}

export function CodeEditor({ initialCode, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-md border border-zinc-800 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        defaultValue={initialCode}
        onMount={handleEditorDidMount}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}
