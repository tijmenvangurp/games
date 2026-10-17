import { mulberry32 } from "@shared/lib";
import { isArrowRemovable } from "./geometry";
import type { MazeArrow, MazeLevel, Point } from "./types";
import type { ShapeMask } from "./shapes";

interface Edge {
  a: Point;
  b: Point;
  out: Point;
}

interface EdgeDefinition {
  neighbor: (point: Point) => Point;
  a: (point: Point) => Point;
  b: (point: Point) => Point;
  out: Point;
}

interface ContourOptions {
  maxLayers: number;
  minChunk: number;
  maxChunk: number;
  seed: number;
}

const NEIGHBORS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const EDGE_DEFINITIONS: readonly EdgeDefinition[] = [
  {
    neighbor: (point) => ({ x: point.x, y: point.y - 1 }),
    a: (point) => ({ x: point.x, y: point.y }),
    b: (point) => ({ x: point.x + 1, y: point.y }),
    out: { x: 0, y: -1 },
  },
  {
    neighbor: (point) => ({ x: point.x + 1, y: point.y }),
    a: (point) => ({ x: point.x + 1, y: point.y }),
    b: (point) => ({ x: point.x + 1, y: point.y + 1 }),
    out: { x: 1, y: 0 },
  },
  {
    neighbor: (point) => ({ x: point.x, y: point.y + 1 }),
    a: (point) => ({ x: point.x + 1, y: point.y + 1 }),
    b: (point) => ({ x: point.x, y: point.y + 1 }),
    out: { x: 0, y: 1 },
  },
  {
    neighbor: (point) => ({ x: point.x - 1, y: point.y }),
    a: (point) => ({ x: point.x, y: point.y + 1 }),
    b: (point) => ({ x: point.x, y: point.y }),
    out: { x: -1, y: 0 },
  },
];

function key(point: Point): string {
  return `${point.x},${point.y}`;
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function inside(mask: ShapeMask, point: Point): boolean {
  return (
    point.y >= 0 &&
    point.y < mask.length &&
    point.x >= 0 &&
    point.x < (mask[point.y]?.length ?? 0) &&
    mask[point.y]?.[point.x] === "#"
  );
}

function forEachCell(mask: ShapeMask, visit: (point: Point) => void): void {
  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < (mask[y]?.length ?? 0); x += 1) {
      visit({ x, y });
    }
  }
}

function hasOutsideNeighbor(mask: ShapeMask, point: Point): boolean {
  return NEIGHBORS.some((direction) => !inside(mask, add(point, direction)));
}

function layerMap(mask: ShapeMask): Map<string, number> {
  const distance = new Map<string, number>();
  const queue: Point[] = [];

  forEachCell(mask, (point) => {
    if (inside(mask, point) && hasOutsideNeighbor(mask, point)) {
      distance.set(key(point), 1);
      queue.push(point);
    }
  });

  while (queue.length > 0) {
    const point = queue.shift();
    if (!point) {
      break;
    }
    const current = distance.get(key(point)) ?? 0;

    for (const direction of NEIGHBORS) {
      const next = add(point, direction);
      if (!inside(mask, next) || (distance.get(key(next)) ?? Infinity) <= current + 1) {
        continue;
      }
      distance.set(key(next), current + 1);
      queue.push(next);
    }
  }

  return distance;
}

function contourEdges(mask: ShapeMask, layers: Map<string, number>, layer: number): Edge[] {
  const cellInside = (point: Point) =>
    inside(mask, point) && (layers.get(key(point)) ?? 0) >= layer;
  const cellOutside = (point: Point) => !cellInside(point);
  const edges: Edge[] = [];

  forEachCell(mask, (point) => {
    if (!cellInside(point)) {
      return;
    }
    for (const definition of EDGE_DEFINITIONS) {
      if (cellOutside(definition.neighbor(point))) {
        edges.push({
          a: definition.a(point),
          b: definition.b(point),
          out: definition.out,
        });
      }
    }
  });

  return edges;
}

function buildAdjacency(edges: readonly Edge[]): Map<string, Edge[]> {
  const atPoint = new Map<string, Edge[]>();

  for (const edge of edges) {
    for (const point of [edge.a, edge.b]) {
      const list = atPoint.get(key(point)) ?? [];
      list.push(edge);
      atPoint.set(key(point), list);
    }
  }

  return atPoint;
}

function walkLoop(start: Edge, unused: Set<string>, atPoint: Map<string, Edge[]>): Edge[] {
  const loop: Edge[] = [start];
  unused.delete(`${key(start.a)}|${key(start.b)}`);
  let current = start.b;

  while (true) {
    const options = (atPoint.get(key(current)) ?? []).filter((edge) =>
      unused.has(`${key(edge.a)}|${key(edge.b)}`),
    );
    if (options.length === 0) {
      break;
    }
    const next = options[0] as Edge;
    loop.push(next);
    unused.delete(`${key(next.a)}|${key(next.b)}`);
    current = next.b;
    if (key(current) === key(start.a)) {
      break;
    }
  }

  return loop;
}

function contourLoops(edges: readonly Edge[]): Edge[][] {
  const unused = new Set(edges.map((edge) => `${key(edge.a)}|${key(edge.b)}`));
  const atPoint = buildAdjacency(edges);
  const loops: Edge[][] = [];

  for (const edge of edges) {
    if (!unused.has(`${key(edge.a)}|${key(edge.b)}`)) {
      continue;
    }
    loops.push(walkLoop(edge, unused, atPoint));
  }

  return loops;
}

function uniquePoints(points: readonly Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) {
      result.push(point);
    }
  }
  return result;
}

function buildLayerArrows(
  mask: ShapeMask,
  layers: Map<string, number>,
  layer: number,
  random: () => number,
  minChunk: number,
  maxChunk: number,
  nextId: () => number,
): MazeArrow[] {
  const arrows: MazeArrow[] = [];

  for (const loop of contourLoops(contourEdges(mask, layers, layer))) {
    const points = uniquePoints([loop[0]?.a as Point, ...loop.map((edge) => edge.b)]);
    let start = 0;

    while (start < points.length - 1) {
      const length = minChunk + Math.floor(random() * (maxChunk - minChunk + 1));
      const end = Math.min(start + length, points.length - 1);
      const chunk = points.slice(start, end + 1);
      const firstEdge = loop[start];

      if (chunk.length >= 2 && firstEdge) {
        const head = chunk[0] as Point;
        const radial = add(head, firstEdge.out);
        const tailToHead = [...chunk].reverse();
        tailToHead.push(radial);
        arrows.push({ id: nextId(), points: uniquePoints(tailToHead) });
      }

      start = end;
    }
  }

  return arrows;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = copy[index] as T;
    copy[index] = copy[swapWith] as T;
    copy[swapWith] = current;
  }
  return copy;
}

function buildAttempt(
  candidates: readonly { arrow: MazeArrow; layer: number }[],
  maxLayer: number,
  width: number,
  height: number,
  random: () => number,
): MazeArrow[] {
  const placed: MazeArrow[] = [];
  const tempLevel: MazeLevel = {
    id: "temp",
    name: "temp",
    difficulty: "makkelijk",
    width,
    height,
    arrows: [],
  };

  for (let layer = maxLayer; layer >= 1; layer -= 1) {
    const layerArrows = shuffle(
      candidates.filter((candidate) => candidate.layer === layer),
      random,
    );

    for (const { arrow } of layerArrows) {
      tempLevel.arrows = placed;
      if (!isArrowRemovable(arrow, tempLevel, new Set())) {
        continue;
      }
      placed.push({ id: arrow.id, points: arrow.points });
    }
  }

  return placed;
}

/**
 * Builds the contours from the outside in, then places arrows from the inside
 * out. Each new arrow must have a free lane against the arrows already placed,
 * so reversing the placement order is always a valid solution.
 */
export function buildContourArrows(mask: ShapeMask, options: ContourOptions): MazeArrow[] {
  const layers = layerMap(mask);
  const maxLayer = Math.min(options.maxLayers, Math.max(0, ...layers.values()));
  const random = mulberry32(options.seed);
  const minChunk = Math.max(2, Math.min(options.minChunk, options.maxChunk));
  const maxChunk = Math.max(minChunk, options.maxChunk);
  let next = 1;
  const nextId = () => next++;
  const candidates: { arrow: MazeArrow; layer: number }[] = [];

  for (let layer = 1; layer <= maxLayer; layer += 1) {
    for (const arrow of buildLayerArrows(mask, layers, layer, random, minChunk, maxChunk, nextId)) {
      candidates.push({ arrow, layer });
    }
  }

  const width = mask[0]?.length ?? 0;
  const height = mask.length;
  let best: MazeArrow[] = [];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const placed = buildAttempt(candidates, maxLayer, width, height, random);
    if (placed.length > best.length) {
      best = placed;
    }
  }

  return best.map((arrow, index) => ({ id: index + 1, points: arrow.points }));
}
