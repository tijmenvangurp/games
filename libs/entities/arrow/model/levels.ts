import { buildContourArrows } from "./contour";
import { solveMaze } from "./geometry";
import { createShapeMask, type ShapeMask, type ShapeName } from "./shapes";
import type { MazeDifficulty, MazeLevel } from "./types";

interface LevelSpec {
  id: string;
  name: string;
  shape: ShapeName;
  size: number;
  maxLayers: number;
  minChunk: number;
  maxChunk: number;
  seed: number;
  difficulty: MazeDifficulty;
}

const LEVEL_SPECS: readonly LevelSpec[] = [
  {
    id: "hart-1",
    name: "Hart",
    shape: "heart",
    size: 24,
    maxLayers: 4,
    minChunk: 4,
    maxChunk: 7,
    seed: 11,
    difficulty: "makkelijk",
  },
  {
    id: "ster-1",
    name: "Ster",
    shape: "star",
    size: 24,
    maxLayers: 4,
    minChunk: 4,
    maxChunk: 6,
    seed: 12,
    difficulty: "makkelijk",
  },
  {
    id: "vis-1",
    name: "Vis",
    shape: "fish",
    size: 26,
    maxLayers: 4,
    minChunk: 4,
    maxChunk: 6,
    seed: 13,
    difficulty: "gemiddeld",
  },
  {
    id: "huis-1",
    name: "Huis",
    shape: "house",
    size: 26,
    maxLayers: 5,
    minChunk: 3,
    maxChunk: 6,
    seed: 14,
    difficulty: "gemiddeld",
  },
  {
    id: "boom-1",
    name: "Boom",
    shape: "tree",
    size: 28,
    maxLayers: 5,
    minChunk: 3,
    maxChunk: 6,
    seed: 15,
    difficulty: "moeilijk",
  },
  {
    id: "raket-1",
    name: "Raket",
    shape: "rocket",
    size: 28,
    maxLayers: 5,
    minChunk: 3,
    maxChunk: 6,
    seed: 16,
    difficulty: "moeilijk",
  },
  {
    id: "kat-1",
    name: "Kat",
    shape: "cat",
    size: 28,
    maxLayers: 6,
    minChunk: 3,
    maxChunk: 5,
    seed: 17,
    difficulty: "moeilijk",
  },
  {
    id: "bloem-1",
    name: "Bloem",
    shape: "flower",
    size: 28,
    maxLayers: 8,
    minChunk: 3,
    maxChunk: 5,
    seed: 18,
    difficulty: "super-hard",
  },
  {
    id: "maan-1",
    name: "Maan",
    shape: "moon",
    size: 28,
    maxLayers: 7,
    minChunk: 3,
    maxChunk: 5,
    seed: 19,
    difficulty: "super-hard",
  },
  {
    id: "hart-2",
    name: "Groot hart",
    shape: "heart",
    size: 30,
    maxLayers: 10,
    minChunk: 3,
    maxChunk: 5,
    seed: 20,
    difficulty: "super-hard",
  },
];

function maskFor(spec: LevelSpec): ShapeMask {
  return createShapeMask(spec.shape, spec.size);
}

function buildLevel(spec: LevelSpec): MazeLevel {
  const mask = maskFor(spec);
  const arrows = buildContourArrows(mask, {
    maxLayers: spec.maxLayers,
    minChunk: spec.minChunk,
    maxChunk: spec.maxChunk,
    seed: spec.seed,
  });

  const level: MazeLevel = {
    id: spec.id,
    name: spec.name,
    difficulty: spec.difficulty,
    width: spec.size,
    height: spec.size,
    arrows,
  };

  // The generator only keeps arrows it could clear, so this must always pass.
  // Guarding it here makes the solvability contract explicit: a level that
  // cannot be solved never reaches the game.
  if (arrows.length === 0 || solveMaze(level) === null) {
    throw new Error(`Arrow level ${spec.id} is not solvable`);
  }

  return level;
}

export const MAZE_LEVELS: readonly MazeLevel[] = LEVEL_SPECS.map(buildLevel);

export const LEVEL_COUNT = MAZE_LEVELS.length;

export function levelAt(index: number): MazeLevel {
  const level = MAZE_LEVELS[index];
  if (!level) {
    throw new Error(`Unknown arrow level: ${index}`);
  }
  return level;
}
