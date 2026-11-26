import { RefreshCw, WifiOff } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-center text-sm font-medium text-warning"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You are offline. Saving is paused until you reconnect.
    </div>
  )
}

// A new service worker waits until the user chooses to reload
export function UpdatePrompt() {
  const {
    needRefresh: [needsRefresh, setNeedsRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needsRefresh) return null

  return (
    <div
      role="alertdialog"
      aria-label="Update available"
      className="fixed inset-x-3 bottom-20 z-[80] mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-3 shadow-dialog animate-sheet-up lg:bottom-5"
    >
      <p className="text-sm font-medium">A new version of Campus Connect is ready.</p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setNeedsRefresh(false)}>
          Later
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={<RefreshCw className="size-4" />}
          onClick={() => void updateServiceWorker(true)}
        >
          Reload
        </Button>
      </div>
    </div>
  )
}
