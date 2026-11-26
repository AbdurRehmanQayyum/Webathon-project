import type { ReactNode } from 'react'

function Illustration() {
  return (
    <svg viewBox="0 0 120 72" className="h-18 w-30" fill="none" aria-hidden="true">
      <path
        d="M26 50 60 22l34 28M26 50h68"
        stroke="var(--border-strong)"
        strokeWidth="2"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="22" r="13" fill="var(--selected)" />
      <path
        d="M65 17a7 7 0 1 0 0 10"
        stroke="var(--logo-outer)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="26"
        cy="50"
        r="9"
        fill="var(--surface)"
        stroke="var(--logo-inner)"
        strokeWidth="2.5"
      />
      <circle
        cx="94"
        cy="50"
        r="9"
        fill="var(--surface)"
        stroke="var(--logo-node)"
        strokeWidth="2.5"
      />
    </svg>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-2 rounded-panel border border-dashed border-line-strong px-6 py-10 text-center">
      <Illustration />
      <h2 className="mt-2 text-base font-semibold">{title}</h2>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
