import { cn } from "@/lib/utils";
import { FileCode, FileJson, TestTube } from "lucide-react";

interface FileExplorerProps {
  files: string[];
  activeFile: string;
  onSelect: (file: string) => void;
}

export function FileExplorer({
  files,
  activeFile,
  onSelect,
}: FileExplorerProps) {
  const getIcon = (filename: string) => {
    if (filename.includes("test"))
      return <TestTube className="h-4 w-4 text-orange-400" />;
    if (filename.endsWith("json"))
      return <FileJson className="h-4 w-4 text-yellow-400" />;
    return <FileCode className="h-4 w-4 text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-zinc-800">
      <div className="p-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        Explorer
      </div>
      <div className="flex flex-col gap-0.5">
        {files.map((fileName) => (
          <button
            key={fileName}
            onClick={() => onSelect(fileName)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-left",
              activeFile === fileName &&
                "bg-zinc-800 text-white border-l-2 border-emerald-500"
            )}
          >
            {getIcon(fileName)}
            <span>{fileName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
