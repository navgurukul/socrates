import { Arc } from "./types";

/**
 * Arc definitions for the platform.
 * Each Arc represents a focused set of problems that train one mental model.
 */

// ============================================
// FRONTEND DEBUGGING TRACK ARCS
// ============================================

export const foundationsArc: Arc = {
  id: "debugging-foundations",
  trackId: "frontend-debugging",
  title: "Debugging Foundations",
  description:
    "Build core debugging habits: reproducing bugs, reading error messages and tests, and comparing expected versus actual behavior.",
  mentalModel:
    "Debugging is a repeatable loop: observe, reproduce, inspect, hypothesize, change, and verify.",
  order: 1,
};

export const stateAndMutationsArc: Arc = {
  id: "js-logic-and-state",
  trackId: "frontend-debugging",
  title: "JavaScript Logic & State Bugs",
  description:
    "Reason about data and logic bugs, including incorrect conditions, derived values, and state that falls out of sync.",
  mentalModel:
    "Always trace how inputs transform into state and outputs; keep a single source of truth and update it immutably.",
  order: 2,
};

export const effectsAndClosuresArc: Arc = {
  id: "react-and-components",
  trackId: "frontend-debugging",
  title: "React & Component Bugs",
  description:
    "Debug React-specific issues like component identity, props versus state, controlled inputs, and list rendering behavior.",
  mentalModel:
    "Components render UI from props and state; when UI is wrong, follow the data through props, state, and keys.",
  order: 3,
};

export const asyncDataFlowArc: Arc = {
  id: "async-network-and-effects",
  trackId: "frontend-debugging",
  title: "Async, Network & Side Effects",
  description:
    "Handle time-based and network-related bugs such as stuck loading states, swallowed errors, and race conditions.",
  mentalModel:
    "Every async operation is a timeline—always handle loading, success, error, and cancellation paths explicitly.",
  order: 4,
};

export const renderPerformanceArc: Arc = {
  id: "performance-and-memory",
  trackId: "frontend-debugging",
  title: "Performance & Memory Issues",
  description:
    "Identify and fix performance bottlenecks and leaks caused by unnecessary work, re-renders, and uncleaned resources.",
  mentalModel:
    "Measure where time and memory are spent, then remove unnecessary work and ensure resources are cleaned up.",
  order: 6,
};

export const browserAndDomDebuggingArc: Arc = {
  id: "browser-and-dom",
  trackId: "frontend-debugging",
  title: "Browser & DOM Debugging",
  description:
    "Investigate issues rooted in the browser environment: DOM structure, layout, styling, events, and accessibility.",
  mentalModel:
    "What matters is what the browser actually rendered—inspect the DOM, styles, and events rather than guessing.",
  order: 5,
};

export const productionDebuggingBossArc: Arc = {
  id: "production-debugging-boss",
  trackId: "frontend-debugging",
  title: "Production-Grade Debugging (Boss Level)",
  description:
    "Tackle complex, multi-layer bugs that combine several concepts and mimic real production incidents.",
  mentalModel:
    "Use an end-to-end debugging workflow—start from the report, gather signals, narrow hypotheses, and verify fixes with tests and monitoring.",
  order: 7,
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
  browserAndDomDebuggingArc,
  renderPerformanceArc,
  productionDebuggingBossArc,
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
