import './Badge.css'

export type BadgeVariant = 'primary' | 'mono' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'mono', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {children}
    </span>
  )
}
