import { Switch as Primitive } from 'radix-ui'
import { useId } from 'react'

interface SwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId()

  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
      <Primitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="h-6 w-10.5 shrink-0 rounded-full bg-line-strong p-0.5 transition-colors data-[state=checked]:bg-primary"
      >
        <Primitive.Thumb className="block size-5 rounded-full bg-on-primary shadow-card transition-transform duration-150 data-[state=checked]:translate-x-4.5" />
      </Primitive.Root>
    </div>
  )
}
