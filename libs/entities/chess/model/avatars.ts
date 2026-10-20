import type { Color } from "chess.js";
import type { ChessPlayer } from "./types";

/** Lokale emoji-avatars: geen afbeeldingen, requests of persoonsgegevens. */
export const CHESS_AVATARS = ["🦊", "🐼", "🐯", "🦁", "🐸", "🐙", "🦄", "🐧", "🤖"] as const;

export type ChessAvatar = (typeof CHESS_AVATARS)[number];

export const DEFAULT_AVATARS: Readonly<Record<Color, ChessAvatar>> = {
  w: "🦊",
  b: "🐼",
};

export function createDefaultPlayers(): Record<Color, ChessPlayer> {
  return {
    w: { name: "Wit", avatar: DEFAULT_AVATARS.w },
    b: { name: "Zwart", avatar: DEFAULT_AVATARS.b },
  };
}

export function isChessAvatar(value: unknown): value is ChessAvatar {
  return typeof value === "string" && (CHESS_AVATARS as readonly string[]).includes(value);
}
