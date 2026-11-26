import { useLayoutEffect, useRef, type ReactNode } from 'react'

const frames: Keyframe[] = [
  { opacity: 0, translate: '0 10px' },
  { opacity: 1, translate: '0 0' },
]

interface RevealProps {
  children: ReactNode
  // The animation replays when this changes; the content is never remounted
  when?: string | number
  className?: string
  disabled?: boolean
}

export function Reveal({ children, when, className, disabled }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (disabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = ref.current?.animate(frames, {
      duration: 320,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    })
    return () => animation?.cancel()
  }, [when, disabled])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
