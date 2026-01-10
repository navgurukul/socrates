import { google } from "@ai-sdk/google";

export const models = {
  /** Fast model for chat/tutoring - optimized for low latency */
  tutor: google("gemini-2.5-flash-lite"),

  /** Model for code review - balanced speed and quality */
  reviewer: google("gemini-2.5-flash-lite"),
} as const;

/** Shared AI configuration settings */
export const aiConfig = {
  /** Maximum streaming duration in seconds */
  maxDuration: 30,
} as const;
