import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'

export interface SuggestionItem {
  id: string
  title: string
  detail: string
}

export interface SuggestionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface SuggestionListProps {
  items: SuggestionItem[]
  command: (item: { id: string; label: string }) => void
  ref?: Ref<SuggestionListHandle>
}

export function SuggestionList({ items, command, ref }: SuggestionListProps) {
  const [index, setIndex] = useState(0)
  const [source, setSource] = useState(items)

  if (source !== items) {
    setSource(items)
    setIndex(0)
  }

  const choose = (item: SuggestionItem | undefined) => {
    if (item) command({ id: item.id, label: item.id })
  }

  // Keeps the highlighted entry visible while moving with the arrow keys
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const list = listRef.current
    const item = list?.children[index]
    if (!list || !(item instanceof HTMLElement)) return
    // Only the list scrolls; scrollIntoView would move the page as well
    const overflow = item.offsetTop + item.offsetHeight - list.clientHeight
    list.scrollTop = Math.min(item.offsetTop, Math.max(list.scrollTop, overflow))
  }, [index])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (items.length === 0) return false
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const step = event.key === 'ArrowDown' ? 1 : -1
        setIndex((current) => (current + step + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        choose(items[index])
        return true
      }
      return false
    },
  }))

  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-label="Suggestions"
      className={cn(
        popupStyles,
        'relative max-h-[min(18rem,var(--suggestion-height,18rem))] w-66 overflow-y-auto overscroll-contain p-1',
      )}
    >
      {items.map((item, position) => (
        <li
          key={item.id}
          role="option"
          aria-selected={position === index}
          onMouseDown={(event) => {
            event.preventDefault()
            choose(item)
          }}
          onMouseEnter={() => setIndex(position)}
          className={cn('rounded-md px-2.5 py-1.5', position === index && 'bg-surface-alt')}
        >
          <span className="block truncate text-sm font-medium">{item.title}</span>
          <span className="block truncate text-xs text-muted">{item.detail}</span>
        </li>
      ))}
      {items.length === 0 && <li className="px-2.5 py-1.5 text-sm text-muted">No matches</li>}
    </ul>
  )
}
