import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { Input } from './Input'

export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [isVisible, setVisible] = useState(false)
  const Icon = isVisible ? EyeOff : Eye

  return (
    <div className="relative">
      <Input {...props} type={isVisible ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setVisible((visible) => !visible)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-control text-muted hover:text-fg"
      >
        <Icon className="size-4" />
      </button>
    </div>
  )
}
