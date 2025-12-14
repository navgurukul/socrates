"use client";

import { useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { Monaco } from "@monaco-editor/react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("TypeBridge");

// Vitest module declaration - allows `import { ... } from 'vitest'`
const VITEST_MODULE_DTS = `
declare module 'vitest' {
  export interface Assertion<T = any> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: any): void;
    toHaveLength(length: number): void;
    toThrow(error?: string | RegExp | Error): void;
    toMatch(pattern: string | RegExp): void;
    toBeGreaterThan(num: number): void;
    toBeLessThan(num: number): void;
    toBeInstanceOf(cls: any): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    not: Assertion<T>;
    resolves: Assertion<T>;
    rejects: Assertion<T>;
  }

  export type ExpectStatic = {
    <T>(actual: T): Assertion<T>;
    extend(matchers: Record<string, any>): void;
  };

  export const expect: ExpectStatic;
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;

  export interface Vi {
    fn<T extends (...args: any[]) => any>(fn?: T): T;
    spyOn<T extends object, M extends keyof T>(obj: T, method: M): any;
    mock(path: string, factory?: () => any): void;
    unmock(path: string): void;
    resetAllMocks(): void;
    clearAllMocks(): void;
    useFakeTimers(): Vi;
    useRealTimers(): Vi;
    advanceTimersByTime(ms: number): void;
    runAllTimers(): void;
  }
  export const vi: Vi;
}
`;

// Testing Library module declaration
const TESTING_LIBRARY_DTS = `
declare module '@testing-library/react' {
  import { ReactElement } from 'react';

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (element?: HTMLElement) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
  }

  export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    wrapper?: React.ComponentType;
  }

  export function render(ui: ReactElement, options?: RenderOptions): RenderResult;
  export function cleanup(): void;

  export interface Screen {
    getByText(text: string | RegExp): HTMLElement;
    queryByText(text: string | RegExp): HTMLElement | null;
    findByText(text: string | RegExp): Promise<HTMLElement>;
    getByRole(role: string, options?: { name?: string | RegExp }): HTMLElement;
    queryByRole(role: string, options?: { name?: string | RegExp }): HTMLElement | null;
    getByTestId(testId: string): HTMLElement;
    queryByTestId(testId: string): HTMLElement | null;
    getByLabelText(text: string | RegExp): HTMLElement;
    getByPlaceholderText(text: string | RegExp): HTMLElement;
    getByDisplayValue(value: string | RegExp): HTMLElement;
    getAllByText(text: string | RegExp): HTMLElement[];
    getAllByRole(role: string): HTMLElement[];
  }

  export const screen: Screen;

  export interface FireEventObject {
    click(element: HTMLElement | Window): void;
    change(element: HTMLElement, options?: { target?: { value?: string } }): void;
    submit(element: HTMLElement): void;
    focus(element: HTMLElement): void;
    blur(element: HTMLElement): void;
    keyDown(element: HTMLElement, options?: { key?: string; code?: string }): void;
    keyUp(element: HTMLElement, options?: { key?: string; code?: string }): void;
    input(element: HTMLElement, options?: { target?: { value?: string } }): void;
  }

  export const fireEvent: FireEventObject;

  export interface WaitForOptions {
    timeout?: number;
    interval?: number;
  }

  export function waitFor<T>(callback: () => T | Promise<T>, options?: WaitForOptions): Promise<T>;
  export function waitForElementToBeRemoved(callback: () => HTMLElement | null): Promise<void>;
}
`;

// React module declaration
const REACT_MODULE_DTS = `
declare module 'react' {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined;
  export interface ReactElement<P = any> {
    type: string | ComponentType<P>;
    props: P;
    key: string | number | null;
  }

  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P): ReactElement | null;
    displayName?: string;
  }

  export type ComponentType<P = {}> = FunctionComponent<P>;

  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useContext<T>(context: Context<T>): T;
  export function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void];
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useImperativeHandle<T>(ref: Ref<T>, init: () => T, deps?: readonly any[]): void;
  export function useDebugValue<T>(value: T, format?: (value: T) => any): void;
  export function useId(): string;
  export function useDeferredValue<T>(value: T): T;
  export function useTransition(): [boolean, (callback: () => void) => void];

  export function createElement(type: any, props?: any, ...children: any[]): ReactElement;
  export function cloneElement(element: ReactElement, props?: any, ...children: any[]): ReactElement;
  export function createContext<T>(defaultValue: T): Context<T>;
  export function forwardRef<T, P = {}>(render: (props: P, ref: Ref<T>) => ReactElement | null): ForwardRefExoticComponent<P & RefAttributes<T>>;
  export function memo<P>(component: FunctionComponent<P>): FunctionComponent<P>;
  export function lazy<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>): T;
  export function startTransition(callback: () => void): void;

  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
  }
  export interface Provider<T> {
    (props: { value: T; children?: ReactNode }): ReactElement | null;
  }
  export interface Consumer<T> {
    (props: { children: (value: T) => ReactNode }): ReactElement | null;
  }
  export type Ref<T> = ((instance: T | null) => void) | { current: T | null } | null;
  export interface RefAttributes<T> {
    ref?: Ref<T>;
  }
  export interface ForwardRefExoticComponent<P> extends FunctionComponent<P> {}

  export const Fragment: symbol;
  export const StrictMode: symbol;
  export const Suspense: FunctionComponent<{ fallback?: ReactNode; children?: ReactNode }>;

  // Default export for: import React from 'react'
  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useCallback: typeof useCallback;
    useMemo: typeof useMemo;
    useRef: typeof useRef;
    useContext: typeof useContext;
    createElement: typeof createElement;
    Fragment: typeof Fragment;
    StrictMode: typeof StrictMode;
    Suspense: typeof Suspense;
    memo: typeof memo;
    forwardRef: typeof forwardRef;
    lazy: typeof lazy;
    createContext: typeof createContext;
  };
  export default React;
}
`;

// JSX namespace for intrinsic elements (div, button, span, etc.)
const JSX_NAMESPACE_DTS = `
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    type LibraryManagedAttributes<C, P> = P;
    interface IntrinsicAttributes {
      key?: string | number | null;
    }
    interface IntrinsicClassAttributes<T> {
      ref?: React.Ref<T>;
    }
    interface IntrinsicElements {
      div: any;
      span: any;
      p: any;
      a: any;
      button: any;
      input: any;
      form: any;
      label: any;
      select: any;
      option: any;
      textarea: any;
      img: any;
      ul: any;
      ol: any;
      li: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      header: any;
      footer: any;
      main: any;
      nav: any;
      section: any;
      article: any;
      aside: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      th: any;
      td: any;
      br: any;
      hr: any;
      pre: any;
      code: any;
      strong: any;
      em: any;
      i: any;
      b: any;
      svg: any;
      path: any;
      [elemName: string]: any;
    }
  }
}
export {};
`;

// Vitest global types declaration for `expect`, `describe`, `it`, etc.
const VITEST_GLOBALS_DTS = `
declare global {
  const expect: typeof import('vitest')['expect'];
  const describe: typeof import('vitest')['describe'];
  const it: typeof import('vitest')['it'];
  const test: typeof import('vitest')['test'];
  const vi: typeof import('vitest')['vi'];
  const beforeEach: typeof import('vitest')['beforeEach'];
  const afterEach: typeof import('vitest')['afterEach'];
  const beforeAll: typeof import('vitest')['beforeAll'];
  const afterAll: typeof import('vitest')['afterAll'];
}
export {};
`;

export function useTypeBridge() {
  /**
   * Helper to add types to BOTH typescript and javascript defaults
   */
  const addExtraLib = useCallback(
    (monaco: Monaco, content: string, filePath: string) => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        content,
        filePath
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        content,
        filePath
      );
    },
    []
  );

  const loadTypesFromContainer = useCallback(
    async (
      instance: WebContainer,
      monaco: Monaco,
      packageName: string, // e.g., "vitest"
      maxDepth: number = 5 // Prevent infinite recursion
    ) => {
      try {
        const packagePath = `node_modules/${packageName}`;

        // 1. Read package.json to find the real types entry point
        let typesEntry = "index.d.ts"; // Default fallback
        try {
          const pkgJsonStr = await instance.fs.readFile(
            `${packagePath}/package.json`,
            "utf-8"
          );
          const pkgJson = JSON.parse(pkgJsonStr);
          if (pkgJson.types) typesEntry = pkgJson.types;
          else if (pkgJson.typings) typesEntry = pkgJson.typings;
        } catch {
          // No package.json found, use default
        }

        // Normalize the types entry path
        const normalizedTypesEntry = typesEntry.replace(/^\.[\/]/, "");

        // 2. Recursively load all .d.ts files in the package
        const processDir = async (dirPath: string, depth: number) => {
          if (depth > maxDepth) return;

          let entries;
          try {
            entries = await instance.fs.readdir(dirPath, {
              withFileTypes: true,
            });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = `${dirPath}/${entry.name}`;

            if (entry.isDirectory()) {
              // Skip nested node_modules and common non-type directories
              if (
                entry.name === "node_modules" ||
                entry.name === "__tests__" ||
                entry.name === "test"
              ) {
                continue;
              }
              await processDir(fullPath, depth + 1);
            } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
              const content = await instance.fs.readFile(fullPath, "utf-8");

              // Register at the actual file path
              addExtraLib(monaco, content, `file:///${fullPath}`);

              // If this is the main entry point, check if it needs a module declaration
              if (fullPath.endsWith(normalizedTypesEntry)) {
                logger.debug(
                  `Found entry point for ${packageName}: ${fullPath}`
                );
              }
            }
          }
        };

        await processDir(packagePath, 0);
        logger.debug(
          `Linked ${packageName} (Entry: ${typesEntry})`
        );
      } catch (e) {
        logger.error(`Failed ${packageName}`, e);
      }
    },
    [addExtraLib]
  );

  const injectIntelliSense = useCallback(
    async (instance: WebContainer, monaco: Monaco) => {
      logger.debug("Starting injection...");

      const compilerOptions = {
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        typeRoots: ["node_modules/@types"],
        strict: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
      };

      // Apply compiler options to BOTH typescript and javascript defaults
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        compilerOptions
      );
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        ...compilerOptions,
        allowJs: true,
        checkJs: true,
      });

      // Enable eager model sync for better type resolution
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

      // Load Vitest and its dependencies (order matters for type resolution)
      // First load the core dependencies that vitest relies on
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "@vitest/spy"),
        loadTypesFromContainer(instance, monaco, "@vitest/utils"),
        loadTypesFromContainer(instance, monaco, "chai"),
      ]);

      // Then load vitest expect and runner
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "@vitest/expect"),
        loadTypesFromContainer(instance, monaco, "@vitest/runner"),
      ]);

      // Finally load the main vitest package
      await loadTypesFromContainer(instance, monaco, "vitest");

      // Load other dependencies in parallel
      await Promise.all([
        loadTypesFromContainer(instance, monaco, "react"),
        loadTypesFromContainer(instance, monaco, "@types/react"),
        loadTypesFromContainer(instance, monaco, "@types/node"),
        loadTypesFromContainer(instance, monaco, "@testing-library/react"),
      ]);

      // Inject Vitest module declaration so `import { ... } from 'vitest'` resolves
      addExtraLib(
        monaco,
        VITEST_MODULE_DTS,
        "file:///node_modules/vitest/index.d.ts"
      );

      // Inject Testing Library module declaration
      addExtraLib(
        monaco,
        TESTING_LIBRARY_DTS,
        "file:///node_modules/@testing-library/react/index.d.ts"
      );

      // Inject React module declaration
      addExtraLib(
        monaco,
        REACT_MODULE_DTS,
        "file:///node_modules/@types/react/index.d.ts"
      );

      // Also register React at the direct module path
      addExtraLib(
        monaco,
        REACT_MODULE_DTS,
        "file:///node_modules/react/index.d.ts"
      );

      // Inject JSX namespace for intrinsic elements (div, button, etc.)
      addExtraLib(
        monaco,
        JSX_NAMESPACE_DTS,
        "file:///node_modules/@types/react/jsx-runtime.d.ts"
      );

      // Inject Vitest globals so `expect`, `describe`, etc. work without imports
      addExtraLib(
        monaco,
        VITEST_GLOBALS_DTS,
        "file:///node_modules/@types/vitest-globals/index.d.ts"
      );

      // Instead of forcing a full refresh, Monaco's type system will automatically
      // revalidate when new type definitions are added via addExtraLib.
      // The eager model sync setting ensures types are picked up quickly.
      logger.debug("Injection complete.");
    },
    [loadTypesFromContainer, addExtraLib]
  );

  return { injectIntelliSense };
}
