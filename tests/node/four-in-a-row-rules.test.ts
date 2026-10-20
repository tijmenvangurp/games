import { describe, expect, it } from "vitest";
import {
  applyDrop,
  BOARD_SHAPES,
  createBoard,
  createGame,
  dropDisc,
  findWinLine,
  isBoardFull,
  isFinished,
  isPlayable,
  landingRow,
  otherPlayer,
  setCell,
  startingPlayerAfter,
  undoDrop,
  winnerOf,
  type Board,
  type BoardShape,
  type Player,
} from "@entities/four-in-a-row";

const GROOT = BOARD_SHAPES.groot;
const KLEIN = BOARD_SHAPES.klein;

/** "x" is speler een (Blauw), "o" is speler twee (Rood), "." is leeg. */
function cellFrom(symbol: string): Player | null {
  if (symbol === "x") {
    return "one";
  }
  if (symbol === "o") {
    return "two";
  }
  return null;
}

/** Bouwt een bord uit rijen die je van boven naar beneden leest. */
function boardFrom(shape: BoardShape, rows: readonly string[]): Board {
  return Array.from({ length: shape.columns }, (_, column) =>
    Array.from({ length: shape.rows }, (_, row) => cellFrom(rows[shape.rows - 1 - row][column])),
  );
}

/** De winnende vakjes als "kolom,rij", gesorteerd, zodat de volgorde niet uitmaakt. */
function lineKeys(board: Board): string[] {
  const line = findWinLine(board);
  return line ? line.cells.map(({ column, row }) => `${column},${row}`).sort() : [];
}

function fullBoard(shape: BoardShape): Board {
  return Array.from({ length: shape.columns }, (_, column) =>
    Array.from({ length: shape.rows }, () => (column % 2 === 0 ? "one" : "two")),
  );
}

describe("het bord", () => {
  it("maakt een leeg bord met de gekozen vorm", () => {
    const board = createBoard(GROOT);

    expect(board).toHaveLength(7);
    expect(board[0]).toHaveLength(6);
    expect(board.flat()).toEqual(Array.from({ length: 42 }, () => null));
    expect(isBoardFull(board)).toBe(false);
    expect(landingRow(board, 0)).toBe(0);
  });

  it("laat een schijf vallen op de laagste vrije rij", () => {
    const empty = createBoard(KLEIN);
    const first = dropDisc(empty, 2, "one");
    const second = first ? dropDisc(first, 2, "two") : null;
    const third = second ? dropDisc(second, 2, "one") : null;

    expect(third?.[2]).toEqual(["one", "two", "one", null, null]);
    expect(landingRow(third ?? empty, 2)).toBe(3);
    expect(empty[2]).toEqual([null, null, null, null, null]);
  });

  it("weigert een volle en een onbestaande kolom", () => {
    const board = fullBoard({ columns: 1, rows: 2 });

    expect(dropDisc(board, 0, "one")).toBeNull();
    expect(dropDisc(board, 5, "one")).toBeNull();
    expect(isPlayable(board, 0)).toBe(false);
    expect(isPlayable(createBoard(KLEIN), 0)).toBe(true);
    expect(isPlayable(createBoard(KLEIN), 9)).toBe(false);
  });

  it("zet een vakje en haalt het weer weg", () => {
    const filled = setCell(createBoard(KLEIN), 1, 0, "two");

    expect(filled[1]?.[0]).toBe("two");
    expect(setCell(filled, 1, 0, null)[1]?.[0]).toBeNull();
  });

  it("weet wanneer het bord helemaal vol is", () => {
    expect(isBoardFull(fullBoard(KLEIN))).toBe(true);
    expect(isBoardFull(fullBoard({ columns: 3, rows: 3 }))).toBe(true);
  });

  it("houdt de twee spelers uit elkaar", () => {
    expect(otherPlayer("one")).toBe("two");
    expect(otherPlayer("two")).toBe("one");
  });
});

describe("vier op een rij vinden", () => {
  it("ziet een rij horizontaal", () => {
    const board = boardFrom(GROOT, [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "xxxx...",
    ]);

    expect(findWinLine(board)?.player).toBe("one");
    expect(lineKeys(board)).toEqual(["0,0", "1,0", "2,0", "3,0"]);
  });

  it("ziet een rij verticaal", () => {
    const board = boardFrom(GROOT, [
      ".......",
      "o......",
      "o......",
      "o......",
      "o......",
      ".......",
    ]);

    expect(findWinLine(board)?.player).toBe("two");
    expect(lineKeys(board)).toEqual(["0,1", "0,2", "0,3", "0,4"]);
  });

  it("ziet een diagonaal omhoog", () => {
    const board = boardFrom(GROOT, [
      ".......",
      ".......",
      "....x..",
      "...x...",
      "..x....",
      ".x.....",
    ]);

    expect(lineKeys(board)).toEqual(["1,0", "2,1", "3,2", "4,3"]);
  });

  it("ziet een diagonaal omlaag", () => {
    const board = boardFrom(GROOT, [
      ".......",
      ".......",
      ".x.....",
      "..x....",
      "...x...",
      "....x..",
    ]);

    expect(lineKeys(board)).toEqual(["1,3", "2,2", "3,1", "4,0"]);
  });

  it("geeft geen rij van vier bij drie op een rij", () => {
    const board = boardFrom(GROOT, [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "xxx....",
    ]);

    expect(findWinLine(board)).toBeNull();

    const vertical = boardFrom(GROOT, [
      ".......",
      ".......",
      "x......",
      "x......",
      "x......",
      ".......",
    ]);

    expect(findWinLine(vertical)).toBeNull();
  });

  it("geeft precies vier vakjes, ook bij vijf op een rij", () => {
    const board = boardFrom(GROOT, [
      ".......",
      ".......",
      ".......",
      ".......",
      ".......",
      "xxxxx..",
    ]);

    expect(lineKeys(board)).toEqual(["0,0", "1,0", "2,0", "3,0"]);
  });
});

describe("een partij", () => {
  it("begint leeg met speler een", () => {
    const game = createGame(GROOT);

    expect(game.current).toBe("one");
    expect(game.drops).toEqual([]);
    expect(game.last).toBeNull();
    expect(isFinished(game)).toBe(false);
    expect(winnerOf(game)).toBeNull();
  });

  it("wisselt van beurt en onthoudt de laatste zet", () => {
    const first = applyDrop(createGame(GROOT), 3);
    const second = first ? applyDrop(first, 3) : null;

    expect(first?.last).toEqual({ player: "one", column: 3, row: 0 });
    expect(second?.last).toEqual({ player: "two", column: 3, row: 1 });
    expect(second?.current).toBe("one");
    expect(second?.drops).toHaveLength(2);
  });

  it("weigert een zet in een volle kolom", () => {
    let game = createGame({ columns: 1, rows: 2 });
    game = applyDrop(game, 0) ?? game;
    game = applyDrop(game, 0) ?? game;

    expect(game.drops).toHaveLength(2);
    expect(applyDrop(game, 0)).toBeNull();
    expect(applyDrop(game, 4)).toBeNull();
  });

  it("stopt bij de eerste rij van vier", () => {
    let game = createGame(GROOT);
    const columns = [0, 1, 0, 1, 0, 1, 0];

    for (const column of columns) {
      const next = applyDrop(game, column);
      expect(next).not.toBeNull();
      game = next ?? game;
    }

    expect(winnerOf(game)).toBe("one");
    expect(isFinished(game)).toBe(true);
    expect(lineKeys(game.board)).toEqual(["0,0", "0,1", "0,2", "0,3"]);
    expect(applyDrop(game, 5)).toBeNull();
  });

  it("eindigt in gelijkspel als het bord vol raakt zonder rij van vier", () => {
    let game = createGame({ columns: 2, rows: 3 });

    for (const column of [0, 1, 0, 1, 0, 1]) {
      const next = applyDrop(game, column);
      game = next ?? game;
    }

    expect(game.draw).toBe(true);
    expect(winnerOf(game)).toBeNull();
    expect(isFinished(game)).toBe(true);
    expect(applyDrop(game, 0)).toBeNull();
  });

  it("maakt de laatste zet ongedaan", () => {
    let game = createGame(GROOT);
    for (const column of [0, 1, 0, 1, 0, 1, 0]) {
      game = applyDrop(game, column) ?? game;
    }

    const undone = undoDrop(game);

    expect(undone.drops).toHaveLength(6);
    expect(undone.line).toBeNull();
    expect(isFinished(undone)).toBe(false);
    expect(undone.current).toBe("one");
    expect(undone.last).toEqual({ player: "two", column: 1, row: 2 });
    expect(undone.board[0]?.[3]).toBeNull();
    expect(undone.board[0]?.[2]).toBe("one");
  });

  it("laat een spel zonder zetten ongemoeid bij ongedaan maken", () => {
    const game = createGame(KLEIN);

    expect(undoDrop(game)).toBe(game);
  });

  it("geeft de verliezer het startrecht", () => {
    let game = createGame(GROOT);
    for (const column of [0, 1, 0, 1, 0, 1, 0]) {
      game = applyDrop(game, column) ?? game;
    }

    expect(startingPlayerAfter(game)).toBe("two");
    expect(startingPlayerAfter(createGame(GROOT))).toBe("one");
    expect(startingPlayerAfter(null)).toBe("one");

    let draw = createGame({ columns: 2, rows: 3 });
    for (const column of [0, 1, 0, 1, 0, 1]) {
      draw = applyDrop(draw, column) ?? draw;
    }

    expect(startingPlayerAfter(draw)).toBe("one");
  });

  it("respecteert een gekozen startspeler", () => {
    const game = createGame(KLEIN, "two");

    expect(game.current).toBe("two");
    expect(applyDrop(game, 0)?.current).toBe("one");
  });
});
