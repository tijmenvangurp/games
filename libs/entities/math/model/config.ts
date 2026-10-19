import type { MathLevel, MathMode } from "./types";

interface MathModeInfo {
  label: string;
  hint: string;
  symbol: string;
}

export const MATH_MODE_INFO: Record<MathMode, MathModeInfo> = {
  plus: { label: "Optellen", hint: "Erbij doen", symbol: "+" },
  min: { label: "Aftrekken", hint: "Eraf halen", symbol: "−" },
  keer: { label: "Keer", hint: "Groepjes maken", symbol: "×" },
  deel: { label: "Delen", hint: "Eerlijk verdelen", symbol: "÷" },
};

interface MathLevelInfo {
  label: string;
}

export const MATH_LEVEL_INFO: Record<MathLevel, MathLevelInfo> = {
  makkelijk: { label: "Makkelijk" },
  gemiddeld: { label: "Gemiddeld" },
  moeilijk: { label: "Moeilijk" },
};

export function levelHint(mode: MathMode, level: MathLevel): string {
  if (mode === "plus" || mode === "min") {
    if (level === "makkelijk") {
      return "Tot 10";
    }
    if (level === "gemiddeld") {
      return "Tot 20";
    }
    return "Tot 100";
  }

  if (level === "makkelijk") {
    return "Tafels 1–5";
  }
  if (level === "gemiddeld") {
    return "Tafels 1–10";
  }
  return "Tafels 6–10";
}
