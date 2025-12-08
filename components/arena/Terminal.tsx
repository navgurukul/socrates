"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface TerminalProps {
  onTerminalReady?: (term: XTerminal) => void;
}

export function Terminal({ onTerminalReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (!terminalRef.current || xtermInstance.current) return;

    // 1. Initialize Xterm
    const term = new XTerminal({
      cursorBlink: true,
      theme: {
        background: "#09090b", // Matches zinc-950
        foreground: "#eff0f3",
      },
      fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
      fontSize: 14,
      allowProposedApi: true, // Sometimes helps with addon compat
    });

    // 2. Load Fit Addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // 3. Mount to DOM
    term.open(terminalRef.current);

    // 4. CRITICAL FIX: Delay the fit() call
    // We wait 1 tick for the DOM to render the CSS Grid dimensions
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn("Fit failed on init:", e);
      }
    }, 50);

    xtermInstance.current = term;

    // 5. Expose instance
    if (onTerminalReady) {
      onTerminalReady(term);
    }

    // 6. Handle Resize
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore resize errors if terminal is hidden
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      xtermInstance.current = null;
      fitAddonRef.current = null;
    };
  }, [onTerminalReady]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 pl-2 pt-2"
    />
  );
}
