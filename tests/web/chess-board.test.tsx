import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { chessBoardOptions } from "@shared/lib";
import { ChessBoard } from "@shared/ui";

const EMPTY_BOARD = "8/8/8/8/8/8/8/8 w - - 0 1";

function boardOptions(playerColor: "w" | "b") {
  return chessBoardOptions({
    position: EMPTY_BOARD,
    playerColor,
    allowDragging: false,
    squareStyles: {},
    onPieceDrop: () => false,
    onSquareClick: () => undefined,
  });
}

function coordinates(): { files: string; ranks: string } {
  return {
    ranks: document.querySelector('[data-coordinates="ranks"]')?.textContent ?? "",
    files: document.querySelector('[data-coordinates="files"]')?.textContent ?? "",
  };
}

afterEach(cleanup);

describe("ChessBoard", () => {
  it("zet de rijnummers links en de kolomletters onder het bord", () => {
    render(<ChessBoard label="Schaakbord met coördinaten" options={boardOptions("w")} />);

    expect(screen.getByRole("group", { name: /coördinaten/i })).toBeTruthy();
    expect(coordinates()).toEqual({ ranks: "87654321", files: "abcdefgh" });
  });

  it("draait de coördinaten mee als het bord omgedraaid staat", () => {
    render(<ChessBoard label="Schaakbord met coördinaten" options={boardOptions("b")} />);

    expect(coordinates()).toEqual({ ranks: "12345678", files: "hgfedcba" });
  });
});
