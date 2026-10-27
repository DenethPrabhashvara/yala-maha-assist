import { cn } from '../../utils/format'

const SIZES = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
}

// Default "no profile picture" silhouette: a head and shoulders cut off by the circle
function Silhouette() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="9.5" r="4.25" />
      <path d="M3 24c0-5.2 4-8.6 9-8.6s9 3.4 9 8.6z" />
    </svg>
  )
}

export function Avatar({ name, size = 'md', className, status, image }) {
  return (
    <span className={cn('avatar', SIZES[size], className)} title={name} role="img" aria-label={name}>
      <span className="avatar-face">
        {image ? <img src={image} alt="" /> : <Silhouette />}
      </span>
      {status && <i className={cn('avatar-status', `avatar-status-${status}`)} />}
    </span>
  )
}
