import type { KeyboardEvent, PointerEvent } from 'react'
import { cn } from '@/lib/cn'

const CENTRE = 100
const RADIUS = 76

// Clockwise from twelve o'clock
function pointAt(fraction: number) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return { x: CENTRE + RADIUS * Math.cos(angle), y: CENTRE + RADIUS * Math.sin(angle) }
}

interface ClockFaceProps {
  mode: 'hour' | 'minute'
  value: number
  onChange: (value: number) => void
  // Called when a pointer choice is finished or Enter is pressed
  onCommit: () => void
}

export function ClockFace({ mode, value, onChange, onCommit }: ClockFaceProps) {
  const steps = mode === 'hour' ? 12 : 60
  const min = mode === 'hour' ? 1 : 0
  const max = mode === 'hour' ? 12 : 59
  const labels = Array.from({ length: 12 }, (_, index) =>
    mode === 'hour' ? index || 12 : index * 5,
  )
  const hand = pointAt((value % steps) / steps)

  const fromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left - box.width / 2
    const y = event.clientY - box.top - box.height / 2
    const turn = (Math.atan2(y, x) / (2 * Math.PI) + 1.25) % 1
    const next = Math.round(turn * steps) % steps
    onChange(mode === 'hour' ? next || 12 : next)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const step =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? -1
          : 0
    if (step !== 0) {
      event.preventDefault()
      onChange(((value - min + step + steps) % steps) + min)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onCommit()
    }
  }

  return (
    <svg
      viewBox="0 0 200 200"
      role="slider"
      tabIndex={0}
      aria-label={mode === 'hour' ? 'Hour' : 'Minute'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        fromPointer(event)
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event)
      }}
      onPointerUp={onCommit}
      className="size-56 cursor-pointer touch-none rounded-full select-none focus-visible:outline-primary"
    >
      <circle cx={CENTRE} cy={CENTRE} r="98" className="fill-surface-alt" />
      <line
        x1={CENTRE}
        y1={CENTRE}
        x2={hand.x}
        y2={hand.y}
        strokeWidth="2"
        className="stroke-primary"
      />
      <circle cx={CENTRE} cy={CENTRE} r="4" className="fill-primary" />
      <circle cx={hand.x} cy={hand.y} r="16" className="fill-primary" />
      {labels.map((label) => {
        const point = pointAt((label % steps) / steps)
        return (
          <text
            key={label}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            aria-hidden="true"
            className={cn(
              'text-sm font-medium tabular-nums',
              label === value ? 'fill-on-primary' : 'fill-fg',
            )}
          >
            {mode === 'minute' ? String(label).padStart(2, '0') : label}
          </text>
        )
      })}
      {/* Marks a minute that falls between the printed numbers */}
      {mode === 'minute' && value % 5 !== 0 && (
        <circle cx={hand.x} cy={hand.y} r="3" className="fill-on-primary" />
      )}
    </svg>
  )
}
