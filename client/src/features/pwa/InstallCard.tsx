import { CircleCheck, Download, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useInstall } from './install'

export function InstallCard() {
  const { canInstall, isInstalled, isIos, install } = useInstall()

  if (isInstalled) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CircleCheck className="size-4 text-success" aria-hidden="true" />
        Campus Connect is installed on this device.
      </p>
    )
  }

  if (canInstall) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Open Campus Connect from your home screen or desktop.</p>
        <Button
          variant="primary"
          icon={<Download className="size-4" />}
          onClick={() => void install()}
        >
          Install app
        </Button>
      </div>
    )
  }

  if (isIos) {
    return (
      <ol className="grid gap-2 text-sm">
        <li className="flex items-center gap-2">
          <Share className="size-4 text-link" aria-hidden="true" />
          In Safari, tap Share.
        </li>
        <li className="flex items-center gap-2">
          <SquarePlus className="size-4 text-link" aria-hidden="true" />
          Choose “Add to Home Screen”.
        </li>
      </ol>
    )
  }

  return (
    <p className="text-sm text-muted">
      Use your browser menu and choose “Install app” or “Add to Home Screen”. The option appears in
      supported browsers over HTTPS or on localhost.
    </p>
  )
}
