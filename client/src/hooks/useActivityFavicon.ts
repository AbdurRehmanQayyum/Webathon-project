import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect } from 'react'

const IDLE_ICON = '/favicon.svg'
const SHOW_AFTER_MS = 350
const FRAME_MS = 90
const FRAMES = 16

function frame(step: number) {
  const angle = (360 / FRAMES) * step
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke-width="9" stroke-linecap="round">
<path stroke="#8E1EA2" transform="rotate(${angle} 32 32)" d="M49.7 13.7A25.5 25.5 0 1 0 49.7 50.3"/>
<path stroke="#C654C3" transform="rotate(${-angle} 32 32)" d="M40.5 23.5A12 12 0 1 0 40.5 40.5"/>
<circle fill="#ED96D7" cx="32" cy="32" r="${step % 8 < 4 ? 5 : 3.5}"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// The browser tab icon animates while slower requests are in flight
export function useActivityFavicon() {
  const isBusy = useIsFetching() + useIsMutating() > 0

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isBusy || !icon || prefersStill) return

    let step = 0
    let ticker: number | undefined
    const delay = window.setTimeout(() => {
      ticker = window.setInterval(() => {
        icon.href = frame((step = (step + 1) % FRAMES))
      }, FRAME_MS)
    }, SHOW_AFTER_MS)

    return () => {
      window.clearTimeout(delay)
      window.clearInterval(ticker)
      icon.href = IDLE_ICON
    }
  }, [isBusy])
}
