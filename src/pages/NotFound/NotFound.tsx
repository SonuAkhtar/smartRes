import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './NotFound.css'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <motion.div
        className="not-found__inner"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="not-found__code" aria-hidden="true">404</div>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        <div className="not-found__actions">
          <button className="not-found__btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
          <button className="not-found__btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
