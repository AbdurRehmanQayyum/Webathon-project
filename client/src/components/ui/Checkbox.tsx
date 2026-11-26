import { Check } from 'lucide-react'
import { Checkbox as Primitive } from 'radix-ui'
import { useId } from 'react'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const id = useId()

  return (
    <div className="flex items-center gap-2.5">
      <Primitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(state) => onChange(state === true)}
        className="grid size-4.5 shrink-0 place-items-center rounded border border-line-strong bg-surface transition-colors hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <Primitive.Indicator>
          <Check className="size-3.5 text-on-primary" strokeWidth={3} />
        </Primitive.Indicator>
      </Primitive.Root>
      <label htmlFor={id} className="cursor-pointer text-sm select-none">
        {label}
      </label>
    </div>
  )
}
