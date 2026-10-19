import type { CollisionDetection } from "@dnd-kit/core";
import { BOARD_ID } from "./dnd-ids";

/**
 * A forgiving center-distance detector. The original Little Alchemy clone
 * compared element centers within ±15 px; 56 px works much better for a
 * child's finger on a 72–88 px token.
 */
const MERGE_DISTANCE = 56;

export const mergeCollision: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  const activeRect = args.collisionRect;
  const activeX = activeRect.left + activeRect.width / 2;
  const activeY = activeRect.top + activeRect.height / 2;

  const hits: Array<{ id: string | number; data: { value: number } }> = [];

  for (const container of args.droppableContainers) {
    const id = String(container.id);
    if (id === activeId || id === BOARD_ID) {
      continue;
    }

    const rect = args.droppableRects.get(container.id);
    if (!rect) {
      continue;
    }

    const distance = Math.hypot(
      activeX - (rect.left + rect.width / 2),
      activeY - (rect.top + rect.height / 2),
    );

    if (distance <= MERGE_DISTANCE) {
      hits.push({ id: container.id, data: { value: distance } });
    }
  }

  hits.sort((first, second) => first.data.value - second.data.value);

  const board = args.droppableContainers.find((container) => String(container.id) === BOARD_ID);
  const boardRect = board ? args.droppableRects.get(board.id) : undefined;
  const overlapsBoard =
    boardRect !== undefined &&
    activeRect.left < boardRect.right &&
    activeRect.right > boardRect.left &&
    activeRect.top < boardRect.bottom &&
    activeRect.bottom > boardRect.top;

  if (board && overlapsBoard) {
    hits.push({ id: board.id, data: { value: Number.POSITIVE_INFINITY } });
  }

  return hits;
};
