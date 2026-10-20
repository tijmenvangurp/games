import type { Color, PieceSymbol } from "chess.js";
import {
  type ChessMode,
  type ChessMoveRecord,
  type ChessPlayer,
  type ChessResult,
} from "@entities/chess";

export const SIDE_LABEL: Record<Color, string> = { w: "Wit", b: "Zwart" };

export function displayName(player: ChessPlayer, color: Color): string {
  return player.name.trim() || SIDE_LABEL[color];
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
  switch (result.kind) {
    case "checkmate":
      return `${displayName(players[result.winner], result.winner)} wint met schaakmat.`;
    case "stalemate":
      return "Pat! Er is geen legale zet meer.";
    case "draw":
      return "Gelijkspel.";
    case "resigned":
      return `${displayName(players[result.winner], result.winner)} wint: de ander gaf op.`;
    case "playing":
      if (thinking) {
        return "De computer denkt na…";
      }
      return result.check
        ? `Schaak! ${displayName(players[turn], turn)} is aan zet.`
        : `${displayName(players[turn], turn)} is aan zet.`;
  }
}

export function feedbackText(feedback: string): string | null {
  switch (feedback) {
    case "illegal":
      return "Die zet mag niet. Kies een groene stip.";
    case "not-your-turn":
      return "Dat stuk is niet aan de beurt.";
    case "engine-error":
      return "De computer kon geen zet vinden. Probeer het nog eens.";
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
  switch (result.kind) {
    case "checkmate":
      return {
        title: `${displayName(players[result.winner], result.winner)} wint!`,
        description: "Schaakmat! De koning kan nergens meer heen.",
        confetti: mode === "friend" || result.winner === humanColor,
      };
    case "resigned":
      return {
        title: `${displayName(players[result.winner], result.winner)} wint!`,
        description: "De partij is gestopt omdat de ander opgaf.",
        confetti: mode === "friend" || result.winner === humanColor,
      };
    case "stalemate":
      return {
        title: "Pat!",
        description: "Er is geen legale zet meer. Daarom is het gelijkspel.",
        confetti: false,
      };
    case "draw":
      return {
        title: "Gelijkspel",
        description: drawReason(result.reason),
        confetti: false,
      };
    case "playing":
      return {
        title: "De partij loopt nog",
        description: "Er is nog geen winnaar.",
        confetti: false,
      };
  }
}

function drawReason(reason: Extract<ChessResult, { kind: "draw" }>["reason"]): string {
  switch (reason) {
    case "fifty-moves":
      return "Er zijn vijftig zetten gedaan zonder slag of pionzet.";
    case "repetition":
      return "Dezelfde stelling kwam drie keer terug.";
    case "insufficient-material":
      return "Er zijn te weinig stukken over om nog schaakmat te zetten.";
    case "draw":
      return "Geen van beiden kan nog winnen.";
  }
}
