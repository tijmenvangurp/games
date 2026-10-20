import { describe, expect, it, vi } from "vitest";
import {
  applyDrop,
  BOARD_SHAPES,
  chooseComputerColumn,
  createGame,
  isPlayable,
  winnerOf,
  type BoardSize,
  type ComputerLevel,
  type FourInARowGame,
  type Player,
} from "@entities/four-in-a-row";

/** Speelt een reeks kolommen vanaf een leeg bord. */
function play(
  first: Player,
  columns: readonly number[],
  size: BoardSize = "groot",
): FourInARowGame {
  let game = createGame(BOARD_SHAPES[size], first);
  for (const column of columns) {
    const next = applyDrop(game, column);
    if (!next) {
      throw new Error(`Ongeldige zet in kolom ${column}`);
    }
    game = next;
  }
  return game;
}

/** Nooit willekeurig: zo houdt de test de zoektocht voorspelbaar. */
const NO_RANDOM = () => 0.99;

const LEVELS: readonly ComputerLevel[] = ["makkelijk", "middel", "moeilijk"];

describe("de computer", () => {
  it("pakt een directe winst", () => {
    // Rood heeft drie op een rij en mag weer.
    const game = play("one", [6, 0, 6, 1, 5, 2, 5]);
    expect(game.current).toBe("two");
    expect(winnerOf(game)).toBeNull();

    for (const level of LEVELS) {
      expect(chooseComputerColumn(game, level, NO_RANDOM)).toBe(3);
    }
  });

  it("blokkeert de rij van de tegenstander", () => {
    // Blauw heeft drie op een rij op de onderste rij; Rood moet kolom 3 nemen.
    const game = play("one", [0, 6, 1, 6, 2, 5, 5]);
    expect(game.current).toBe("two");
    expect(winnerOf(game)).toBeNull();

    for (const level of LEVELS) {
      expect(chooseComputerColumn(game, level, NO_RANDOM)).toBe(3);
    }
  });

  it("wint zelf in plaats van alleen te blokkeren", () => {
    // Beide spelers hebben drie op een rij; Rood is aan zet en wint direct.
    const game = play("one", [6, 0, 6, 0, 6, 0, 5]);
    expect(game.current).toBe("two");

    expect(chooseComputerColumn(game, "middel", NO_RANDOM)).toBe(0);
    expect(chooseComputerColumn(game, "moeilijk", NO_RANDOM)).toBe(0);
  });

  it("kiest nooit een volle kolom", () => {
    // Zes schijven wisselen elkaar af in kolom 0, die daarmee vol is.
    const game = play("one", [0, 0, 0, 0, 0, 0]);
    expect(game.current).toBe("one");
    expect(isPlayable(game.board, 0)).toBe(false);

    for (const level of LEVELS) {
      const column = chooseComputerColumn(game, level, NO_RANDOM);
      expect(column).not.toBeNull();
      expect(column).not.toBe(0);
    }
  });

  it("geeft null als de partij al klaar is", () => {
    const game = play("one", [0, 1, 0, 1, 0, 1, 0]);
    expect(winnerOf(game)).toBe("one");

    expect(chooseComputerColumn(game, "moeilijk", NO_RANDOM)).toBeNull();
  });

  it("kiest op makkelijk soms expres een andere kolom", () => {
    const random = vi.fn(() => 0);
    const game = createGame(BOARD_SHAPES.groot, "one");

    const column = chooseComputerColumn(game, "makkelijk", random);

    expect(column).toBe(3);
    expect(random).toHaveBeenCalledTimes(2);
  });

  it("kiest op makkelijk zonder dobbelsteen de beste zet", () => {
    const game = play("one", [6, 0, 6, 1, 5, 2, 5]);

    expect(chooseComputerColumn(game, "makkelijk", NO_RANDOM)).toBe(3);
  });

  it("speelt ook op het kleine bord", () => {
    const game = createGame(BOARD_SHAPES.klein, "one");

    for (const level of LEVELS) {
      const column = chooseComputerColumn(game, level, NO_RANDOM);
      expect(column).not.toBeNull();
      expect(isPlayable(game.board, column ?? -1)).toBe(true);
    }
  });
});
