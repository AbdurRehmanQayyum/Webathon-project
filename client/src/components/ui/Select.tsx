import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Select as Primitive } from 'radix-ui'
import { cn } from '@/lib/cn'
import { inputStyles, menuItemStyles, popupStyles } from './input-styles'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select',
  disabled,
  className,
  ...trigger
}: SelectProps) {
  return (
    <Primitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Primitive.Trigger
        {...trigger}
        className={cn(
          inputStyles,
          'flex h-10 items-center justify-between gap-2 text-left data-[placeholder]:text-muted',
          className,
        )}
      >
        <span className="truncate">
          <Primitive.Value placeholder={placeholder} />
        </span>
        <Primitive.Icon>
          <ChevronDown className="size-4 text-muted" />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            popupStyles,
            'max-h-[min(18rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
          )}
        >
          <Primitive.ScrollUpButton className="grid h-6 place-items-center">
            <ChevronUp className="size-4" />
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className="p-1">
            {options.map((option) => (
              <Primitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  menuItemStyles,
                  'relative pr-8 data-[state=checked]:text-selected-fg',
                )}
              >
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
                <Primitive.ItemIndicator className="absolute right-2">
                  <Check className="size-4" />
                </Primitive.ItemIndicator>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
          <Primitive.ScrollDownButton className="grid h-6 place-items-center">
            <ChevronDown className="size-4" />
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
