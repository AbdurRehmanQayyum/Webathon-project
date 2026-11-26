import { createContext, useContext } from 'react'

export interface ToastApi {
  success: (message: string) => void
  error: (error: unknown) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast requires ToastProvider')
  return context
}
