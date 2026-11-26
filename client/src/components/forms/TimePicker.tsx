import { Clock } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputStyles, popupStyles } from '@/components/ui/input-styles'
import { cn } from '@/lib/cn'
import { combineDateAndTime } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import { ClockFace } from './ClockFace'
import type { FieldProps } from './FormField'

type TimePickerProps = FieldProps & {
  value: string
  onChange: (time: string) => void
}

type Mode = 'hour' | 'minute'

const pad = (value: number) => String(value).padStart(2, '0')

export function TimePicker({ value, onChange, ...field }: TimePickerProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <Popover.Root open={isOpen} onOpenChange={setOpen}>
      <Popover.Trigger
        {...field}
        type="button"
        className={cn(inputStyles, 'flex h-10 items-center justify-between gap-2 text-left')}
      >
        <span className={cn(!value && 'text-muted')}>
          {value ? formatTime(combineDateAndTime(new Date(), value)) : 'Pick a time'}
        </span>
        <Clock className="size-4 text-muted" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className={cn(popupStyles, 'max-h-(--radix-popover-content-available-height) w-68 overflow-y-auto p-3')}
          // Focus after the popover has joined the focus stack, so dialogs do not steal it back
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            const content = event.target as HTMLElement
            content.querySelector<HTMLElement>('[role="slider"]')?.focus()
          }}
        >
          <ClockPanel value={value || '09:00'} onChange={onChange} onDone={() => setOpen(false)} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ClockPanel({
  value,
  onChange,
  onDone,
}: {
  value: string
  onChange: (time: string) => void
  onDone: () => void
}) {
  const [mode, setMode] = useState<Mode>('hour')
  const [hours = 9, minutes = 0] = value.split(':').map(Number)
  const isAfternoon = hours >= 12
  const hourOnDial = hours % 12 || 12

  const set = (nextHours: number, nextMinutes: number) =>
    onChange(`${pad(nextHours)}:${pad(nextMinutes)}`)
  const to24 = (dial: number, afternoon: boolean) => (dial % 12) + (afternoon ? 12 : 0)

  const digit = (target: Mode, text: string, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={mode === target}
      onClick={() => setMode(target)}
      className={cn(
        'rounded-control px-2.5 py-1 text-3xl font-semibold tabular-nums',
        mode === target ? 'bg-selected text-selected-fg' : 'text-muted hover:bg-surface-alt',
      )}
    >
      {text}
    </button>
  )

  return (
    <div className="grid justify-items-center gap-3">
      <div className="flex items-center gap-1">
        {digit('hour', pad(hourOnDial), 'Choose hour')}
        <span className="text-3xl font-semibold" aria-hidden="true">
          :
        </span>
        {digit('minute', pad(minutes), 'Choose minute')}
        <div className="ml-2 grid gap-0.5">
          {[false, true].map((afternoon) => (
            <button
              key={String(afternoon)}
              type="button"
              aria-pressed={isAfternoon === afternoon}
              onClick={() => set(to24(hourOnDial, afternoon), minutes)}
              className={cn(
                'rounded px-2 py-0.5 text-xs font-semibold',
                isAfternoon === afternoon
                  ? 'bg-primary text-on-primary'
                  : 'text-muted hover:bg-surface-alt',
              )}
            >
              {afternoon ? 'PM' : 'AM'}
            </button>
          ))}
        </div>
      </div>
      <ClockFace
        key={mode}
        mode={mode}
        value={mode === 'hour' ? hourOnDial : minutes}
        onChange={(next) =>
          mode === 'hour' ? set(to24(next, isAfternoon), minutes) : set(hours, next)
        }
        onCommit={() => (mode === 'hour' ? setMode('minute') : onDone())}
      />
      <div className="flex w-full justify-end">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            set(hours, minutes)
            onDone()
          }}
        >
          Done
        </Button>
      </div>
    </div>
  )
}
