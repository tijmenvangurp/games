import type { Point } from "./types";

export type ShapeMask = readonly string[];

type ShapePredicate = (x: number, y: number) => boolean;

function polygon(points: readonly Point[]): ShapePredicate {
  return (x, y) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const current = points[i] as Point;
      const previous = points[j] as Point;
      const intersects =
        current.y > y !== previous.y > y &&
        x < ((previous.x - current.x) * (y - current.y)) / (previous.y - current.y) + current.x;
      if (intersects) {
        inside = !inside;
      }
    }
    return inside;
  };
}

function ellipse(cx: number, cy: number, rx: number, ry: number): ShapePredicate {
  return (x, y) => (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1;
}

function circle(cx: number, cy: number, radius: number): ShapePredicate {
  return ellipse(cx, cy, radius, radius);
}

function union(...predicates: ShapePredicate[]): ShapePredicate {
  return (x, y) => predicates.some((predicate) => predicate(x, y));
}

function difference(outer: ShapePredicate, inner: ShapePredicate): ShapePredicate {
  return (x, y) => outer(x, y) && !inner(x, y);
}

function heartPolygon(): Point[] {
  const points: Point[] = [];
  for (let index = 0; index < 120; index += 1) {
    const angle = (index / 120) * Math.PI * 2;
    const x = 16 * Math.sin(angle) ** 3;
    const y =
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle);
    points.push({ x: 0.5 + x / 40, y: 0.48 - y / 40 });
  }
  return points;
}

function starPolygon(points = 5, cx = 0.5, cy = 0.5, outer = 0.48, inner = 0.2): Point[] {
  const vertices: Point[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    vertices.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return vertices;
}

const SHAPES: Record<string, ShapePredicate> = {
  heart: polygon(heartPolygon()),
  star: polygon(starPolygon()),
  fish: union(
    ellipse(0.43, 0.5, 0.27, 0.19),
    polygon([
      { x: 0.68, y: 0.5 },
      { x: 0.92, y: 0.28 },
      { x: 0.92, y: 0.72 },
    ]),
  ),
  rocket: polygon([
    { x: 0.5, y: 0.04 },
    { x: 0.62, y: 0.24 },
    { x: 0.62, y: 0.66 },
    { x: 0.82, y: 0.9 },
    { x: 0.62, y: 0.82 },
    { x: 0.62, y: 0.94 },
    { x: 0.38, y: 0.94 },
    { x: 0.38, y: 0.82 },
    { x: 0.18, y: 0.9 },
    { x: 0.38, y: 0.66 },
    { x: 0.38, y: 0.24 },
  ]),
  tree: union(
    polygon([
      { x: 0.5, y: 0.04 },
      { x: 0.08, y: 0.55 },
      { x: 0.92, y: 0.55 },
    ]),
    polygon([
      { x: 0.42, y: 0.5 },
      { x: 0.58, y: 0.5 },
      { x: 0.58, y: 0.96 },
      { x: 0.42, y: 0.96 },
    ]),
  ),
  house: union(
    polygon([
      { x: 0.12, y: 0.38 },
      { x: 0.5, y: 0.06 },
      { x: 0.88, y: 0.38 },
    ]),
    polygon([
      { x: 0.2, y: 0.36 },
      { x: 0.8, y: 0.36 },
      { x: 0.8, y: 0.94 },
      { x: 0.2, y: 0.94 },
    ]),
  ),
  cat: union(
    circle(0.5, 0.55, 0.3),
    polygon([
      { x: 0.24, y: 0.4 },
      { x: 0.22, y: 0.08 },
      { x: 0.44, y: 0.28 },
    ]),
    polygon([
      { x: 0.76, y: 0.4 },
      { x: 0.78, y: 0.08 },
      { x: 0.56, y: 0.28 },
    ]),
  ),
  flower: union(
    circle(0.5, 0.5, 0.14),
    ...[0, 1, 2, 3, 4, 5].map((index) => {
      const angle = (index / 6) * Math.PI * 2;
      return circle(0.5 + Math.cos(angle) * 0.24, 0.5 + Math.sin(angle) * 0.24, 0.15);
    }),
  ),
  moon: difference(circle(0.5, 0.5, 0.42), circle(0.64, 0.4, 0.36)),
};

export type ShapeName = keyof typeof SHAPES;

function predicateFor(name: ShapeName): ShapePredicate {
  return SHAPES[name] as ShapePredicate;
}

export function createShapeMask(name: ShapeName, size: number): ShapeMask {
  const predicate = predicateFor(name);
  const rows: string[] = [];

  for (let y = 0; y < size; y += 1) {
    let row = "";
    for (let x = 0; x < size; x += 1) {
      row += predicate((x + 0.5) / size, (y + 0.5) / size) ? "#" : ".";
    }
    rows.push(row);
  }

  return rows;
}
