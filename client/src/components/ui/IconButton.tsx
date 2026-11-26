import type { ComponentProps, ReactNode } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles'
import { Tooltip } from './Tooltip'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string
  icon: ReactNode
  variant?: ButtonVariant
  size?: Extract<ButtonSize, 'icon' | 'icon-sm'>
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'icon',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        className={buttonStyles(variant, size, className)}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
