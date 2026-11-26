import { CalendarDays, Megaphone, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { BrandMark } from '@/components/brand/BrandMark'
import { OfflineBanner } from '@/features/pwa/ConnectivityNotices'

const highlights = [
  { Icon: UsersRound, text: 'Join clubs and discuss with classmates' },
  { Icon: Megaphone, text: 'Read official department announcements' },
  { Icon: CalendarDays, text: 'Keep up with department events' },
]

export function AuthLayout() {
  const location = useLocation()

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden content-center gap-8 border-r border-line bg-surface-alt px-12 lg:grid">
        <BrandMark animation="intro" className="size-24" />
        <div>
          <p className="text-3xl font-semibold tracking-tight">
            Campus <span className="text-link">Connect</span>
          </p>
          <p className="mt-2 text-lg text-muted">Connect. Collaborate. Grow.</p>
        </div>
        <ul className="grid gap-3">
          {highlights.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <Icon className="size-5 text-link" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex flex-col">
        <OfflineBanner />
        <main className="mx-auto w-full max-w-md flex-1 content-center px-5 py-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark animation="intro" className="size-12" />
            <div>
              <p className="text-lg font-semibold">
                Campus <span className="text-link">Connect</span>
              </p>
              <p className="text-sm text-muted">Connect. Collaborate. Grow.</p>
            </div>
          </div>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
