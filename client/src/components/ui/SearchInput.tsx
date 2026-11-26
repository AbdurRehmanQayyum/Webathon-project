import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/cn'
import { Input } from './Input'

interface SearchInputProps {
  value: string
  onSearch: (value: string) => void
  label: string
  className?: string
}

// Debounced search field that stays in step with its source of truth
export function SearchInput({ value, onSearch, label, className }: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const [source, setSource] = useState(value)
  const debounced = useDebouncedValue(draft)
  const lastSent = useRef(value)

  if (source !== value) {
    setSource(value)
    setDraft(value)
  }

  useEffect(() => {
    if (debounced === lastSent.current) return
    lastSent.current = debounced
    onSearch(debounced)
  }, [debounced, onSearch])

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        value={draft}
        maxLength={100}
        onChange={(event) => setDraft(event.target.value)}
        className="px-9"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-control text-muted hover:text-fg"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
