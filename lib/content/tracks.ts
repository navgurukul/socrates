import { Track } from "./types";

/**
 * Track definitions for the platform.
 * Each Track represents a domain of reasoning, not just a technology.
 */

export const frontendDebuggingTrack: Track = {
  id: "frontend-debugging",
  title: "Frontend Debugging",
  description:
    "Master the art of debugging user interfaces, state management, and browser-based applications.",
  primarySkill: "Debugging UI & stateful systems",
  executionType: "code",
  supportedTools: ["editor", "terminal", "preview"],
  order: 1,
};

export const backendDebuggingTrack: Track = {
  id: "backend-debugging",
  title: "Backend Debugging",
  description:
    "Debug server-side logic, APIs, database queries, and distributed systems.",
  primarySkill: "Debugging server logic & data flows",
  executionType: "code",
  supportedTools: ["editor", "terminal"],
  order: 2,
};

export const systemDesignFailuresTrack: Track = {
  id: "system-design-failures",
  title: "System Design Failures",
  description:
    "Analyze and fix architectural anti-patterns, scalability issues, and design flaws.",
  primarySkill: "Architectural reasoning & pattern recognition",
  executionType: "hybrid",
  supportedTools: ["editor", "diagrams"],
  order: 3,
};

export const performanceDebuggingTrack: Track = {
  id: "performance-debugging",
  title: "Performance Debugging",
  description:
    "Identify and resolve performance bottlenecks, memory leaks, and optimization opportunities.",
  primarySkill: "Performance analysis & optimization",
  executionType: "code",
  supportedTools: ["editor", "terminal", "profiler"],
  order: 4,
};

export const securityExploitReasoningTrack: Track = {
  id: "security-exploit-reasoning",
  title: "Security & Exploit Reasoning",
  description:
    "Find vulnerabilities, understand exploit patterns, and implement secure solutions.",
  primarySkill: "Security analysis & defensive coding",
  executionType: "hybrid",
  supportedTools: ["editor", "terminal"],
  order: 5,
};

// Future tracks (stubs for extensibility)
export const aiPromptDebuggingTrack: Track = {
  id: "ai-prompt-debugging",
  title: "AI Prompt Debugging",
  description:
    "Debug and refine AI prompts to achieve desired outputs and fix hallucinations.",
  primarySkill: "Prompt engineering & AI behavior analysis",
  executionType: "analysis",
  supportedTools: ["editor", "chat"],
  order: 6,
};

export const productUxBugDiagnosisTrack: Track = {
  id: "product-ux-bug-diagnosis",
  title: "Product / UX Bug Diagnosis",
  description:
    "Identify broken user flows, UX anti-patterns, and product logic bugs.",
  primarySkill: "User flow analysis & product thinking",
  executionType: "hybrid",
  supportedTools: ["diagrams", "preview"],
  order: 7,
};

// All tracks registry
export const allTracks: Track[] = [
  frontendDebuggingTrack,
  backendDebuggingTrack,
  systemDesignFailuresTrack,
  performanceDebuggingTrack,
  securityExploitReasoningTrack,
  aiPromptDebuggingTrack,
  productUxBugDiagnosisTrack,
];

// Helper functions
export const getTrack = (id: string): Track | undefined => {
  return allTracks.find((track) => track.id === id);
};

export const getActiveTrack = (): Track[] => {
  // For MVP, only Frontend Debugging is active
  return allTracks.filter((track) => track.id === "frontend-debugging");
};

export const getAllTracks = (): Track[] => {
  return [...allTracks].sort((a, b) => a.order - b.order);
};
