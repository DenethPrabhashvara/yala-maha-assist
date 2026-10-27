import { cn } from '../../utils/format'

export function Card({ className, children, interactive = false, ...props }) {
  return (
    <div className={cn('card', interactive && 'card-interactive', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  badge,
  className,
  children,
}) {
  return (
    <div className={cn('card-header', className)}>
      <div className="card-heading">
        {Icon && (
          <span className="card-heading-icon">
            <Icon size={17} />
          </span>
        )}
        <div>
          <div className="card-title-row">
            <h3 className="card-title">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-action">{action}</div>}
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('card-body', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('card-footer', className)} {...props}>
      {children}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
