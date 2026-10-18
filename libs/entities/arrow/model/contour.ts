import { mulberry32 } from "@shared/lib";
import { isArrowRemovable } from "./geometry";
import type { MazeArrow, MazeLevel, Point } from "./types";
import type { ShapeMask } from "./shapes";

interface Edge {
  a: Point;
  b: Point;
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

const LAYER_NEIGHBORS: readonly Point[] = [
  ...NEIGHBORS,
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

/**
 * Cell boundary edges, oriented so the inside of the current layer is on the
 * right. That makes every contour a clockwise walk in screen coordinates.
 */
const EDGE_DEFINITIONS: readonly {
  neighbor: (point: Point) => Point;
  a: (point: Point) => Point;
  b: (point: Point) => Point;
}[] = [
  {
    neighbor: (point) => ({ x: point.x, y: point.y - 1 }),
    a: (point) => ({ x: point.x, y: point.y }),
    b: (point) => ({ x: point.x + 1, y: point.y }),
  },
  {
    neighbor: (point) => ({ x: point.x + 1, y: point.y }),
    a: (point) => ({ x: point.x + 1, y: point.y }),
    b: (point) => ({ x: point.x + 1, y: point.y + 1 }),
  },
  {
    neighbor: (point) => ({ x: point.x, y: point.y + 1 }),
    a: (point) => ({ x: point.x + 1, y: point.y + 1 }),
    b: (point) => ({ x: point.x, y: point.y + 1 }),
  },
  {
    neighbor: (point) => ({ x: point.x - 1, y: point.y }),
    a: (point) => ({ x: point.x, y: point.y + 1 }),
    b: (point) => ({ x: point.x, y: point.y }),
  },
];

const EMPTY_REMOVED: ReadonlySet<number> = new Set();

function key(point: Point): string {
  return `${point.x},${point.y}`;
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function directionBetween(from: Point, to: Point): Point {
  return { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) };
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

/**
 * Chebyshev distance from the outside of the silhouette, one-based. Diagonal
 * neighbours count too: without them, consecutive contour layers touch at the
 * corners of diagonal steps and two arrow bodies would overlap there.
 */
function layerMap(mask: ShapeMask): Map<string, number> {
  const distance = new Map<string, number>();
  const queue: Point[] = [];

  forEachCell(mask, (point) => {
    if (inside(mask, point) && LAYER_NEIGHBORS.some((step) => !inside(mask, add(point, step)))) {
      distance.set(key(point), 1);
      queue.push(point);
    }
  });

  while (queue.length > 0) {
    const point = queue.shift() as Point;
    const current = distance.get(key(point)) as number;

    for (const step of LAYER_NEIGHBORS) {
      const next = add(point, step);
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
  const inRegion = (point: Point) => inside(mask, point) && (layers.get(key(point)) ?? 0) >= layer;
  const edges: Edge[] = [];

  forEachCell(mask, (point) => {
    if (!inRegion(point)) {
      return;
    }
    for (const definition of EDGE_DEFINITIONS) {
      if (!inRegion(definition.neighbor(point))) {
        edges.push({ a: definition.a(point), b: definition.b(point) });
      }
    }
  });

  return edges;
}

type EdgesByStart = Map<string, Edge[]>;

function turnOrder(incoming: Point): Point[] {
  const right = { x: -incoming.y, y: incoming.x };
  const left = { x: incoming.y, y: -incoming.x };
  return [right, incoming, left, { x: -incoming.x, y: -incoming.y }];
}

function nextEdge(current: Edge, byStart: EdgesByStart, unused: ReadonlySet<string>): Edge | null {
  const options = (byStart.get(key(current.b)) ?? []).filter((candidate) =>
    unused.has(`${key(candidate.a)}|${key(candidate.b)}`),
  );
  if (options.length === 0) {
    return null;
  }
  const order = turnOrder(directionBetween(current.a, current.b));
  const rank = (edge: Edge) =>
    order.findIndex((step) => samePoint(step, directionBetween(edge.a, edge.b)));
  return options.reduce((best, edge) => (rank(edge) < rank(best) ? edge : best));
}

function traceLoop(start: Edge, byStart: EdgesByStart, unused: Set<string>): Point[] {
  const points: Point[] = [start.a];
  let current = start;

  while (true) {
    unused.delete(`${key(current.a)}|${key(current.b)}`);
    points.push(current.b);
    if (samePoint(current.b, start.a)) {
      break;
    }
    const next = nextEdge(current, byStart, unused);
    if (!next) {
      break;
    }
    current = next;
  }

  return samePoint(points[0] as Point, points[points.length - 1] as Point)
    ? points.slice(0, -1)
    : [];
}

/**
 * Walks the boundary with a right-hand rule. At a diagonal pinch point four
 * edges meet; turning right keeps the two touching loops separate instead of
 * stitching them into a figure eight.
 */
function contourLoops(edges: readonly Edge[]): Point[][] {
  const unused = new Set(edges.map((edge) => `${key(edge.a)}|${key(edge.b)}`));
  const byStart: EdgesByStart = new Map();

  for (const edge of edges) {
    const list = byStart.get(key(edge.a)) ?? [];
    list.push(edge);
    byStart.set(key(edge.a), list);
  }

  const loops: Point[][] = [];
  for (const edge of edges) {
    if (!unused.has(`${key(edge.a)}|${key(edge.b)}`)) {
      continue;
    }
    const loop = traceLoop(edge, byStart, unused);
    if (loop.length > 1) {
      loops.push(loop);
    }
  }

  return loops;
}

function isCorner(points: readonly Point[], index: number): boolean {
  const n = points.length;
  if (index <= 0 || index >= n - 1) {
    return false;
  }
  const previous = directionBetween(points[index - 1] as Point, points[index] as Point);
  const next = directionBetween(points[index] as Point, points[index + 1] as Point);
  return !samePoint(previous, next);
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

function cornerIndices(loop: readonly Point[]): number[] {
  const count = loop.length;
  const corners: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const previous = directionBetween(
      loop[(index - 1 + count) % count] as Point,
      loop[index] as Point,
    );
    const next = directionBetween(loop[index] as Point, loop[(index + 1) % count] as Point);
    if (!samePoint(previous, next)) {
      corners.push(index);
    }
  }
  return corners;
}

/** A cut between two corners leaves a gap that the escape lane can pass through. */
function cutLoop(loop: readonly Point[], random: () => number): Point[] {
  const corners = cornerIndices(loop);
  const cut = corners[Math.floor(random() * corners.length)] ?? 0;
  const chain: Point[] = [];
  for (let index = 0; index < loop.length; index += 1) {
    chain.push(loop[(cut + index) % loop.length] as Point);
  }
  return chain;
}

function chunkEnd(
  chain: readonly Point[],
  start: number,
  minChunk: number,
  maxChunk: number,
  random: () => number,
): number {
  const target = minChunk + Math.floor(random() * (maxChunk - minChunk + 1));
  let end = Math.min(start + target, chain.length - 1);

  // Avoid a one-segment stub at the end of a contour.
  if (chain.length - 1 - end === 1 && end > start + 1) {
    end -= 1;
  }

  if (end >= chain.length - 1) {
    return end;
  }
  for (let candidate = end; candidate >= start + 2; candidate -= 1) {
    if (isCorner(chain, candidate)) {
      return candidate;
    }
  }
  return end;
}

/**
 * Cuts a closed contour open at a corner and splits the resulting chain into
 * arrows. Every arrow starts and ends on a lattice point; the final segment is
 * the escape direction, exactly like the rest of the arrow.
 */
function chunkLoop(
  loop: readonly Point[],
  minChunk: number,
  maxChunk: number,
  random: () => number,
): Point[][] {
  if (loop.length < 2) {
    return [];
  }
  const chain = cutLoop(loop, random);
  const chunks: Point[][] = [];
  let start = 0;

  while (start < chain.length - 1) {
    const end = chunkEnd(chain, start, minChunk, maxChunk, random);
    chunks.push(chain.slice(start, end + 1));
    start = end;
  }

  return chunks;
}

function reverse(arrow: MazeArrow): MazeArrow {
  return { id: arrow.id, points: [...arrow.points].reverse() };
}

function buildCandidates(
  loopsByLayer: readonly (readonly Point[][])[],
  minChunk: number,
  maxChunk: number,
  random: () => number,
): MazeArrow[] {
  const candidates: MazeArrow[] = [];
  let nextId = 1;

  for (const loops of loopsByLayer) {
    for (const loop of loops) {
      for (const chunk of chunkLoop(loop, minChunk, maxChunk, random)) {
        if (chunk.length >= 2) {
          candidates.push({ id: nextId, points: chunk });
          nextId += 1;
        }
      }
    }
  }

  return candidates;
}

function contourLoopsByLayer(mask: ShapeMask, maxLayers: number): Point[][][] {
  const layers = layerMap(mask);
  const deepest = Math.min(maxLayers, Math.max(0, ...layers.values()));
  const loopsByLayer: Point[][][] = [];

  for (let layer = 1; layer <= deepest; layer += 1) {
    loopsByLayer.push(contourLoops(contourEdges(mask, layers, layer)));
  }

  return loopsByLayer;
}

function levelWith(arrows: readonly MazeArrow[], width: number, height: number): MazeLevel {
  return {
    id: "candidate",
    name: "candidate",
    difficulty: "makkelijk",
    width,
    height,
    arrows,
  };
}

/**
 * Removes arrows one by one, flipping an arrow when only its reverse direction
 * is clear. The recorded order is a valid solution and every arrow that can be
 * cleared is kept.
 *
 * The generator uses the same lane rule as the game. That keeps one source of
 * truth for removability: an order that is valid here is valid in play. Arrows
 * that never become free are dropped, so the emitted set is solvable by
 * construction.
 */
function clearCandidates(
  candidates: readonly MazeArrow[],
  width: number,
  height: number,
  random: () => number,
): MazeArrow[] {
  const remaining = shuffle(candidates, random);
  const order: MazeArrow[] = [];

  while (remaining.length > 0) {
    const freeIndex = remaining.findIndex((arrow) =>
      isArrowRemovable(arrow, levelWith(remaining, width, height), EMPTY_REMOVED),
    );
    if (freeIndex >= 0) {
      order.push(remaining[freeIndex] as MazeArrow);
      remaining.splice(freeIndex, 1);
      continue;
    }

    let flipped = false;
    for (let index = 0; index < remaining.length && !flipped; index += 1) {
      const candidate = reverse(remaining[index] as MazeArrow);
      const others = remaining.filter((_, otherIndex) => otherIndex !== index);
      if (isArrowRemovable(candidate, levelWith(others, width, height), EMPTY_REMOVED)) {
        remaining[index] = candidate;
        order.push(candidate);
        remaining.splice(index, 1);
        flipped = true;
      }
    }

    if (!flipped) {
      break;
    }
  }

  return order;
}

interface VertexUse {
  id: number;
  mid: boolean;
}

function vertexUses(arrows: readonly MazeArrow[]): Map<string, VertexUse[]> {
  const uses = new Map<string, VertexUse[]>();
  for (const arrow of arrows) {
    for (let index = 0; index < arrow.points.length; index += 1) {
      const point = arrow.points[index] as Point;
      const list = uses.get(key(point)) ?? [];
      list.push({ id: arrow.id, mid: index > 0 && index < arrow.points.length - 1 });
      uses.set(key(point), list);
    }
  }
  return uses;
}

function shortestArrow(list: readonly VertexUse[], byId: ReadonlyMap<number, MazeArrow>): number {
  let victim = list[0]?.id ?? 0;
  let length = Infinity;
  for (const use of list) {
    const arrow = byId.get(use.id);
    if (arrow && arrow.points.length < length) {
      victim = use.id;
      length = arrow.points.length;
    }
  }
  return victim;
}

function contactVictim(
  uses: ReadonlyMap<string, VertexUse[]>,
  byId: ReadonlyMap<number, MazeArrow>,
): number | null {
  for (const list of uses.values()) {
    if (list.length > 1 && list.some((use) => use.mid)) {
      return shortestArrow(list, byId);
    }
  }
  return null;
}

/** Arrows may meet end to end, but a body may never touch another arrow. */
function removeBodyContacts(arrows: MazeArrow[]): MazeArrow[] {
  const kept = [...arrows];

  while (true) {
    const byId = new Map(kept.map((arrow) => [arrow.id, arrow]));
    const victim = contactVictim(vertexUses(kept), byId);
    if (victim === null) {
      return kept;
    }
    kept.splice(
      kept.findIndex((arrow) => arrow.id === victim),
      1,
    );
  }
}

/**
 * Builds the contours from the outside in and cuts them into arrows. Arrows
 * only ever follow lattice edges; no arrow extends into a neighbouring lane.
 * Each attempt keeps the arrows that a greedy solver can clear, and the level
 * uses the attempt that keeps the most arrows.
 */
export function buildContourArrows(mask: ShapeMask, options: ContourOptions): MazeArrow[] {
  const width = mask[0]?.length ?? 0;
  const height = mask.length;
  const minChunk = Math.max(2, Math.min(options.minChunk, options.maxChunk));
  const maxChunk = Math.max(minChunk, options.maxChunk);
  const loopsByLayer = contourLoopsByLayer(mask, options.maxLayers);
  let best: MazeArrow[] = [];

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const random = mulberry32(options.seed + attempt * 977);
    const candidates = buildCandidates(loopsByLayer, minChunk, maxChunk, random);
    const cleared = removeBodyContacts(clearCandidates(candidates, width, height, random));
    if (cleared.length > best.length) {
      best = cleared;
    }
  }

  return best.map((arrow, index) => ({ id: index + 1, points: arrow.points }));
}
