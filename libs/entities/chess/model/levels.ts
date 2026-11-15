import type { ComputerLevel, ComputerLevelInfo } from "./types";

/**
 * Kindvriendelijke engine-instellingen. Stockfish' `Skill Level` 0 is al
 * duidelijk zwakker dan de volwassen stand; de korte bedenktijd houdt de
 * beurtwissel vlot.
 */
export const COMPUTER_LEVEL_INFO: Record<ComputerLevel, ComputerLevelInfo> = {
  makkelijk: {
    label: "Makkelijk",
    emoji: "🐣",
    hint: "De computer denkt kort na.",
    skill: 0,
    movetime: 100,
  },
  middel: {
    label: "Middel",
    emoji: "🦊",
    hint: "De computer speelt slim.",
    skill: 5,
    movetime: 200,
  },
  moeilijk: {
    label: "Moeilijk",
    emoji: "🐯",
    hint: "De computer speelt sterk.",
    skill: 12,
    movetime: 400,
  },
};
