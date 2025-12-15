import { Arc } from "./types";

/**
 * Arc definitions for the platform.
 * Each Arc represents a focused set of problems that train one mental model.
 */

// ============================================
// FRONTEND DEBUGGING TRACK ARCS
// ============================================

export const stateAndEffectsArc: Arc = {
  id: "state-and-effects",
  trackId: "frontend-debugging",
  title: "State & Effects",
  description:
    "Master React state management, side effects, and the component lifecycle.",
  mentalModel:
    "Understanding how state flows through components and when effects run",
  order: 1,
};

export const asyncDataFlowArc: Arc = {
  id: "async-data-flow",
  trackId: "frontend-debugging",
  title: "Async Data Flow",
  description:
    "Debug API calls, loading states, error handling, and race conditions in the UI.",
  mentalModel: "Tracking data through async boundaries and handling edge cases",
  order: 2,
};

export const renderPerformanceArc: Arc = {
  id: "render-performance",
  trackId: "frontend-debugging",
  title: "Render Performance",
  description:
    "Identify and fix unnecessary re-renders, optimize memoization, and improve UI responsiveness.",
  mentalModel:
    "Understanding the render cycle and when components should update",
  order: 3,
};

export const formStateMachinesArc: Arc = {
  id: "form-state-machines",
  trackId: "frontend-debugging",
  title: "Form State Machines",
  description:
    "Debug complex form validation, multi-step wizards, and controlled inputs.",
  mentalModel: "Forms as state machines with transitions and validations",
  order: 4,
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
  stateAndEffectsArc,
  asyncDataFlowArc,
  renderPerformanceArc,
  formStateMachinesArc,
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
