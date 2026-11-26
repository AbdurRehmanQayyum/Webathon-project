import { cn } from '@/lib/cn'

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-alt',
  ghost: 'text-muted hover:bg-surface-alt hover:text-fg aria-pressed:text-selected-fg',
  danger: 'bg-danger text-on-primary hover:bg-danger-hover',
}

const sizes = {
  sm: 'h-8 px-3 text-sm pointer-coarse:h-10',
  md: 'h-10 px-4 text-sm',
  icon: 'size-10',
  'icon-sm': 'size-8 pointer-coarse:size-10',
}

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

export const buttonStyles = (
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className?: string,
) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none',
    'transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-55',
    variants[variant],
    sizes[size],
    className,
  )
