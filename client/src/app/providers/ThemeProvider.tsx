import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { ThemeContext, type ThemePreference } from './theme-context'

// Shared with public/theme-init.js
const STORAGE_KEY = 'campus-connect-theme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function subscribe(onChange: () => void) {
  darkQuery.addEventListener('change', onChange)
  return () => darkQuery.removeEventListener('change', onChange)
}

// The whole screen fades between themes where the browser supports it
function crossFade(change: () => void) {
  if (typeof document.startViewTransition !== 'function') return change()

  const root = document.documentElement
  root.dataset.theming = ''
  void document.startViewTransition(change).finished.finally(() => delete root.dataset.theming)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setStored] = useState(readPreference)
  const systemDark = useSyncExternalStore(subscribe, () => darkQuery.matches)
  const isDark = preference === 'dark' || (preference === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#141018' : '#8E1EA2')
  }, [isDark])

  const setPreference = useCallback((next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next)
    const dark = next === 'dark' || (next === 'system' && darkQuery.matches)
    crossFade(() => {
      document.documentElement.classList.toggle('dark', dark)
      setStored(next)
    })
  }, [])

  const value = useMemo(
    () => ({ preference, isDark, setPreference }),
    [preference, isDark, setPreference],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
