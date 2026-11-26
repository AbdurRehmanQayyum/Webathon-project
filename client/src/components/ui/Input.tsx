import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { inputStyles } from './input-styles'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputStyles, 'h-10', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={rows}
      className={cn(inputStyles, 'min-h-20 resize-y py-2 leading-relaxed', className)}
      {...props}
    />
  )
}
