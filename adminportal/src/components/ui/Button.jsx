import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/format'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn('btn', `btn-${variant}`, `btn-${size}`, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 17} />
      )}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={15} />}
    </button>
  )
}

export function IconButton({ children, label, className, variant = 'ghost', size = 'md', ...props }) {
  return (
    <button
      type="button"
      className={cn('icon-btn', `icon-btn-${variant}`, `icon-btn-${size}`, className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
}
