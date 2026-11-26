import { ArrowLeft, CalendarDays, Megaphone, Moon, Sun, UsersRound } from 'lucide-react'
import { Outlet, useLocation } from 'react-router'
import { useTheme } from '@/app/providers/theme-context'
import { hasViewTransitions } from '@/app/routes/page-transitions'
import { Reveal } from '@/components/common/Reveal'
import { BrandMark } from '@/components/brand/BrandMark'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/IconButton'
import { OfflineBanner } from '@/features/pwa/ConnectivityNotices'

const highlights = [
  { Icon: UsersRound, text: 'Join clubs and discuss with classmates' },
  { Icon: Megaphone, text: 'Read official department announcements' },
  { Icon: CalendarDays, text: 'Keep up with department events' },
]

function Wordmark({ className }: { className: string }) {
  return (
    <p className={className}>
      Campus <span className="text-link">Connect</span>
    </p>
  )
}

export function AuthLayout() {
  const location = useLocation()
  const { isDark, setPreference } = useTheme()

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="sticky top-0 hidden h-dvh place-content-center justify-items-center gap-8 self-start border-r border-line bg-surface-alt p-12 text-center lg:grid">
        <BrandMark animation="intro" className="size-28" />
        <div>
          <Wordmark className="text-4xl font-semibold tracking-tight" />
          <p className="mt-2 text-lg text-muted">Connect. Collaborate. Grow.</p>
        </div>
        <ul className="grid justify-items-start gap-3 text-left">
          {highlights.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span className="grid size-9 shrink-0 place-items-center rounded-control bg-selected text-selected-fg">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-h-dvh min-w-0 flex-col">
        <OfflineBanner />
        <div className="flex items-center justify-between gap-2 p-3">
          <ButtonLink to="/" variant="ghost" size="sm" icon={<ArrowLeft className="size-4" />}>
            Home
          </ButtonLink>
          <IconButton
            label={isDark ? 'Use light theme' : 'Use dark theme'}
            icon={isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            onClick={() => setPreference(isDark ? 'light' : 'dark')}
          />
        </div>
        {/* The form sits in the exact middle of the free space */}
        <main className="grid flex-1 place-items-center px-4 pb-8">
          <div className="page-content w-full max-w-lg">
            <div className="mb-5 grid justify-items-center gap-2 lg:hidden">
              <BrandMark animation="intro" className="size-14" />
              <Wordmark className="text-lg font-semibold" />
            </div>
            <Reveal key={location.pathname} disabled={hasViewTransitions}>
              <Card className="p-5 sm:p-7">
                <Outlet />
              </Card>
            </Reveal>
          </div>
        </main>
      </div>
    </div>
  )
}
