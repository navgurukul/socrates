"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef, useEffect } from "react";

interface CodeEditorProps {
  initialCode: string;
  language?: string; // ✅ Add language prop
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  onMount?: OnMount;
}

export function CodeEditor({
  initialCode,
  language = "javascript", // ✅ Default to JS
  onChange,
  readOnly = false,
  onMount,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  // Optional: Force update model language if it changes dynamically
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // We need to import monaco to use this static method,
        // but often just re-rendering the Editor component handles it
        // if the 'language' prop changes.
        // The @monaco-editor/react component handles prop changes automatically.
      }
    }
  }, [language]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
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
}
