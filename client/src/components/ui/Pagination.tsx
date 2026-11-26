import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const go = (next: number) => {
    onChange(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
      <Button
        size="sm"
        icon={<ChevronLeft className="size-4" />}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <Button size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Next
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
