import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Difficulty } from "@/lib/content/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    default:
      return "javascript";
  }
}

/**
 * Difficulty styling constants
 * Maps each difficulty level to its associated CSS classes
 */
const DIFFICULTY_STYLES = {
  Easy: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  Medium: "text-amber-400 border-amber-400/20 bg-amber-400/10",
  Hard: "text-red-400 border-red-400/20 bg-red-400/10",
} as const;

/**
 * Get combined CSS classes for a difficulty level
 * @param difficulty - The difficulty level
 * @returns Combined CSS class string
 */
export function getDifficultyStyles(difficulty: Difficulty): string {
  return DIFFICULTY_STYLES[difficulty] || "text-zinc-400 border-zinc-400/20 bg-zinc-400/10";
}
