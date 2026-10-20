import { describe, expect, it } from "vitest";
import {
  MOLENSPEL_ADJACENCY,
  MOLENSPEL_EDGES,
  MOLENSPEL_MILLS,
  MOLENSPEL_POINTS,
  chooseTarget,
  createMolenspelGame,
  hasLegalMove,
  isInMill,
  legalMoves,
  millsOf,
  movePiece,
  phaseFor,
  placePiece,
  piecesOnBoard,
  rematchMolenspel,
  removablePieces,
  removePiece,
  selectPiece,
  type MolenspelBoard,
  type MolenspelGame,
  type MolenspelPlayer,
} from "@entities/molenspel";

function boardWith(cells: Record<number, MolenspelPlayer | null>): MolenspelBoard {
  const board: (MolenspelPlayer | null)[] = MOLENSPEL_POINTS.map(() => null);
  for (const [point, player] of Object.entries(cells)) {
    board[Number(point)] = player;
  }
  return board;
}

function gameWith(board: MolenspelBoard, overrides: Partial<MolenspelGame> = {}): MolenspelGame {
  return {
    ...createMolenspelGame("wit"),
    board,
    inHand: { wit: 0, zwart: 0 },
    phase: "schuiven",
    ...overrides,
  };
}

/** Legt een molentje op de bovenste rand van het buitenste vierkant. */
function withMillOnTopRow(): MolenspelGame {
  let game = createMolenspelGame("wit");
  game = placePiece(game, 0);
  game = placePiece(game, 3);
  game = placePiece(game, 1);
  game = placePiece(game, 4);
  return placePiece(game, 2);
}

describe("molenspelbord", () => {
  it("heeft 24 punten en 32 verbindingen", () => {
    expect(MOLENSPEL_POINTS).toHaveLength(24);
    expect(MOLENSPEL_EDGES).toHaveLength(32);
  });

  it("plaatst de punten op het 7x7-raster", () => {
    for (const point of MOLENSPEL_POINTS) {
      expect(point.col).toBeGreaterThanOrEqual(0);
      expect(point.col).toBeLessThanOrEqual(6);
      expect(point.row).toBeGreaterThanOrEqual(0);
      expect(point.row).toBeLessThanOrEqual(6);
    }
  });

  it("heeft 16 molentjes, 8 horizontaal en 8 verticaal", () => {
    expect(MOLENSPEL_MILLS).toHaveLength(16);
    const horizontal = MOLENSPEL_MILLS.filter((mill) => {
      const first = MOLENSPEL_POINTS[mill[0] as number];
      return mill.every((point) => MOLENSPEL_POINTS[point]?.row === first?.row);
    });
    const vertical = MOLENSPEL_MILLS.filter((mill) => {
      const first = MOLENSPEL_POINTS[mill[0] as number];
      return mill.every((point) => MOLENSPEL_POINTS[point]?.col === first?.col);
    });
    expect(horizontal).toHaveLength(8);
    expect(vertical).toHaveLength(8);
  });

  it("kent iedere molentje als drie collineaire punten", () => {
    for (const mill of MOLENSPEL_MILLS) {
      const [first, middle, last] = mill.map((point) => MOLENSPEL_POINTS[point]);
      expect(first).toBeDefined();
      expect(middle).toBeDefined();
      expect(last).toBeDefined();
      if (!first || !middle || !last) {
        continue;
      }
      const collinear =
        (middle.col - first.col) * (last.row - first.row) ===
        (middle.row - first.row) * (last.col - first.col);
      expect(collinear).toBe(true);
      expect(MOLENSPEL_ADJACENCY[middle.id]).toContain(first.id);
      expect(MOLENSPEL_ADJACENCY[middle.id]).toContain(last.id);
    }
  });

  it("verbindt ieder punt met twee, drie of vier buren", () => {
    for (const neighbours of MOLENSPEL_ADJACENCY) {
      expect(neighbours.length).toBeGreaterThanOrEqual(2);
      expect(neighbours.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("molenspel: stenen leggen", () => {
  it("start met een leeg bord en negen stenen per speler", () => {
    const game = createMolenspelGame("wit");
    expect(game.board.every((piece) => piece === null)).toBe(true);
    expect(game.inHand).toEqual({ wit: 9, zwart: 9 });
    expect(game.turn).toBe("wit");
    expect(game.phase).toBe("plaatsen");
  });

  it("wisselt van beurt na het leggen van een steen", () => {
    const game = placePiece(createMolenspelGame("wit"), 0);
    expect(game.board[0]).toBe("wit");
    expect(game.inHand.wit).toBe(8);
    expect(game.turn).toBe("zwart");
  });

  it("laat een steen niet op een bezet punt leggen", () => {
    const first = placePiece(createMolenspelGame("wit"), 0);
    const second = placePiece(first, 3);
    const third = placePiece(second, 0);
    expect(third).toBe(second);
    expect(third.board[0]).toBe("wit");
  });

  it("vraagt om een steen te pakken zodra er een molentje ligt", () => {
    const game = withMillOnTopRow();
    expect(game.awaitRemoval).toBe(true);
    expect(game.turn).toBe("wit");
  });
});

describe("molenspel: stenen pakken", () => {
  it("pakt eerst een losse steen en pas een molentje als alles vastzit", () => {
    const board = boardWith({ 0: "zwart", 1: "zwart", 2: "zwart", 3: "zwart" });
    expect(removablePieces(board, "wit")).toEqual([3]);

    const onlyMill = boardWith({ 0: "zwart", 1: "zwart", 2: "zwart" });
    expect(removablePieces(onlyMill, "wit")).toEqual([0, 1, 2]);
  });

  it("verwijdert de gekozen steen en geeft de beurt door", () => {
    const game = withMillOnTopRow();
    expect(game.awaitRemoval).toBe(true);
    const after = removePiece(game, 3);
    expect(after.board[3]).toBe(null);
    expect(after.board[0]).toBe("wit");
    expect(after.awaitRemoval).toBe(false);
    expect(after.turn).toBe("zwart");
  });

  it("laat een steen in een molentje met rust als er losse stenen zijn", () => {
    const game = gameWith(boardWith({ 0: "zwart", 1: "zwart", 2: "zwart", 3: "zwart" }), {
      turn: "wit",
      awaitRemoval: true,
    });
    expect(removePiece(game, 0)).toBe(game);
    expect(removePiece(game, 3).board[3]).toBe(null);
  });
});

describe("molenspel: stenen schuiven", () => {
  it("schuift een steen naar een naburig punt", () => {
    const game = gameWith(boardWith({ 0: "wit", 1: null, 10: "zwart", 11: "zwart", 12: "zwart" }));
    const moved = movePiece(game, 0, 1);
    expect(moved.board[0]).toBe(null);
    expect(moved.board[1]).toBe("wit");
    expect(moved.turn).toBe("zwart");
  });

  it("laat een steen niet over een andere steen heen springen", () => {
    const game = gameWith(boardWith({ 0: "wit", 1: "zwart", 3: null }));
    expect(movePiece(game, 0, 3)).toBe(game);
  });

  it("laat met drie stenen vliegen naar elk vrij punt", () => {
    const game = gameWith(boardWith({ 0: "wit", 1: "wit", 3: "wit", 10: "zwart" }));
    const moves = legalMoves(game, "wit");
    expect(moves.get(0)).toContain(20);
    expect(moves.get(0)).toContain(21);
  });

  it("selecteert en deselecteert een eigen steen", () => {
    const game = gameWith(boardWith({ 0: "wit" }));
    const selected = selectPiece(game, 0);
    expect(selected.selected).toBe(0);
    expect(selectPiece(selected, 0).selected).toBe(null);
  });

  it("kiest een doelpunt voor de geselecteerde steen", () => {
    const game = gameWith(boardWith({ 0: "wit", 1: null }));
    const selected = selectPiece(game, 0);
    const moved = chooseTarget(selected, 1);
    expect(moved.board[1]).toBe("wit");
    expect(moved.board[0]).toBe(null);
  });
});

describe("molenspel: winnen en gelijkspel", () => {
  it("wint als de tegenstander nog maar twee stenen over heeft", () => {
    // Zwart heeft drie stenen, wit sluit een molentje op de rij 15, 16 en 17.
    let game = gameWith(
      boardWith({ 0: "zwart", 3: "zwart", 6: "zwart", 15: "wit", 17: "wit", 19: "wit" }),
      { turn: "wit" },
    );
    game = movePiece(game, 19, 16);
    expect(game.awaitRemoval).toBe(true);
    const after = removePiece(game, 0);
    expect(after.winner).toBe("wit");
  });

  it("wint als de tegenstander geen zet meer kan doen", () => {
    // Zwart heeft vier stenen die allemaal vastzitten; wit speelt een zet.
    const game = gameWith(
      boardWith({
        0: "zwart",
        1: "zwart",
        2: "zwart",
        4: "zwart",
        3: "wit",
        5: "wit",
        7: "wit",
        9: "wit",
        10: "wit",
        14: "wit",
      }),
      { turn: "wit" },
    );
    expect(hasLegalMove(game, "zwart")).toBe(false);
    const after = movePiece(game, 10, 11);
    expect(after.winner).toBe("wit");
  });

  it("laat een geblokkeerde speler met stenen in de hand nog verder spelen", () => {
    const game = gameWith(boardWith({ 0: "zwart", 1: "wit", 3: "wit", 9: "wit" }), {
      turn: "zwart",
      inHand: { wit: 0, zwart: 2 },
    });
    const after = placePiece(game, 5);
    expect(after.winner).toBe(null);
    expect(after.board[5]).toBe("zwart");
  });

  it("sluit het spel als gelijkspel na tien beurten met drie stenen", () => {
    const board = boardWith({
      0: "wit",
      1: "wit",
      2: "wit",
      10: "zwart",
      11: "zwart",
      12: "zwart",
    });
    const game = gameWith(board, { turn: "wit", endgame: true, endgameTurns: 9 });
    const after = movePiece(game, 0, 3);
    expect(after.draw).toBe(true);
  });
});

describe("molenspel: molentjes en fases", () => {
  it("herkent een molentje van één speler", () => {
    const board = boardWith({ 0: "wit", 1: "wit", 2: "wit" });
    expect(isInMill(board, "wit", 1)).toBe(true);
    expect(isInMill(board, "zwart", 1)).toBe(false);
    expect(millsOf(board, "wit")).toHaveLength(1);
  });

  it("rekent de fase uit per speler", () => {
    const game = gameWith(boardWith({ 0: "wit", 1: "wit", 2: "wit" }));
    expect(phaseFor(game, "wit")).toBe("vliegen");
    expect(piecesOnBoard(game.board, "wit")).toBe(3);
  });

  it("wisselt bij een revanche de beginnende speler", () => {
    const game = createMolenspelGame("wit");
    expect(rematchMolenspel(game).turn).toBe("zwart");
  });
});
