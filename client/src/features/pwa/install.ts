import { useSyncExternalStore } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

// Captured at startup because the browser fires it before any screen asks
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredPrompt = event as InstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useInstall() {
  const canInstall = useSyncExternalStore(subscribe, () => deferredPrompt !== null)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

  const install = async () => {
    const prompt = deferredPrompt
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    deferredPrompt = null
    notify()
  }

  return { canInstall, isInstalled, isIos, install }
}
