import { cn } from '../../utils/format'

export function PageHeader({ eyebrow, title, description, actions, badge, className }) {
  return (
    <div className={cn('page-header', className)}>
      <div className="page-header-copy">
        <div className="page-eyebrow">
          {eyebrow && <span>{eyebrow}</span>}
          {badge}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}
