import { cn } from '../../utils/format'

export function Badge({ children, tone = 'neutral', variant = 'soft', dot = false, icon: Icon, className }) {
  return (
    <span className={cn('badge', `badge-${tone}`, `badge-${variant}`, className)}>
      {dot && <span className="badge-dot" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

export function StatusBadge({ meta, dot = true, children }) {
  if (!meta) return null
  return (
    <Badge tone={meta.tone} dot={dot}>
      {children || meta.label}
    </Badge>
  )
}

export function CountBadge({ value, tone = 'neutral' }) {
  return (
    <span className={cn('count-badge', `count-badge-${tone}`)}>{value}</span>
  )
}
