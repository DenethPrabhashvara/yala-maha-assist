import { css } from "../../lib/css";

export default function Ring({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = 34;
  const length = 2 * Math.PI * r;
  const color = percent < 10 ? "#ef4444" : percent < 25 ? "#f59e0b" : percent < 50 ? "#38bdf8" : "#22c55e";
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
      <circle
        className="ring-arc"
        style={css({ "--ring-length": `${(Math.max(percent, 1.5) / 100) * length}px` })}
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(Math.max(percent, 1.5) / 100) * length} ${length}`}
      />
    </svg>
  );
}
