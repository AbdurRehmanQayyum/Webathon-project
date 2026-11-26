import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toast-context'

interface Toast {
  id: number
  tone: 'success' | 'error'
  message: string
}

const DURATION = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback(
    (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)),
    [],
  )

  const show = useCallback(
    (tone: Toast['tone'], message: string) => {
      const id = ++nextId.current
      setToasts((current) => [...current.slice(-2), { id, tone, message }])
      window.setTimeout(() => dismiss(id), DURATION)
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message: string) => show('success', message),
      error: (error: unknown) =>
        show('error', error instanceof Error ? error.message : 'Something went wrong.'),
    }),
    [show],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-20 z-[70] grid justify-items-center gap-2 lg:right-5 lg:bottom-5 lg:left-auto lg:justify-items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-panel border border-line bg-surface p-3 text-sm shadow-pop"
            >
              {toast.tone === 'success' ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger-fg" aria-hidden="true" />
              )}
              <p className="wrap-text flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded text-muted hover:text-fg"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}
