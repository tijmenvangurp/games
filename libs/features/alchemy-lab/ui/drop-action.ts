import type { DragEndEvent } from "@dnd-kit/core";
import { getElement, type AlchemyElement, type ElementId } from "@entities/alchemy";
import type { BoardElement } from "../model/use-alchemy-store";
import { BOARD_ID, parseBoardItemId, type ActiveAlchemyDrag } from "./dnd-ids";

export interface DropPosition {
  x: number;
  y: number;
}

export type DropAction =
  | { type: "add"; elementId: ElementId; position?: DropPosition }
  | { type: "combineWithBoard"; elementId: ElementId; instanceId: string }
  | { type: "combineBoard"; firstId: string; secondId: string }
  | { type: "move"; instanceId: string; position: DropPosition };

export function elementForDrag(
  drag: ActiveAlchemyDrag,
  board: readonly BoardElement[],
): AlchemyElement | null {
  if (drag.source === "shelf") {
    return getElement(drag.elementId) ?? null;
  }

  const item = board.find((candidate) => candidate.instanceId === drag.instanceId);
  return item ? (getElement(item.elementId) ?? null) : null;
}

export function dropPosition(
  event: DragEndEvent,
  board: HTMLElement | null,
): DropPosition | undefined {
  const boardRect = board?.getBoundingClientRect();
  const translated = event.active.rect.current.translated;
  if (!boardRect || !translated) {
    return undefined;
  }

  return {
    x: (translated.left + translated.width / 2 - boardRect.left) / boardRect.width,
    y: (translated.top + translated.height / 2 - boardRect.top) / boardRect.height,
  };
}

export function resolveDrop(
  drag: ActiveAlchemyDrag,
  overId: string,
  position: DropPosition | undefined,
): DropAction | null {
  if (drag.source === "shelf") {
    const targetInstance = parseBoardItemId(overId);
    if (targetInstance) {
      return { type: "combineWithBoard", elementId: drag.elementId, instanceId: targetInstance };
    }
    if (overId === BOARD_ID) {
      return { type: "add", elementId: drag.elementId, position };
    }
    return null;
  }

  const targetInstance = parseBoardItemId(overId);
  if (targetInstance && targetInstance !== drag.instanceId) {
    return { type: "combineBoard", firstId: drag.instanceId, secondId: targetInstance };
  }
  if (overId === BOARD_ID && position) {
    return { type: "move", instanceId: drag.instanceId, position };
  }
  return null;
}
