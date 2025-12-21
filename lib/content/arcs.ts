import { Arc } from "./types";

/**
 * Arc definitions for the platform.
 * Each Arc represents a focused set of problems that train one mental model.
 */

// ============================================
// FRONTEND DEBUGGING TRACK ARCS
// ============================================

export const foundationsArc: Arc = {
  id: "foundations",
  trackId: "frontend-debugging",
  title: "Foundations — Reading the Bug",
  description:
    "Learn to read code systematically and identify surface-level UI bugs through careful inspection.",
  mentalModel:
    "Disciplined observation before editing. Understanding what the code does versus what it should do.",
  order: 1,
};

export const stateAndMutationsArc: Arc = {
  id: "state-and-mutations",
  trackId: "frontend-debugging",
  title: "State & Mutations",
  description:
    "Detect and fix incorrect state updates, including direct mutations and derived state mismatches.",
  mentalModel: "State is immutable. Mutations break React's update detection.",
  order: 2,
};

export const effectsAndClosuresArc: Arc = {
  id: "effects-and-closures",
  trackId: "frontend-debugging",
  title: "Effects & Closures",
  description:
    "Understand React's execution model, including when effects run and what they capture.",
  mentalModel:
    "Effects capture values at render time. Dependency arrays control when effects run.",
  order: 3,
};

export const asyncDataFlowArc: Arc = {
  id: "async-data-flow",
  trackId: "frontend-debugging",
  title: "Async & Data Flow",
  description:
    "Build intuition for async bugs, including race conditions, stuck loading states, and swallowed errors.",
  mentalModel:
    "Track data through async boundaries. Handle all states: loading, success, error.",
  order: 4,
};

export const renderPerformanceArc: Arc = {
  id: "render-performance",
  trackId: "frontend-debugging",
  title: "Performance & Renders",
  description:
    "Identify non-obvious performance bugs caused by unnecessary renders or expensive computations.",
  mentalModel:
    "Understand when and why components re-render. Optimize only when necessary.",
  order: 5,
};

// ============================================
// BACKEND DEBUGGING TRACK ARCS
// ============================================

export const raceConditionsArc: Arc = {
  id: "race-conditions",
  trackId: "backend-debugging",
  title: "Race Conditions",
  description:
    "Identify and resolve timing issues in concurrent and parallel operations.",
  mentalModel: "Reasoning about order of operations in concurrent systems",
  order: 1,
};

export const n1QueriesArc: Arc = {
  id: "n-plus-1-queries",
  trackId: "backend-debugging",
  title: "N+1 Queries",
  description:
    "Spot and fix database query inefficiencies that cause performance degradation.",
  mentalModel: "Understanding query execution patterns and eager loading",
  order: 2,
};

// ============================================
// SYSTEM DESIGN FAILURES TRACK ARCS
// ============================================

export const memoryLeaksArc: Arc = {
  id: "memory-leaks",
  trackId: "system-design-failures",
  title: "Memory Leaks",
  description:
    "Find and fix memory leaks in long-running applications and event handlers.",
  mentalModel: "Tracking object references and garbage collection behavior",
  order: 1,
};

// ============================================
// SECURITY TRACK ARCS
// ============================================

export const inputSanitizationArc: Arc = {
  id: "input-sanitization",
  trackId: "security-exploit-reasoning",
  title: "Input Sanitization",
  description:
    "Identify injection vulnerabilities and implement proper input validation.",
  mentalModel: "Never trust user input - validate, sanitize, escape",
  order: 1,
};

// ============================================
// AI PROMPT DEBUGGING TRACK ARCS
// ============================================

export const hallucinationDebuggingArc: Arc = {
  id: "hallucination-debugging",
  trackId: "ai-prompt-debugging",
  title: "Hallucination Debugging",
  description:
    "Identify when AI outputs are fabricated and design prompts that ground responses.",
  mentalModel: "Understanding AI confidence and grounding techniques",
  order: 1,
};

// ============================================
// PRODUCT/UX TRACK ARCS
// ============================================

export const brokenUserFlowsArc: Arc = {
  id: "broken-user-flows",
  trackId: "product-ux-bug-diagnosis",
  title: "Broken User Flows",
  description:
    "Diagnose where users get stuck and why conversion funnels break down.",
  mentalModel: "Thinking like a confused user navigating the product",
  order: 1,
};

// ============================================
// REGISTRY
// ============================================

export const allArcs: Arc[] = [
  // Frontend Debugging
  foundationsArc,
  stateAndMutationsArc,
  effectsAndClosuresArc,
  asyncDataFlowArc,
  renderPerformanceArc,
  // Backend Debugging
  raceConditionsArc,
  n1QueriesArc,
  // System Design Failures
  memoryLeaksArc,
  // Security
  inputSanitizationArc,
  // AI Prompt Debugging
  hallucinationDebuggingArc,
  // Product/UX
  brokenUserFlowsArc,
];

// Helper functions
export const getArc = (id: string): Arc | undefined => {
  return allArcs.find((arc) => arc.id === id);
};

export const getArcsByTrack = (trackId: string): Arc[] => {
  return allArcs
    .filter((arc) => arc.trackId === trackId)
    .sort((a, b) => a.order - b.order);
};

export const getAllArcs = (): Arc[] => {
  return [...allArcs];
};
