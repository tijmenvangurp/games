/**
 * Murdoku engine — pure TypeScript, framework-free (no React, no DOM).
 *
 * Submodules:
 *   domain/    grid, tiles, rooms, objects, edges, suspects, victim, puzzle, solution
 *   clues/     composable Clue classes (test/candidateCells/describe) + And/Or/Not
 *   solver/    CandidateState, DeductionEngine (explainable steps), ReferenceSolver
 *   io/        JSON (de)serialization of levels
 */

export const ENGINE_VERSION = "0.1.0";

export * from "./domain/index.ts";
export * from "./clues/index.ts";
export * from "./solver/index.ts";
export * from "./io/index.ts";
