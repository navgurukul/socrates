"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import type { Terminal as XTerminal } from "xterm";
import type { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

interface TerminalProps {
  onTerminalReady?: (term: XTerminal) => void;
}

export function Terminal({ onTerminalReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isInitializedRef = useRef(false);
  const [isClient, setIsClient] = useState(false);

  const onTerminalReadyRef = useRef(onTerminalReady);
  onTerminalReadyRef.current = onTerminalReady;

  const safeFit = useCallback(() => {
    const el = terminalRef.current;
    const term = xtermInstance.current;
    const fitAddon = fitAddonRef.current;

    if (!el || !term || !fitAddon) return;
    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

    try {
      const core = (term as any)._core;
      if (core?._renderService?._renderer) {
        fitAddon.fit();
      }
    } catch {
      // Silently ignore fit errors
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const container = terminalRef.current;
    if (!container || isInitializedRef.current) return;

    let observer: ResizeObserver | null = null;

    const initTerminal = async () => {
      if (isInitializedRef.current || !container) return;

      // Dynamic imports - only load xterm in browser
      const [{ Terminal: XTerm }, { FitAddon: Fit }] = await Promise.all([
        import("xterm"),
        import("xterm-addon-fit"),
      ]);
      if (isInitializedRef.current) return; // Double-check after async
      isInitializedRef.current = true;

      const term = new XTerm({
        cursorBlink: true,
        theme: { background: "#09090b", foreground: "#eff0f3" },
        fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
        fontSize: 14,
        allowProposedApi: true,
        cols: 80,
        rows: 24,
      });

      const fitAddon = new Fit();
      term.loadAddon(fitAddon);

      xtermInstance.current = term;
      fitAddonRef.current = fitAddon;

      term.open(container);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          safeFit();
          if (onTerminalReadyRef.current) {
            onTerminalReadyRef.current(term);
          }
        });
      });
    };

    // Use ResizeObserver to detect when container has real dimensions
    observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      if (width > 0 && height > 0 && !xtermInstance.current) {
        initTerminal();
      } else if (xtermInstance.current) {
        safeFit();
      }
    });

    observer.observe(container);
    resizeObserverRef.current = observer;

    return () => {
      observer?.disconnect();
      resizeObserverRef.current = null;

      if (xtermInstance.current) {
        xtermInstance.current.dispose();
        xtermInstance.current = null;
      }
      fitAddonRef.current = null;
      isInitializedRef.current = false;
    };
  }, [isClient, safeFit]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 pl-2 pt-2"
    />
  );
}
