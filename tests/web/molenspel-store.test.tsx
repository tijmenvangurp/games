import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MolenspelBoard, useMolenspelStore } from "@features/molenspel";
import { createMolenspelGame } from "@entities/molenspel";

const STORAGE_KEY = "games.molenspel.v1";

beforeEach(() => {
  localStorage.clear();
  useMolenspelStore.setState({ game: createMolenspelGame("wit"), started: false });
});

afterEach(() => {
  cleanup();
});

describe("useMolenspelStore", () => {
  it("start een spel met de gekozen beginnende speler", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("zwart");
    });

    expect(result.current.started).toBe(true);
    expect(result.current.game.turn).toBe("zwart");
    expect(result.current.game.inHand).toEqual({ wit: 9, zwart: 9 });
  });

  it("legt een steen en wisselt van beurt", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    let outcome = "ignored";
    act(() => {
      outcome = result.current.tap(0);
    });

    expect(outcome).toBe("placed");
    expect(result.current.game.board[0]).toBe("wit");
    expect(result.current.game.turn).toBe("zwart");
  });

  it("slaat het spel lokaal op", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.tap(0);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.started).toBe(true);
    expect(stored.game.board[0]).toBe("wit");
  });

  it("negeert tikken als er geen spel loopt", () => {
    const { result } = renderHook(() => useMolenspelStore());

    let outcome = "placed";
    act(() => {
      outcome = result.current.tap(0);
    });

    expect(outcome).toBe("ignored");
    expect(result.current.game.board[0]).toBe(null);
  });

  it("negeert een steen van de tegenstander", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.tap(0);
    });
    let outcome = "placed";
    act(() => {
      outcome = result.current.tap(0);
    });

    expect(outcome).toBe("ignored");
  });
});

describe("useMolenspelStore: wisselen van speler en spel", () => {
  it("start bij een revanche met de andere speler", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.restart();
    });

    expect(result.current.game.turn).toBe("zwart");
    expect(result.current.game.board.every((piece) => piece === null)).toBe(true);
  });

  it("gaat terug naar de uitleg", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.backToSetup();
    });

    expect(result.current.started).toBe(false);
  });

  it("kiest een steen en verplaatst hem", () => {
    const base = createMolenspelGame("wit");
    const board = base.board.slice();
    board[0] = "wit";
    board[1] = null;
    board[10] = "zwart";
    board[11] = "zwart";
    board[12] = "zwart";
    useMolenspelStore.setState({
      game: { ...base, board, inHand: { wit: 0, zwart: 0 }, phase: "schuiven" },
      started: true,
    });
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.tap(0);
    });
    expect(result.current.game.selected).toBe(0);

    act(() => {
      result.current.tap(1);
    });
    expect(result.current.game.board[1]).toBe("wit");
    expect(result.current.game.board[0]).toBe(null);
  });

  it("draait een zet terug", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.tap(0);
    });
    expect(result.current.game.board[0]).toBe("wit");
    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.undo();
    });
    expect(result.current.game.board[0]).toBe(null);
    expect(result.current.game.turn).toBe("wit");
    expect(result.current.history).toHaveLength(0);
  });

  it("doet niets als er niets terug te draaien is", () => {
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.start("wit");
    });
    act(() => {
      result.current.undo();
    });
    expect(result.current.game.board.every((piece) => piece === null)).toBe(true);
  });

  it("wisselt van steen als je naast een doel tik", () => {
    const base = createMolenspelGame("wit");
    const board = base.board.slice();
    board[0] = "wit";
    board[1] = "wit";
    board[2] = null;
    board[10] = "zwart";
    board[11] = "zwart";
    board[12] = "zwart";
    useMolenspelStore.setState({
      game: { ...base, board, inHand: { wit: 0, zwart: 0 }, phase: "schuiven" },
      started: true,
    });
    const { result } = renderHook(() => useMolenspelStore());

    act(() => {
      result.current.tap(0);
    });
    expect(result.current.game.selected).toBe(0);

    // Punt 1 is een eigen steen en geen doel: de selectie verspringt.
    act(() => {
      result.current.tap(1);
    });
    expect(result.current.game.selected).toBe(1);
    expect(result.current.game.board[0]).toBe("wit");
  });
});

describe("MolenspelBoard", () => {
  it("toont 24 klikbare punten", () => {
    const game = createMolenspelGame("wit");
    render(<MolenspelBoard game={game} removable={[]} onTap={() => undefined} />);

    expect(screen.getAllByRole("button")).toHaveLength(24);
  });

  it("sluit de drie vierkanten van het bord", () => {
    const game = createMolenspelGame("wit");
    const { container } = render(
      <MolenspelBoard game={game} removable={[]} onTap={() => undefined} />,
    );
    const polylines = [...container.querySelectorAll("polyline")];

    // Drie gesloten vierkanten en vier open verbindingen.
    expect(polylines).toHaveLength(7);
    for (const line of polylines.slice(0, 3)) {
      const points = (line.getAttribute("points") ?? "").trim().split(" ");
      expect(points[0]).toBe(points[points.length - 1]);
    }
    for (const line of polylines.slice(3)) {
      const points = (line.getAttribute("points") ?? "").trim().split(" ");
      expect(points[0]).not.toBe(points[points.length - 1]);
    }
  });

  it("meldt welke steen je kunt kiezen", () => {
    const base = createMolenspelGame("wit");
    const board = base.board.slice();
    board[0] = "wit";
    const game = { ...base, board };
    render(<MolenspelBoard game={game} removable={[]} onTap={() => undefined} />);

    expect(screen.getByLabelText(/Eigen steen \(wit\)/)).toBeDefined();
  });

  it("roept de klik aan met het puntnummer", () => {
    const game = createMolenspelGame("wit");
    const taps: number[] = [];
    render(<MolenspelBoard game={game} removable={[]} onTap={(point) => taps.push(point)} />);

    const buttons = screen.getAllByRole("button");
    act(() => {
      fireEvent.click(buttons[4] as Element);
    });

    expect(taps).toEqual([4]);
  });
});

describe("MolenspelBoard: toetsen en markeringen", () => {
  it("reageert op Enter en spatie", () => {
    const game = createMolenspelGame("wit");
    const taps: number[] = [];
    render(<MolenspelBoard game={game} removable={[]} onTap={(point) => taps.push(point)} />);

    const buttons = screen.getAllByRole("button");
    act(() => {
      fireEvent.keyDown(buttons[2] as Element, { key: "Enter" });
      fireEvent.keyDown(buttons[3] as Element, { key: " " });
    });

    expect(taps).toEqual([2, 3]);
  });

  it("markeert de stenen van de speler aan de beurt", () => {
    const base = createMolenspelGame("wit");
    const board = base.board.slice();
    board[0] = "wit";
    board[1] = "wit";
    board[2] = "wit";
    const game = { ...base, board, inHand: { wit: 0, zwart: 0 }, phase: "schuiven" as const };
    render(<MolenspelBoard game={game} removable={[]} onTap={() => undefined} />);

    expect(screen.getAllByLabelText(/Eigen steen \(wit\), tik om te kiezen/)).toHaveLength(3);
  });

  it("markeert de stenen die weg mogen", () => {
    const base = createMolenspelGame("wit");
    const board = base.board.slice();
    board[0] = "zwart";
    const game = { ...base, board, awaitRemoval: true };
    render(<MolenspelBoard game={game} removable={[0]} onTap={() => undefined} />);

    expect(screen.getByLabelText(/Steen van zwart, tik om weg te nemen/)).toBeDefined();
  });
});
