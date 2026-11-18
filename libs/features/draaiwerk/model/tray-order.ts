import type { Level, TrayItem } from "@entities/gear";

/** A small deterministic hash so every level keeps its own tray order. */
function hashLevelId(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32: enough randomness to shuffle a handful of parts. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The order the parts are shown in the bank. It is shuffled per level, so the
 * tray never reads like the recipe of the solution, but it stays the same on
 * every render and reload.
 */
export function trayOrder(level: Level): TrayItem[] {
  const items = [...level.tray];
  if (items.length < 2) {
    return items;
  }

  const random = seededRandom(hashLevelId(level.id));
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = items[index] as TrayItem;
    items[index] = items[swap] as TrayItem;
    items[swap] = current;
  }

  // Never show exactly the authored order; that is often the solution order.
  if (items.every((item, index) => item.id === level.tray[index]?.id)) {
    const first = items.shift();
    if (first) {
      items.push(first);
    }
  }

  return items;
}
