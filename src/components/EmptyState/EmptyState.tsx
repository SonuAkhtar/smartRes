import './EmptyState.css'

interface CtaProps {
  label: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  className?: string
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  cta?: CtaProps
  secondaryCta?: CtaProps
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  cta,
  secondaryCta,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__desc">{description}</p>}
      {(cta || secondaryCta) && (
        <div className="empty-state__actions">
          {cta && (
            <button
              className={cta.className}
              onClick={cta.onClick}
            >
              {cta.label}
            </button>
          )}
          {secondaryCta && (
            <button
              className={secondaryCta.className}
              onClick={secondaryCta.onClick}
            >
              {secondaryCta.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
