import { beforeEach, describe, expect, it } from "vitest";
import { BASE_ELEMENT_IDS, ELEMENTS } from "@entities/alchemy";
import { resetAlchemyInstanceCounter, useAlchemyStore } from "@features/alchemy-lab";

const STORAGE_KEY = "games.mengelmoes.v1";

function resetStore() {
  localStorage.clear();
  resetAlchemyInstanceCounter();
  useAlchemyStore.setState({
    discovered: [...BASE_ELEMENT_IDS],
    board: [],
    selected: null,
    feedback: null,
    hint: null,
    missionId: "mud",
  });
}

function add(elementId: string, x = 0.2, y = 0.2): string {
  useAlchemyStore.getState().addToBoard(elementId, { x, y });
  return useAlchemyStore.getState().board.at(-1)?.instanceId ?? "";
}

beforeEach(resetStore);

describe("alchemy store", () => {
  it("adds an element and persists the board", () => {
    const id = add("water", 0.3, 0.4);

    const state = useAlchemyStore.getState();
    expect(id).not.toBe("");
    expect(state.board).toHaveLength(1);
    expect(state.board[0]).toMatchObject({ instanceId: id, elementId: "water", x: 0.3, y: 0.4 });
    expect(state.selected).toBe(id);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      board?: unknown[];
    };
    expect(stored.board).toHaveLength(1);
  });

  it("clamps positions to the workbench", () => {
    const id = add("water", 2, -2);
    useAlchemyStore.getState().moveBoardElement(id, { x: -3, y: 4 });

    expect(useAlchemyStore.getState().board[0]).toMatchObject({ x: 0.14, y: 0.84 });
  });

  it("combines two elements into a new discovery", () => {
    const water = add("water", 0.2, 0.2);
    const fire = add("fire", 0.6, 0.6);

    useAlchemyStore.getState().combineBoardElements(water, fire);

    const state = useAlchemyStore.getState();
    expect(state.discovered).toContain("steam");
    expect(state.board).toHaveLength(1);
    expect(state.board[0]).toMatchObject({ elementId: "steam", x: 0.4, y: 0.4 });
    expect(state.feedback).toEqual({ kind: "new", elementId: "steam" });
    expect(state.selected).toBe(state.board[0]?.instanceId);
  });

  it("keeps both elements when a combination does not exist", () => {
    const water = add("water", 0.2, 0.2);
    const fire = add("fire", 0.6, 0.6);
    useAlchemyStore.getState().combineBoardElements(water, fire);

    const steam = useAlchemyStore.getState().board[0]?.instanceId ?? "";
    const earth = add("earth", 0.3, 0.7);
    useAlchemyStore.getState().combineBoardElements(steam, earth);

    const state = useAlchemyStore.getState();
    expect(state.board).toHaveLength(2);
    expect(state.feedback).toEqual({ kind: "wrong" });
    expect(state.selected).toBeNull();
  });

  it("ignores the same instance and unknown ids", () => {
    const water = add("water");

    useAlchemyStore.getState().combineBoardElements(water, water);
    useAlchemyStore.getState().combineBoardElements("missing", water);
    useAlchemyStore.getState().combineWithBoard("fire", "missing");

    expect(useAlchemyStore.getState().board).toHaveLength(1);
    expect(useAlchemyStore.getState().discovered).not.toContain("steam");
  });

  it("combines a shelf element with a board element", () => {
    const water = add("water", 0.5, 0.5);

    useAlchemyStore.getState().combineWithBoard("fire", water);

    expect(useAlchemyStore.getState().board[0]).toMatchObject({ elementId: "steam" });
    expect(useAlchemyStore.getState().discovered).toContain("steam");
  });

  it("reports a known result without duplicating the element", () => {
    useAlchemyStore.setState({
      discovered: [...BASE_ELEMENT_IDS, "steam"],
      board: [
        { instanceId: "water-1", elementId: "water", x: 0.2, y: 0.2 },
        { instanceId: "fire-1", elementId: "fire", x: 0.6, y: 0.6 },
      ],
      selected: null,
      feedback: null,
      hint: null,
    });

    useAlchemyStore.getState().combineBoardElements("water-1", "fire-1");

    expect(useAlchemyStore.getState().feedback).toEqual({ kind: "known", elementId: "steam" });
    expect(useAlchemyStore.getState().discovered.filter((id) => id === "steam")).toHaveLength(1);
  });

  it("supports the tap-tap flow", () => {
    const water = add("water", 0.2, 0.2);
    const fire = add("fire", 0.6, 0.6);
    useAlchemyStore.setState({ selected: null });

    useAlchemyStore.getState().tapBoardElement(water);
    expect(useAlchemyStore.getState().selected).toBe(water);

    useAlchemyStore.getState().tapBoardElement(water);
    expect(useAlchemyStore.getState().selected).toBeNull();

    useAlchemyStore.getState().tapBoardElement(water);
    useAlchemyStore.getState().tapBoardElement(fire);

    expect(useAlchemyStore.getState().discovered).toContain("steam");
  });

  it("drops the oldest element when the workbench is full", () => {
    for (let index = 0; index < 12; index += 1) {
      add("water", 0.2 + (index % 4) * 0.1, 0.2 + Math.floor(index / 4) * 0.1);
    }
    const oldest = useAlchemyStore.getState().board[0]?.instanceId;

    add("fire", 0.5, 0.5);

    const state = useAlchemyStore.getState();
    expect(state.board).toHaveLength(12);
    expect(state.board.some((item) => item.instanceId === oldest)).toBe(false);
    expect(state.feedback).toEqual({ kind: "full" });
  });

  it("gives a hint and clears it", () => {
    useAlchemyStore.getState().showHint();

    expect(useAlchemyStore.getState().hint).toMatchObject({ result: "mud" });
    useAlchemyStore.getState().clearHint();
    expect(useAlchemyStore.getState().hint).toBeNull();
  });

  it("reports when everything is already discovered", () => {
    useAlchemyStore.setState({ discovered: ELEMENTS.map((element) => element.id) });

    useAlchemyStore.getState().showHint();

    expect(useAlchemyStore.getState().hint).toBeNull();
    expect(useAlchemyStore.getState().feedback).toEqual({ kind: "all-found" });
    useAlchemyStore.getState().dismissFeedback();
    expect(useAlchemyStore.getState().feedback).toBeNull();
  });

  it("clears the board and resets the game", () => {
    add("water");
    useAlchemyStore.getState().clearBoard();
    expect(useAlchemyStore.getState().board).toEqual([]);
    expect(useAlchemyStore.getState().selected).toBeNull();

    useAlchemyStore.setState({ discovered: [...BASE_ELEMENT_IDS, "steam"] });
    useAlchemyStore.getState().reset();

    const state = useAlchemyStore.getState();
    expect(state.discovered).toEqual(BASE_ELEMENT_IDS);
    expect(state.board).toEqual([]);
    expect(state.feedback).toBeNull();
    expect(state.hint).toBeNull();
  });
});
