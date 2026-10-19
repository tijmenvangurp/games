import type { CollisionDetection } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { BOARD_ID, mergeCollision } from "@features/alchemy-lab";

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

function rect(left: number, top: number, size = 80): Rect {
  return { left, top, right: left + size, bottom: top + size, width: size, height: size };
}

function collisionArgs(
  collisionRect: Rect,
  containers: string[],
  rects: Record<string, Rect>,
): Parameters<CollisionDetection>[0] {
  return {
    active: {
      id: "active",
      rect: { current: { initial: null, translated: null } },
      data: { current: undefined },
    },
    collisionRect,
    droppableRects: new Map(Object.entries(rects)),
    droppableContainers: containers.map((id) => ({ id })),
    pointerCoordinates: {
      x: collisionRect.left + collisionRect.width / 2,
      y: collisionRect.top + collisionRect.height / 2,
    },
  } as unknown as Parameters<CollisionDetection>[0];
}

describe("merge collision", () => {
  it("puts the nearest token before the workbench", () => {
    const result = mergeCollision(
      collisionArgs(rect(120, 100), [BOARD_ID, "token-1", "token-2"], {
        [BOARD_ID]: rect(0, 0, 400),
        "token-1": rect(140, 100),
        "token-2": rect(260, 100),
      }),
    );

    expect(result.map((hit) => hit.id)).toEqual(["token-1", BOARD_ID]);
  });

  it("sorts multiple nearby tokens by center distance", () => {
    const result = mergeCollision(
      collisionArgs(rect(120, 100), [BOARD_ID, "near", "nearest"], {
        [BOARD_ID]: rect(0, 0, 400),
        near: rect(170, 100),
        nearest: rect(130, 100),
      }),
    );

    expect(result.map((hit) => hit.id)).toEqual(["nearest", "near", BOARD_ID]);
  });

  it("skips the active token and the board when looking for tokens", () => {
    const result = mergeCollision(
      collisionArgs(rect(10, 10), ["active", "token-1", BOARD_ID], {
        [BOARD_ID]: rect(0, 0, 400),
        active: rect(10, 10),
        "token-1": rect(300, 300),
      }),
    );

    expect(result.map((hit) => hit.id)).toEqual([BOARD_ID]);
  });

  it("ignores containers without a measured rectangle", () => {
    const result = mergeCollision(
      collisionArgs(rect(10, 10), [BOARD_ID, "unmeasured"], {
        [BOARD_ID]: rect(0, 0, 400),
      }),
    );

    expect(result.map((hit) => hit.id)).toEqual([BOARD_ID]);
  });

  it("returns nothing when the drag is outside the workbench", () => {
    const result = mergeCollision(
      collisionArgs(rect(500, 500), [BOARD_ID, "token-1"], {
        [BOARD_ID]: rect(0, 0, 300),
        "token-1": rect(0, 0),
      }),
    );

    expect(result).toEqual([]);
  });

  it("accepts an overlap at the workbench edge", () => {
    const result = mergeCollision(
      collisionArgs(rect(350, 290), [BOARD_ID], {
        [BOARD_ID]: {
          left: 0,
          top: 0,
          right: 400,
          bottom: 300,
          width: 400,
          height: 300,
        },
      }),
    );

    expect(result.map((hit) => hit.id)).toEqual([BOARD_ID]);
  });
});
