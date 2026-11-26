import { createContext, useContext } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface ThemeState {
  preference: ThemePreference
  isDark: boolean
  setPreference: (preference: ThemePreference) => void
}

export const ThemeContext = createContext<ThemeState | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme requires ThemeProvider')
  return context
}
