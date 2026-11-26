import { Children, useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

const GAP = 12

// Packs cards of different heights without gaps, keeping their reading order in the page.
// Each item spans as many one-pixel rows as its content is tall.
export function Masonry({ children, columns }: { children: ReactNode; columns: string }) {
  return (
    <div
      className={cn(
        'grid grid-flow-row-dense auto-rows-[1px] grid-cols-1 gap-x-3',
        // A lone card keeps the full width instead of leaving half the row empty
        Children.count(children) > 1 && columns,
      )}
    >
      {Children.map(children, (child) => (
        <MasonryItem>{child}</MasonryItem>
      ))}
    </div>
  )
}

function MasonryItem({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // Measured before painting, then again whenever images or text change the height
  useLayoutEffect(() => {
    const content = ref.current
    const item = content?.parentElement
    if (!content || !item) return

    const fit = () => {
      item.style.gridRowEnd = `span ${content.offsetHeight + GAP}`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-w-0">
      <div ref={ref}>{children}</div>
    </div>
  )
}
