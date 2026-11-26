import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useInstall } from './install'

// Appears only while the browser offers installation
export function InstallButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const { canInstall, install } = useInstall()
  if (!canInstall) return null

  return iconOnly ? (
    <IconButton
      label="Install app"
      icon={<Download className="size-5" />}
      onClick={() => void install()}
    />
  ) : (
    <Button icon={<Download className="size-4" />} onClick={() => void install()}>
      Install app
    </Button>
  )
}
