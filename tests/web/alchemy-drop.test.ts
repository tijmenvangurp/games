import type { DragEndEvent } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import {
  BOARD_ID,
  boardItemId,
  dropPosition,
  elementForDrag,
  parseActiveId,
  resolveDrop,
  shelfHandleItemId,
  shelfItemId,
} from "@features/alchemy-lab";

function dragEnd(translated: { left: number; top: number; width: number; height: number } | null) {
  return {
    active: {
      id: "active",
      rect: { current: { initial: null, translated } },
    },
    over: { id: BOARD_ID },
  } as unknown as DragEndEvent;
}

const board = {
  getBoundingClientRect: () => ({ left: 100, top: 50, width: 300, height: 300 }),
} as HTMLElement;

describe("alchemy drag identifiers", () => {
  it("builds and parses shelf and board ids", () => {
    expect(shelfItemId("water")).toBe("alchemy-shelf-item:water");
    expect(shelfHandleItemId("water")).toBe("alchemy-shelf-handle:water");
    expect(boardItemId("board-1")).toBe("alchemy-board-item:board-1");

    expect(parseActiveId("alchemy-shelf-item:water")).toEqual({
      source: "shelf",
      elementId: "water",
    });
    expect(parseActiveId("alchemy-shelf-handle:water")).toEqual({
      source: "shelf",
      elementId: "water",
    });
    expect(parseActiveId("alchemy-board-item:board-1")).toEqual({
      source: "board",
      instanceId: "board-1",
    });
    expect(parseActiveId("something-else")).toBeNull();
  });
});

describe("alchemy dragged elements", () => {
  it("resolves a shelf element", () => {
    expect(elementForDrag({ source: "shelf", elementId: "water" }, [])?.id).toBe("water");
    expect(elementForDrag({ source: "shelf", elementId: "onbekend" }, [])).toBeNull();
  });

  it("resolves a placed board element", () => {
    const board = [
      { instanceId: "board-1", elementId: "fire", x: 0.2, y: 0.2 },
      { instanceId: "board-2", elementId: "onbekend", x: 0.4, y: 0.2 },
    ];

    expect(elementForDrag({ source: "board", instanceId: "board-1" }, board)?.id).toBe("fire");
    expect(elementForDrag({ source: "board", instanceId: "board-2" }, board)).toBeNull();
    expect(elementForDrag({ source: "board", instanceId: "missing" }, board)).toBeNull();
  });
});

describe("alchemy drop positions", () => {
  it("translates the dragged rect into a normalized board position", () => {
    expect(dropPosition(dragEnd({ left: 150, top: 100, width: 80, height: 80 }), board)).toEqual({
      x: 0.3,
      y: 0.3,
    });
  });

  it("returns undefined without a board or translated rect", () => {
    expect(dropPosition(dragEnd(null), board)).toBeUndefined();
    expect(
      dropPosition(dragEnd({ left: 150, top: 100, width: 80, height: 80 }), null),
    ).toBeUndefined();
  });
});

describe("alchemy drop resolution", () => {
  const position = { x: 0.4, y: 0.5 };

  it("adds a shelf element to the board", () => {
    expect(resolveDrop({ source: "shelf", elementId: "water" }, BOARD_ID, position)).toEqual({
      type: "add",
      elementId: "water",
      position,
    });
    expect(resolveDrop({ source: "shelf", elementId: "water" }, BOARD_ID, undefined)).toEqual({
      type: "add",
      elementId: "water",
      position: undefined,
    });
  });

  it("combines a shelf element with a board token", () => {
    expect(
      resolveDrop({ source: "shelf", elementId: "water" }, boardItemId("board-1"), position),
    ).toEqual({
      type: "combineWithBoard",
      elementId: "water",
      instanceId: "board-1",
    });
  });

  it("ignores a shelf drop outside the workbench", () => {
    expect(resolveDrop({ source: "shelf", elementId: "water" }, "elsewhere", position)).toBeNull();
  });

  it("combines two board tokens", () => {
    expect(
      resolveDrop({ source: "board", instanceId: "board-1" }, boardItemId("board-2"), position),
    ).toEqual({ type: "combineBoard", firstId: "board-1", secondId: "board-2" });
  });

  it("moves a board token when it is dropped on empty board space", () => {
    expect(resolveDrop({ source: "board", instanceId: "board-1" }, BOARD_ID, position)).toEqual({
      type: "move",
      instanceId: "board-1",
      position,
    });
  });

  it("ignores a board drop on itself or without a position", () => {
    expect(
      resolveDrop({ source: "board", instanceId: "board-1" }, boardItemId("board-1"), position),
    ).toBeNull();
    expect(resolveDrop({ source: "board", instanceId: "board-1" }, BOARD_ID, undefined)).toBeNull();
  });
});
