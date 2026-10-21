import type { CSSProperties } from "react";

type Props = { axes: string[]; values: number[]; summary: string };

const CX = 260;
const CY = 200;
const R = 130;

function point(i: number, fraction: number, count: number): [number, number] {
  const angle = ((-90 + (360 / count) * i) * Math.PI) / 180;
  return [CX + R * fraction * Math.cos(angle), CY + R * fraction * Math.sin(angle)];
}

const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/** Splits a long axis name over two lines so it fits beside the chart. */
function lines(label: string): string[] {
  if (label.length <= 14) return [label];
  const words = label.split(" ");
  let best = 1;
  let gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < gap) {
      gap = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/**
 * A six-axis radar drawn as plain SVG. It is a picture of the table next to it, so it is one
 * labelled image and the table (aria-describedby) carries the real data.
 */
export function SkillsRadar({ axes, values, summary }: Props) {
  const n = axes.length;
  const ring = (f: number) => axes.map((_, i) => fmt(point(i, f, n))).join(" ");
  const shape =
    "M" + axes.map((_, i) => fmt(point(i, Math.max(values[i], 2) / 100, n))).join(" L") + " Z";

  return (
    <div className="radar" role="img" aria-label={`Skills radar. ${summary}`} aria-describedby="coverage-table">
      <svg viewBox="-20 0 560 400" focusable="false" aria-hidden="true">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} className="ring" points={ring(f)} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = point(i, 1, n);
          return <line key={i} className="spoke" x1={CX} y1={CY} x2={x} y2={y} />;
        })}
        <path className="shape" d={shape} style={{ d: `path("${shape}")` } as CSSProperties} />
        {axes.map((_, i) => {
          const [x, y] = point(i, Math.max(values[i], 2) / 100, n);
          return <circle key={i} className="dot" cx={x} cy={y} r="4" />;
        })}
        {axes.map((name, i) => {
          const [x, y] = point(i, 1.14, n);
          const anchor = Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end";
          const ls = lines(name);
          const top = i === 0 ? -6 - (ls.length - 1) * 21 : i === Math.floor(n / 2) ? 14 : 5 - ((ls.length - 1) * 21) / 2;
          return (
            <text key={name} x={x} y={y + top} textAnchor={anchor}>
              {ls.map((l, k) => (
                <tspan key={l} x={x} dy={k === 0 ? 0 : 21}>
                  {l}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
