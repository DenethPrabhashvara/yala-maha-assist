import { cn } from '../../utils/format'

export function Sparkline({
  data = [],
  width = 120,
  height = 38,
  color = '#2563eb',
  fill = true,
  strokeWidth = 2,
  className,
  showDot = true,
}) {
  if (!data.length) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padding = 3
  const step = (width - padding * 2) / Math.max(1, data.length - 1)
  const points = data.map((value, index) => {
    const x = padding + index * step
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return [x, y]
  })

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${height} L ${points[0][0].toFixed(2)} ${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('sparkline', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {fill && <path d={areaPath} fill={color} fillOpacity="0.12" />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && <circle cx={lastX} cy={lastY} r="2.4" fill={color} />}
    </svg>
  )
}

export function TinyBars({ data = [], color = '#2563eb', height = 34, className }) {
  if (!data.length) return null
  const max = Math.max(...data) || 1
  return (
    <div className={cn('tiny-bars', className)} style={{ height }} aria-hidden="true">
      {data.map((value, index) => (
        <span
          key={`${index}-${value}`}
          style={{
            height: `${Math.max(12, (value / max) * 100)}%`,
            background: color,
            opacity: 0.35 + (index / data.length) * 0.65,
          }}
        />
      ))}
    </div>
  )
}
