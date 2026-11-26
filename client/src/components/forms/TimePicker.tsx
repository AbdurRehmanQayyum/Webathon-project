import { Select } from '@/components/ui/Select'
import { combineDateAndTime, toTimeValue } from '@/lib/dates'
import { formatTime } from '@/lib/format'
import type { FieldProps } from './FormField'

const quarterHours = Array.from({ length: 96 }, (_, index) =>
  toTimeValue(new Date(2000, 0, 1, 0, index * 15)),
)

type TimePickerProps = FieldProps & {
  value: string
  onChange: (time: string) => void
}

export function TimePicker({ value, onChange, ...field }: TimePickerProps) {
  const times =
    value && !quarterHours.includes(value) ? [...quarterHours, value].sort() : quarterHours
  const options = times.map((time) => ({
    value: time,
    label: formatTime(combineDateAndTime(new Date(), time)),
  }))

  return (
    <Select
      {...field}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Pick a time"
    />
  )
}
