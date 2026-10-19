interface PolylinePoint {
  x: number;
  y: number;
}

function segmentLength(from: PolylinePoint, to: PolylinePoint): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

export function polylineLength(points: readonly PolylinePoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += segmentLength(points[index - 1] as PolylinePoint, points[index] as PolylinePoint);
  }
  return total;
}

export function pointAlongPolyline(
  points: readonly PolylinePoint[],
  distance: number,
): PolylinePoint {
  let remaining = distance;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1] as PolylinePoint;
    const to = points[index] as PolylinePoint;
    const length = segmentLength(from, to);
    if (length === 0) {
      continue;
    }
    if (remaining <= length) {
      const ratio = remaining / length;
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
    }
    remaining -= length;
  }
  return points[points.length - 1] as PolylinePoint;
}

export function trimPolyline(
  points: readonly PolylinePoint[],
  startInset: number,
  endInset: number,
): PolylinePoint[] {
  if (points.length < 2) {
    return [...points];
  }
  const total = polylineLength(points);
  const startDistance = Math.min(startInset, total);
  const endDistance = Math.max(startDistance, total - endInset);
  const result: PolylinePoint[] = [pointAlongPolyline(points, startDistance)];
  let travelled = 0;

  for (let index = 1; index < points.length; index += 1) {
    travelled += segmentLength(points[index - 1] as PolylinePoint, points[index] as PolylinePoint);
    if (travelled > startDistance && travelled < endDistance) {
      result.push(points[index] as PolylinePoint);
    }
  }

  result.push(pointAlongPolyline(points, endDistance));
  return result;
}
