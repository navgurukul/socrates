"use client";

import { useContext } from "react";
import { BattleContext } from "@/contexts/BattleContext";

/**
 * Custom hook to access Battle Context
 * Must be used within a BattleProvider
 */
export function useBattle() {
  const context = useContext(BattleContext);

  if (!context) {
    throw new Error("useBattle must be used within a BattleProvider");
  }

  return context;
}
