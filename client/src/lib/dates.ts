export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

// Six Monday-first weeks covering the month
export function buildMonthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = addDays(first, -((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

export const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const monthLabel = (month: Date) =>
  month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

const pad = (value: number) => String(value).padStart(2, '0')

export const toTimeValue = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

export function combineDateAndTime(date: Date, time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes)
}
