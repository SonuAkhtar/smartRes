import './Card.css'

interface CardProps {
  children: React.ReactNode
  shadow?: boolean
  hoverable?: boolean
  bordered?: boolean
  padded?: boolean
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export default function Card({
  children,
  shadow = false,
  hoverable = false,
  bordered = false,
  padded = false,
  className = '',
  style,
  onClick,
}: CardProps) {
  const cls = [
    'card',
    shadow   ? 'card--shadow'   : '',
    hoverable? 'card--hoverable': '',
    bordered ? 'card--bordered' : '',
    padded   ? 'card--padded'   : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} style={style} onClick={onClick}>
      {children}
    </div>
  )
}
