import { cn } from '../../utils/format'

const TONE_CLASS = {
  primary: 'progress-primary',
  success: 'progress-success',
  warning: 'progress-warning',
  critical: 'progress-critical',
  info: 'progress-info',
  neutral: 'progress-neutral',
}

export function Progress({
  value = 0,
  tone = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className,
}) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={cn('progress-wrap', className)}>
      <div className={cn('progress-track', `progress-${size}`, TONE_CLASS[tone])}>
        <span className="progress-value" style={{ width: `${safeValue}%` }} />
      </div>
      {showLabel && (
        <span className="progress-label">{label ?? `${safeValue.toFixed(0)}%`}</span>
      )}
    </div>
  )
}

export function ProgressRing({ value = 0, size = 44, stroke = 4, tone = '#2563eb' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <svg width={size} height={size} className="progress-ring" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={tone}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(safeValue / 100) * circumference} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
