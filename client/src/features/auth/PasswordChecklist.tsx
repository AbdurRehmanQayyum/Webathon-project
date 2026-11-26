import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'

export function PasswordChecklist({ password, confirm }: { password: string; confirm: string }) {
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a letter', met: /[A-Za-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Both entries match', met: password.length > 0 && password === confirm },
  ]

  return (
    <ul aria-label="Password requirements" className="grid gap-1.5 sm:grid-cols-2">
      {rules.map(({ label, met }) => {
        const Icon = met ? Check : Circle
        return (
          <li
            key={label}
            className={cn('flex items-center gap-2 text-sm', met ? 'text-fg' : 'text-muted')}
          >
            <Icon
              className={cn('size-4 shrink-0', met ? 'text-success' : 'scale-50')}
              aria-hidden="true"
            />
            {label}
            <span className="sr-only">{met ? ' (met)' : ' (not met yet)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
