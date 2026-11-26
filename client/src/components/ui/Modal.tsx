import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { buttonStyles } from './button-styles'

const widths = {
  md: 'sm:max-w-lg',
  wide: 'sm:max-w-2xl',
  full: 'sm:max-w-5xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: keyof typeof widths
}

// Keeps the last content while the dialog animates away, even if its data is already cleared
const Held = memo(
  function Held({ children }: { open: boolean; children: ReactNode }) {
    return children
  },
  (_previous, next) => !next.open,
)

// Bottom sheet on phones, centred dialog on larger screens
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay animate-fade-in data-[state=closed]:animate-fade-out" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'safe-bottom fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-dialog animate-sheet-up data-[state=closed]:animate-sheet-down',
            'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-1/2 sm:rounded-panel sm:animate-pop-in sm:data-[state=closed]:animate-pop-out',
            widths[size],
          )}
        >
          <Held open={open}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4">
              <div className="min-w-0">
                <Dialog.Title className="wrap-text text-base font-semibold">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="mt-0.5 text-sm text-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close className={buttonStyles('ghost', 'icon-sm')} aria-label="Close dialog">
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <div className="p-5">{children}</div>
          </Held>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
  )
}
