"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeEditorProps {
  initialCode: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean; // New Prop
}

export function CodeEditor({
  initialCode,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full w-full ...">
      <Editor
        // ... other props
        options={{
          readOnly: readOnly, // Pass it here
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          // Optional: Render a gray background if read-only
          domReadOnly: readOnly,
        }}
      />
    </div>
  );
}
