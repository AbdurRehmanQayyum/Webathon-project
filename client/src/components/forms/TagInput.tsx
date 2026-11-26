import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { api } from '@/services/api-client'
import type { FieldProps } from './FormField'

const MAX_TAGS = 8
const pattern = /^[a-z][a-z0-9_-]{1,29}$/

type TagInputProps = FieldProps & {
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ value, onChange, ...field }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const term = useDebouncedValue(draft.replace('#', '').trim().toLowerCase())
  const suggestions = useQuery({
    queryKey: ['tags', term],
    queryFn: () => api.get<{ name: string }[]>('/api/tags', { search: term }),
  })
  const options = (suggestions.data ?? [])
    .map((tag) => tag.name)
    .filter((name) => !value.includes(name))
    .slice(0, 6)
  const isFull = value.length >= MAX_TAGS

  const add = (raw: string) => {
    const tag = raw.replace('#', '').trim().toLowerCase()
    if (pattern.test(tag) && !value.includes(tag) && !isFull) onChange([...value, tag])
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(event.key) && draft.trim()) {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-control border border-line-strong bg-surface px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-focus/30">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-selected py-0.5 pr-1 pl-2 text-sm text-selected-fg"
          >
            #{tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              className="rounded p-0.5 hover:bg-surface"
              onClick={() => onChange(value.filter((item) => item !== tag))}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          {...field}
          value={draft}
          disabled={isFull}
          maxLength={31}
          placeholder={isFull ? `Up to ${MAX_TAGS} tags` : 'Add a tag and press Enter'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          className="min-w-40 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted sm:text-sm"
        />
      </div>
      {options.length > 0 && !isFull && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          Suggestions:
          {options.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(name)}
              className="rounded border border-line px-1.5 py-0.5 hover:border-primary hover:text-link"
            >
              #{name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
