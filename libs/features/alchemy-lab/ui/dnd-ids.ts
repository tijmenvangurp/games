export const BOARD_ID = "alchemy-board";
const BOARD_ITEM_PREFIX = "alchemy-board-item:";
const SHELF_ITEM_PREFIX = "alchemy-shelf-item:";
const SHELF_ICON_PREFIX = "alchemy-shelf-icon:";

export type ActiveAlchemyDrag =
  | { source: "shelf"; elementId: string }
  | { source: "board"; instanceId: string };

export function boardItemId(instanceId: string): string {
  return `${BOARD_ITEM_PREFIX}${instanceId}`;
}

export function shelfItemId(elementId: string): string {
  return `${SHELF_ITEM_PREFIX}${elementId}`;
}

export function shelfIconItemId(elementId: string): string {
  return `${SHELF_ICON_PREFIX}${elementId}`;
}

export function parseActiveId(id: string): ActiveAlchemyDrag | null {
  if (id.startsWith(SHELF_ICON_PREFIX)) {
    return { source: "shelf", elementId: id.slice(SHELF_ICON_PREFIX.length) };
  }
  if (id.startsWith(SHELF_ITEM_PREFIX)) {
    return { source: "shelf", elementId: id.slice(SHELF_ITEM_PREFIX.length) };
  }
  if (id.startsWith(BOARD_ITEM_PREFIX)) {
    return { source: "board", instanceId: id.slice(BOARD_ITEM_PREFIX.length) };
  }
  return null;
}

export function parseBoardItemId(id: string): string | null {
  return id.startsWith(BOARD_ITEM_PREFIX) ? id.slice(BOARD_ITEM_PREFIX.length) : null;
}
