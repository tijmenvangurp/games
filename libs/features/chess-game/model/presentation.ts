import type { Color, PieceSymbol } from "chess.js";
import {
  type ChessMode,
  type ChessMoveRecord,
  type ChessPlayer,
  type ChessResult,
} from "@entities/chess";
import { getTexts } from "@shared/i18n";
import { presentationTexts } from "./texts";

/** De Nederlandse kantnamen; gebruik `sideLabel` voor de actieve taal. */
export const SIDE_LABEL: Record<Color, string> = presentationTexts.nl.side;

export function sideLabel(color: Color): string {
  return getTexts(presentationTexts).side[color];
}

/**
 * De app vult zelf "Wit", "Zwart" en "Computer" in als naam. Die tonen we in de
 * actieve taal; een zelfgekozen naam blijft zoals hij is.
 */
export function localName(name: string): string {
  const names: Readonly<Record<string, string>> = getTexts(presentationTexts).builtInNames;
  return Object.hasOwn(names, name) ? names[name] : name;
}

export function displayName(player: ChessPlayer, color: Color): string {
  return localName(player.name.trim()) || sideLabel(color);
}

export function capturedBy(
  history: readonly ChessMoveRecord[],
  color: Color,
): readonly PieceSymbol[] {
  return history
    .filter((move) => move.color === color && move.captured)
    .map((move) => move.captured as PieceSymbol);
}

export interface StatusInput {
  readonly result: ChessResult;
  readonly turn: Color;
  readonly players: Record<Color, ChessPlayer>;
  readonly thinking: boolean;
}

export function statusText({ result, turn, players, thinking }: StatusInput): string {
  const t = getTexts(presentationTexts).status;

  switch (result.kind) {
    case "checkmate":
      return t.checkmate(displayName(players[result.winner], result.winner));
    case "stalemate":
      return t.stalemate;
    case "draw":
      return t.draw;
    case "resigned":
      return t.resigned(displayName(players[result.winner], result.winner));
    case "playing":
      if (thinking) {
        return t.thinking;
      }
      return result.check
        ? t.check(displayName(players[turn], turn))
        : t.turn(displayName(players[turn], turn));
  }
}

export function feedbackText(feedback: string): string | null {
  const t = getTexts(presentationTexts).feedback;

  switch (feedback) {
    case "illegal":
    case "not-your-turn":
    case "engine-error":
      return t[feedback];
    default:
      return null;
  }
}

export interface ResultCopy {
  readonly title: string;
  readonly description: string;
  readonly confetti: boolean;
}

export function resultCopy(
  result: ChessResult,
  players: Record<Color, ChessPlayer>,
  mode: ChessMode,
  humanColor: Color,
): ResultCopy {
  const t = getTexts(presentationTexts);

  switch (result.kind) {
    case "checkmate":
      return {
        title: t.result.wins(displayName(players[result.winner], result.winner)),
        description: t.result.checkmate,
        confetti: mode === "friend" || result.winner === humanColor,
      };
    case "resigned":
      return {
        title: t.result.wins(displayName(players[result.winner], result.winner)),
        description: t.result.resigned,
        confetti: mode === "friend" || result.winner === humanColor,
      };
    case "stalemate":
      return {
        title: t.result.stalemateTitle,
        description: t.result.stalemate,
        confetti: false,
      };
    case "draw":
      return {
        title: t.result.drawTitle,
        description: t.drawReasons[result.reason],
        confetti: false,
      };
    case "playing":
      return {
        title: t.result.playingTitle,
        description: t.result.playing,
        confetti: false,
      };
  }
}
