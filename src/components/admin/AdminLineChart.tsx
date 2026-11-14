import { axisLabelIndexes, buildLineGeometry } from "@/lib/admin-chart";

export interface AdminLineChartDatum {
  label: string;
  value: number;
}

interface Props {
  data: ReadonlyArray<AdminLineChartDatum>;
  /** Read by assistive technology in place of the picture: say what the line is and its range. */
  ariaLabel: string;
  className?: string;
}

// The line is drawn in a fixed box that stretches to the panel. Padding keeps the end dot inside it.
const WIDTH = 600;
const HEIGHT = 168;
const PAD = { top: 14, right: 14, bottom: 6, left: 14 };

/**
 * A single orange line over faint grid lines, with an end dot and month labels: the chart of the admin
 * overview. The stroke is drawn with a non-scaling stroke so it stays crisp when the box stretches;
 * the dot and the labels are HTML placed by percentage so they never distort. Pure display: it draws
 * whatever it is given and never invents a point (see lib/admin-chart.ts).
 */
export function AdminLineChart({ data, ariaLabel, className = "" }: Props) {
  const { points, path, gridLines } = buildLineGeometry(
    data.map((d) => d.value),
    WIDTH,
    HEIGHT,
    PAD,
  );
  const last = points[points.length - 1];
  const labelled = axisLabelIndexes(data.length, 2);

  return (
    <div className={className}>
      <div className="relative h-40 w-full" role="img" aria-label={ariaLabel}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
          focusable="false"
        >
          {gridLines.map((y, i) => (
            <line
              key={i}
              x1={0}
              x2={WIDTH}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth={1}
              strokeDasharray={i === gridLines.length - 1 ? undefined : "2 6"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {path ? (
            <path
              d={path}
              fill="none"
              stroke="var(--g-accent, #ee8444)"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
        {last ? (
          <span
            aria-hidden="true"
            className="absolute h-2.5 w-2.5 rounded-full border border-white/70 bg-[var(--g-accent,#ee8444)] shadow-[0_0_0_4px_rgba(238,132,68,0.22)]"
            style={{
              left: `${(last.x / WIDTH) * 100}%`,
              top: `${(last.y / HEIGHT) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ) : null}
      </div>
      <div className="relative mt-2 h-4" aria-hidden="true">
        {labelled.map((index) => (
          <span
            key={`${data[index].label}-${index}`}
            className="glass-mono absolute -translate-x-1/2 text-[10px] text-[var(--text-secondary)]"
            style={{ left: `${(points[index].x / WIDTH) * 100}%` }}
          >
            {data[index].label}
          </span>
        ))}
      </div>
    </div>
  );
}
