export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Total length of the polyline through `points`. */
export function pathLength(points: readonly Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (from && to) length += Math.hypot(to.x - from.x, to.y - from.y);
  }
  return length;
}

/** The point `distance` along the polyline, clamped to its ends. */
export function pointAt(points: readonly Point[], distance: number): Point {
  const first = points[0];
  if (!first) throw new Error('a path needs at least one point');
  let rest = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to) continue;
    const segment = Math.hypot(to.x - from.x, to.y - from.y);
    if (rest <= segment) {
      const t = segment === 0 ? 0 : rest / segment;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    rest -= segment;
  }
  return points.at(-1) ?? first;
}
