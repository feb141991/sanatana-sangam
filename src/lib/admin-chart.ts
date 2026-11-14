/** Geometry for the admin overview line chart (components/admin/AdminLineChart.tsx). Pure and testable. */

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

export interface LineGeometry {
  points: ChartPoint[];
  /** SVG path data: straight segments, first point to last. Empty for no data. */
  path: string;
  /** y of the four horizontal grid lines, top to bottom (the last one is the zero line). */
  gridLines: number[];
  /** The value at the top grid line (never below 1, so an all-zero series stays on the zero line). */
  max: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function buildLineGeometry(
  values: ReadonlyArray<number>,
  width: number,
  height: number,
  pad: ChartPadding,
): LineGeometry {
  const clean = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const max = Math.max(1, ...clean);
  const innerWidth = Math.max(0, width - pad.left - pad.right);
  const innerHeight = Math.max(0, height - pad.top - pad.bottom);
  const gridLines = [0, 1, 2, 3].map((i) => round(pad.top + (innerHeight * i) / 3));
  const count = clean.length;

  const points = clean.map((value, index) => ({
    x: round(count === 1 ? pad.left + innerWidth / 2 : pad.left + (innerWidth * index) / (count - 1)),
    y: round(pad.top + innerHeight - (value / max) * innerHeight),
    value,
  }));

  const path = points.map((p, index) => `${index === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  return { points, path, gridLines, max };
}

/** Which points get an axis label: the last one, then every `step` back from it. Ascending order. */
export function axisLabelIndexes(length: number, step = 2): number[] {
  if (!Number.isInteger(length) || length <= 0) return [];
  const stride = Math.max(1, Math.floor(step));
  const indexes: number[] = [];
  for (let i = length - 1; i >= 0; i -= stride) indexes.push(i);
  return indexes.reverse();
}
