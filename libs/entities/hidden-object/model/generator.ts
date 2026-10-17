import { createSeed, mulberry32 } from "@shared/lib";
import {
  BELLY_COLORS,
  BODY_COLORS,
  DECOY_BADGES,
  HAT_COLORS,
  SCENE_MARGIN,
  SCENE_SIZE,
  SEEK_CONFIG,
  TARGET_BADGE,
  THEME_DECORATIONS,
} from "./config";
import type {
  BadgeKind,
  CreatureColors,
  Decoration,
  DecorationKind,
  HiddenCreature,
  SeekDifficulty,
  SeekScene,
  SeekTheme,
} from "./types";

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function jitter(amount: number, random: () => number): number {
  return (random() * 2 - 1) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomColors(random: () => number): CreatureColors {
  return {
    body: pick(BODY_COLORS, random),
    hat: pick(HAT_COLORS, random),
    belly: pick(BELLY_COLORS, random),
  };
}

function buildCreatures(
  difficulty: SeekDifficulty,
  random: () => number,
): { creatures: HiddenCreature[]; targetId: number } {
  const { columns, creatureScale } = SEEK_CONFIG[difficulty];
  const cell = (SCENE_SIZE - SCENE_MARGIN * 2) / columns;
  const size = cell * creatureScale;
  const targetId = Math.floor(random() * columns * columns);
  const creatures: HiddenCreature[] = [];

  for (let row = 0; row < columns; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const id = creatures.length;
      const x = clamp(
        SCENE_MARGIN + cell * (col + 0.5) + jitter(cell * 0.12, random),
        SCENE_MARGIN,
        SCENE_SIZE - SCENE_MARGIN,
      );
      const y = clamp(
        SCENE_MARGIN + cell * (row + 0.5) + jitter(cell * 0.12, random),
        SCENE_MARGIN,
        SCENE_SIZE - SCENE_MARGIN,
      );
      const badge: BadgeKind = id === targetId ? TARGET_BADGE : pick(DECOY_BADGES, random);

      creatures.push({
        id,
        x,
        y,
        size,
        rotation: jitter(9, random),
        colors: randomColors(random),
        badge,
      });
    }
  }

  return { creatures, targetId };
}

function isFreeSpot(
  x: number,
  y: number,
  size: number,
  creatures: readonly HiddenCreature[],
): boolean {
  return creatures.every((creature) => {
    const clearance = creature.size * 0.55 + size * 0.4;
    return Math.hypot(creature.x - x, creature.y - y) >= clearance;
  });
}

function buildDecorations(
  difficulty: SeekDifficulty,
  theme: SeekTheme,
  creatures: readonly HiddenCreature[],
  random: () => number,
): Decoration[] {
  const { decorations: count } = SEEK_CONFIG[difficulty];
  const { kinds, colors } = THEME_DECORATIONS[theme];
  const decorations: Decoration[] = [];
  const maxAttempts = count * 6;

  for (let attempt = 0; attempt < maxAttempts && decorations.length < count; attempt += 1) {
    const size = 22 + random() * 46;
    const x = 30 + random() * (SCENE_SIZE - 60);
    const y = 30 + random() * (SCENE_SIZE - 60);
    if (!isFreeSpot(x, y, size, creatures)) {
      continue;
    }

    const kind: DecorationKind = pick(kinds, random);
    decorations.push({
      id: decorations.length,
      x,
      y,
      size,
      rotation: random() * 360,
      kind,
      color: pick(colors, random),
    });
  }

  return decorations;
}

/** Builds a deterministic search scene with exactly one star-badged creature. */
export function createSeekScene(
  difficulty: SeekDifficulty,
  theme: SeekTheme,
  seed: number = createSeed(),
): SeekScene {
  const random = mulberry32(seed);
  const { creatures, targetId } = buildCreatures(difficulty, random);
  const decorations = buildDecorations(difficulty, theme, creatures, random);
  const { columns } = SEEK_CONFIG[difficulty];
  const hintRadius = ((SCENE_SIZE - SCENE_MARGIN * 2) / columns) * 1.35;

  return {
    seed,
    difficulty,
    theme,
    creatures,
    decorations,
    targetId,
    hintRadius,
  };
}

export function findTarget(scene: SeekScene): HiddenCreature {
  const target = scene.creatures.find((creature) => creature.id === scene.targetId);
  if (!target) {
    throw new Error("Seek scene has no target creature");
  }
  return target;
}
