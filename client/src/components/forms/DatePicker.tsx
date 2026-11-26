import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { inputStyles, popupStyles } from '@/components/ui/input-styles'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'
import {
  addDays,
  addMonths,
  buildMonthGrid,
  isSameDay,
  monthLabel,
  weekdayLabels,
} from '@/lib/dates'
import { formatDate } from '@/lib/format'
import type { FieldProps } from './FormField'

type DatePickerProps = FieldProps & {
  value: Date | null
  onChange: (date: Date) => void
}

const keySteps: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

export function DatePicker({ value, onChange, ...field }: DatePickerProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <Popover.Root open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger
        {...field}
        type="button"
        className={cn(inputStyles, 'flex h-10 items-center justify-between gap-2 text-left')}
      >
        <span className={cn(!value && 'text-muted')}>
          {value ? formatDate(value) : 'Pick a date'}
        </span>
        <CalendarDays className="size-4 text-muted" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={cn(popupStyles, 'w-72 p-3')}
          // Focus after the popover has joined the focus stack, so dialogs do not steal it back
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            const content = event.target as HTMLElement
            content.querySelector<HTMLElement>('[data-active-day]')?.focus()
          }}
        >
          <DayGrid
            value={value}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function DayGrid({ value, onSelect }: { value: Date | null; onSelect: (date: Date) => void }) {
  const [focused, setFocused] = useState(() => value ?? new Date())
  const focusedRef = useRef<HTMLButtonElement>(null)
  const followsKeyboard = useRef(false)

  // Keyboard moves carry focus with them; month buttons keep their own
  useEffect(() => {
    if (followsKeyboard.current) focusedRef.current?.focus()
    followsKeyboard.current = false
  }, [focused])

  const onKeyDown = (event: KeyboardEvent) => {
    const step = keySteps[event.key]
    if (step === undefined) return
    event.preventDefault()
    followsKeyboard.current = true
    setFocused((date) => addDays(date, step))
  }

  const changeMonth = (offset: number) => setFocused((date) => addMonths(date, offset))

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <IconButton
          size="icon-sm"
          label="Previous month"
          icon={<ChevronLeft className="size-4" />}
          onClick={() => changeMonth(-1)}
        />
        <span className="text-sm font-semibold" aria-live="polite">
          {monthLabel(focused)}
        </span>
        <IconButton
          size="icon-sm"
          label="Next month"
          icon={<ChevronRight className="size-4" />}
          onClick={() => changeMonth(1)}
        />
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted" aria-hidden="true">
        {weekdayLabels.map((day) => (
          <span key={day} className="py-1">
            {day.slice(0, 2)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5" onKeyDown={onKeyDown}>
        {buildMonthGrid(focused).map((day) => {
          const isFocused = isSameDay(day, focused)
          const isSelected = value !== null && isSameDay(day, value)
          return (
            <button
              key={day.toISOString()}
              ref={isFocused ? focusedRef : undefined}
              type="button"
              tabIndex={isFocused ? 0 : -1}
              data-active-day={isFocused || undefined}
              aria-pressed={isSelected}
              aria-label={formatDate(day)}
              aria-current={isSameDay(day, new Date()) ? 'date' : undefined}
              onClick={() => onSelect(day)}
              className={cn(
                'grid h-9 place-items-center rounded-md text-sm hover:bg-surface-alt',
                day.getMonth() !== focused.getMonth() && 'text-muted/60',
                isSameDay(day, new Date()) && 'font-semibold text-link ring-1 ring-primary/40',
                isSelected && 'bg-primary text-on-primary hover:bg-primary-hover',
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </>
  )
}
