import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme                // actual applied theme (for CSS data-theme)
  themePreference: ThemePreference  // user's saved preference
  setThemePreference: (t: ThemePreference) => void
  toggleTheme: () => void     // kept for backwards compat (toggles light↔dark)
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function deriveTheme(pref: ThemePreference): Theme {
  return pref === 'system' ? getSystemTheme() : pref
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'system',
  setThemePreference: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('theme_pref') as ThemePreference | null
    // Legacy migration: old key was 'theme' with values 'light'|'dark'
    if (stored && ['light', 'dark', 'system'].includes(stored)) return stored
    const legacy = localStorage.getItem('theme') as Theme | null
    if (legacy === 'light' || legacy === 'dark') return legacy
    return 'system'
  })

  const [theme, setTheme] = useState<Theme>(() => deriveTheme(pref))

  useEffect(() => {
    if (pref === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => setTheme(mq.matches ? 'dark' : 'light')
      handler()
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      setTheme(pref)
    }
  }, [pref])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme_pref', pref)
    // keep legacy key in sync for any code that reads it directly
    localStorage.setItem('theme', theme)
  }, [theme, pref])

  const setThemePreference = (t: ThemePreference) => setPref(t)
  const toggleTheme = () => setPref(p => p === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, themePreference: pref, setThemePreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
