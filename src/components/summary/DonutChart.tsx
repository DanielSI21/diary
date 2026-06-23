import type { TagSummary } from '../../types';

interface Props {
  data: TagSummary[];
  size?: number;
}

/** Donut chart en SVG puro (sin librerías). */
export default function DonutChart({ data, size = 180 }: Props) {
  const stroke = size * 0.16;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.reduce((acc, d) => acc + d.minutes, 0);

  let offset = 0;
  const segments =
    total > 0
      ? data
          .filter((d) => d.minutes > 0)
          .map((d) => {
            const fraction = d.minutes / total;
            const seg = {
              color: d.color,
              dash: fraction * circumference,
              offset,
            };
            offset += fraction * circumference;
            return seg;
          })
      : [];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* pista de fondo */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-slate-100 dark:text-slate-800"
        strokeWidth={stroke}
      />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  );
}
