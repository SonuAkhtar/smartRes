import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import './CommandPalette.css'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const NavIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="cp_cmd-icon">
    <path d={d} />
  </svg>
)

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { toggleTheme, theme } = useTheme()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const go = (path: string) => { navigate(path); onClose() }

  const commands: Command[] = [
    {
      id: 'dashboard', label: 'Go to Dashboard',
      description: 'View your tailored resume',
      icon: <NavIcon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
      action: () => go('/dashboard'),
      keywords: ['home', 'resume', 'cv'],
    },
    {
      id: 'job-matcher', label: 'Go to Job Matcher',
      description: 'Tailor resume to a job posting',
      icon: <NavIcon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
      action: () => go('/job-matcher'),
      keywords: ['analyze', 'tailor', 'match'],
    },
    {
      id: 'applications', label: 'Add Application',
      description: 'Track a new job application',
      icon: <NavIcon d="M12 5v14M5 12h14" />,
      action: () => go('/applications'),
      keywords: ['track', 'apply', 'job'],
    },
    {
      id: 'interview', label: 'Generate Interview Prep',
      description: 'Get AI interview questions',
      icon: <NavIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
      action: () => go('/interview-prep'),
      keywords: ['questions', 'practice', 'interview'],
    },
    {
      id: 'profile', label: 'Edit Profile',
      description: 'Update your profile information',
      icon: <NavIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />,
      action: () => go('/profile'),
      keywords: ['edit', 'update', 'info'],
    },
    {
      id: 'job-history', label: 'View Job History',
      description: 'See past job analyses',
      icon: <NavIcon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
      action: () => go('/job-history'),
      keywords: ['history', 'past', 'analyses'],
    },
    {
      id: 'cover-letter', label: 'Cover Letter Generator',
      description: 'Write a tailored cover letter',
      icon: <NavIcon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
      action: () => go('/cover-letter'),
      keywords: ['letter', 'write', 'generate'],
    },
    {
      id: 'templates', label: 'Resume Templates',
      description: 'Choose a resume design',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cp_cmd-icon">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      action: () => go('/templates'),
      keywords: ['design', 'theme', 'layout'],
    },
    {
      id: 'upgrade', label: 'Upgrade to Pro',
      description: 'Unlock unlimited AI features',
      icon: <NavIcon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
      action: () => go('/upgrade'),
      keywords: ['pro', 'plan', 'pricing', 'subscription'],
    },
    {
      id: 'settings', label: 'Settings',
      description: 'Manage your preferences',
      icon: <NavIcon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
      action: () => go('/settings'),
      keywords: ['preferences', 'account', 'theme'],
    },
    {
      id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle colour theme',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="cp_cmd-icon">
          {theme === 'dark'
            ? <circle cx="12" cy="12" r="5" />
            : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          }
        </svg>
      ),
      action: () => { toggleTheme(); onClose() },
      keywords: ['dark', 'light', 'colour', 'color'],
    },
    {
      id: 'signout', label: 'Sign Out',
      description: 'Sign out of your account',
      icon: <NavIcon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
      action: () => { signOut(); onClose() },
      keywords: ['logout', 'exit'],
    },
  ]

  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase()
        return (
          c.label.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q)) ||
          c.keywords?.some(k => k.includes(q))
        )
      })
    : commands

  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); filtered[activeIndex]?.action() }
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, filtered, activeIndex, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="cp_overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="cp_panel"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            <div className="cp_search-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="cp_search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                className="cp_search-input"
                type="text"
                placeholder="Search commands…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search commands"
                autoComplete="off"
              />
              <kbd className="cp_esc-hint">ESC</kbd>
            </div>

            <div className="cp_list" role="listbox">
              {filtered.length === 0 ? (
                <div className="cp_empty">No commands found</div>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`cp_cmd ${i === activeIndex ? 'cp_cmd-active' : ''}`}
                    onClick={cmd.action}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="cp_cmd-icon-wrap">{cmd.icon}</span>
                    <span className="cp_cmd-content">
                      <span className="cp_cmd-label">{cmd.label}</span>
                      {cmd.description && <span className="cp_cmd-desc">{cmd.description}</span>}
                    </span>
                    <kbd className="cp_cmd-enter">↵</kbd>
                  </button>
                ))
              )}
            </div>

            <div className="cp_footer">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>ESC</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
