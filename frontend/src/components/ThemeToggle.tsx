import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { currentTheme, saveTheme, type Theme } from '../lib/theme'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>(() => currentTheme())

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<Theme>
      setTheme(customEvent.detail)
    }
    window.addEventListener('gridstone-theme-change', onThemeChange)
    return () => window.removeEventListener('gridstone-theme-change', onThemeChange)
  }, [])

  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${nextTheme} mode`

  return (
    <button
      className={`theme-toggle${compact ? ' theme-toggle--compact' : ''}`}
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        saveTheme(nextTheme)
        setTheme(nextTheme)
      }}
    >
      {theme === 'dark' ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
      {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  )
}
