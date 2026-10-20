import { describe, expect, it } from "vitest";
import { chessSquareStyles } from "@shared/lib";

describe("chessSquareStyles", () => {
  it("marks preview moves in blue and the target with a star", () => {
    const styles = chessSquareStyles({
      lastMove: null,
      selectedSquare: null,
      legalTargets: [],
      previewSquare: "h1",
      previewTargets: ["h2", "e1"],
      targetSquare: "e1",
    });

    expect(styles.h2?.backgroundImage).toContain("radial-gradient");
    expect(styles.h1?.boxShadow).toContain("2, 132, 199");
    expect(styles.e1?.boxShadow).toContain("#f59e0b");
  });

  it("marks only the hinted piece before revealing the destination", () => {
    const styles = chessSquareStyles({
      lastMove: null,
      selectedSquare: null,
      legalTargets: [],
      hintSquare: "g1",
    });

    expect(styles.g1?.boxShadow).toContain("#f59e0b");
    expect(styles.g1?.backgroundImage).toBeUndefined();
    expect(Object.keys(styles)).toEqual(["g1"]);
  });
});
