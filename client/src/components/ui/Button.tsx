import { LoaderCircle } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

type ButtonProps = ComponentProps<'button'> & StyleProps & { loading?: boolean }

export function Button({
  variant,
  size,
  icon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const isOnline = useOnlineStatus()
  // Saving needs the server, so submissions pause while offline
  const isBlockedOffline = type === 'submit' && !isOnline

  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading || isBlockedOffline}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: LinkProps & StyleProps) {
  return (
    <Link className={buttonStyles(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  )
}
