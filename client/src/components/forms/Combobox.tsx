import { LoaderCircle } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'

export interface ComboboxOption {
  id: number
  label: string
  detail: string
}

interface ComboboxProps {
  label: string
  query: string
  onQueryChange: (query: string) => void
  options: ComboboxOption[]
  onSelect: (option: ComboboxOption) => void
  loading?: boolean
  disabled?: boolean
}

export function Combobox({
  label,
  query,
  onQueryChange,
  options,
  onSelect,
  loading,
  disabled,
}: ComboboxProps) {
  const listId = useId()
  const [isOpen, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const isExpanded = isOpen && query.trim().length > 0
  const active = Math.min(activeIndex, options.length - 1)

  const choose = (option: ComboboxOption) => {
    onSelect(option)
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isExpanded) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((Math.max(active, 0) + step + options.length) % Math.max(options.length, 1))
    } else if (event.key === 'Enter' && isExpanded) {
      event.preventDefault()
      const option = options[active]
      if (option) choose(option)
    }
  }

  return (
    <div>
      <div className="relative">
        <Input
          role="combobox"
          aria-label={label}
          aria-expanded={isExpanded}
          aria-controls={listId}
          aria-activedescendant={isExpanded && options[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={label}
          value={query}
          disabled={disabled}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setActiveIndex(0)
            setOpen(true)
          }}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && (
          <LoaderCircle className="absolute top-3 right-3 size-4 animate-spin text-muted" />
        )}
      </div>
      {isExpanded && (
        <ul
          id={listId}
          role="listbox"
          className={cn(popupStyles, 'mt-1 max-h-56 overflow-y-auto p-1')}
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
              className={cn('rounded-md px-2.5 py-2 text-sm', index === active && 'bg-surface-alt')}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="wrap-text block text-xs text-muted">{option.detail}</span>
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-2.5 py-2 text-sm text-muted">
              {loading ? 'Searching…' : 'No matches found'}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
