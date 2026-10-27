import { cn } from '../../utils/format'

export function Gauge({ value = 0, label = 'Storage', tone = '#2563eb', size = 'md', caption }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={cn('gauge', `gauge-${size}`)}>
      <svg viewBox="0 0 200 112" aria-hidden="true">
        <path
          d="M 18 98 A 82 82 0 0 1 182 98"
          fill="none"
          stroke="var(--border)"
          strokeWidth="13"
          strokeLinecap="round"
          pathLength="100"
        />
        <path
          d="M 18 98 A 82 82 0 0 1 182 98"
          fill="none"
          stroke={tone}
          strokeWidth="13"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${safeValue} 100`}
          className="gauge-fill"
        />
        <text x="100" y="80" textAnchor="middle" className="gauge-value">
          {safeValue.toFixed(0)}
          <tspan className="gauge-unit">%</tspan>
        </text>
        <text x="100" y="100" textAnchor="middle" className="gauge-label">
          {label}
        </text>
      </svg>
      {caption && <p className="gauge-caption">{caption}</p>}
    </div>
  )
}
