import { Link } from 'react-router'
import { BrandMark } from './BrandMark'

export function Logo({ compact = false, to = '/feed' }: { compact?: boolean; to?: string }) {
  return (
    <Link
      to={to}
      className="brand-link inline-flex items-center gap-2.5 rounded-control"
      aria-label="Campus Connect home"
    >
      <BrandMark animation="intro" className="size-8" />
      {!compact && (
        <span className="text-[1.0625rem] font-semibold tracking-tight whitespace-nowrap text-fg">
          Campus <span className="text-link">Connect</span>
        </span>
      )}
    </Link>
  )
}
