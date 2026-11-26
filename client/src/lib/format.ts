const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export const formatDate = (value: string | Date) => dateFormat.format(new Date(value))
export const formatTime = (value: string | Date) => timeFormat.format(new Date(value))
export const formatDateTime = (value: string | Date) => `${formatDate(value)}, ${formatTime(value)}`

export function formatTimeRange(start: string, end: string) {
  const sameDay = new Date(start).toDateString() === new Date(end).toDateString()
  return sameDay
    ? `${formatTime(start)} – ${formatTime(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
]

export function formatRelative(value: string) {
  let amount = (new Date(value).getTime() - Date.now()) / 60_000
  if (Math.abs(amount) < 1) return 'just now'
  for (const [unit, limit] of units) {
    if (Math.abs(amount) < limit) return relativeFormat.format(Math.round(amount), unit)
    amount /= limit
  }
  return formatDate(value)
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const pluralize = (count: number, word: string, plural = `${word}s`) =>
  `${count} ${count === 1 ? word : plural}`
