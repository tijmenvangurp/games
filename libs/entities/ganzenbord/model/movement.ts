import { FINISH, isGooseSquare } from "./board";
import type { Dice } from "./types";

type MoveStepKind = "roll" | "first-throw" | "goose" | "bounce";

interface MoveStep {
  readonly kind: MoveStepKind;
  readonly from: number;
  readonly to: number;
}

interface MoveResult {
  readonly position: number;
  readonly steps: readonly MoveStep[];
}

/** Een grens tegen een programmeerfout; de klassieke keten is veel korter. */
const MAX_CHAIN = 32;

/**
 * De klassieke eerste-worp-regel: 5 + 4 gaat naar 53 en 6 + 3 naar 26.
 * Alleen de ogen tellen, niet de volgorde van de twee dobbelstenen.
 */
export function firstThrowTarget(dice: Dice): number | null {
  const low = Math.min(dice[0], dice[1]);
  const high = Math.max(dice[0], dice[1]);

  if (low === 4 && high === 5) {
    return 53;
  }
  if (low === 3 && high === 6) {
    return 26;
  }
  return null;
}

/**
 * Verplaatst een pion volgens de klassieke regels. De functie kent alleen het
 * bord, niet de andere spelers of de put/gevangenis; die volgen in de engine.
 *
 * - Voorbij 63 tel je terug vanaf 63.
 * - Op een gans ga je hetzelfde aantal ogen nog eens; dat kan ketenen.
 * - Als je bij het terugtellen op een gans komt, ga je ook weer terug.
 */
export function movePlayer(start: number, dice: Dice, firstThrow = false): MoveResult {
  const total = dice[0] + dice[1];
  const steps: MoveStep[] = [];
  let position = start;
  let direction: 1 | -1 = 1;

  const special = firstThrow ? firstThrowTarget(dice) : null;
  if (special !== null) {
    steps.push({ kind: "first-throw", from: start, to: special });
    position = special;
  } else {
    const next = start + total;
    if (next > FINISH) {
      position = FINISH - (next - FINISH);
      direction = -1;
      steps.push({ kind: "bounce", from: start, to: position });
    } else {
      position = next;
      steps.push({ kind: "roll", from: start, to: position });
    }
  }

  let guard = 0;
  while (isGooseSquare(position) && guard < MAX_CHAIN) {
    guard += 1;
    const from = position;

    if (direction === 1) {
      const next = position + total;
      if (next > FINISH) {
        position = FINISH - (next - FINISH);
        direction = -1;
        steps.push({ kind: "bounce", from, to: position });
      } else {
        position = next;
        steps.push({ kind: "goose", from, to: position });
      }
    } else {
      position = Math.max(0, position - total);
      steps.push({ kind: "goose", from, to: position });
    }
  }

  return { position, steps };
}
