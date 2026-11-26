import { motion } from 'motion/react'
import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { BrandLoader } from '@/components/feedback/BrandLoader'
import { Header } from '@/components/navigation/Header'
import { MobileNavigation } from '@/components/navigation/MobileNavigation'
import { Sidebar } from '@/components/navigation/Sidebar'
import { useLiveUpdates } from '@/features/notifications/api'
import { OfflineBanner } from '@/features/pwa/ConnectivityNotices'

export function AppLayout() {
  const location = useLocation()
  useLiveUpdates()
  // Switching administration tabs keeps the surrounding page still
  const section = location.pathname.startsWith('/admin') ? '/admin' : location.pathname

  return (
    <div className="flex min-h-dvh">
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-primary px-3 py-2 text-sm text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <OfflineBanner />
        <main
          id="content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-3 pt-5 pb-24 outline-none sm:px-5 lg:px-8 lg:pb-10"
        >
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Suspense fallback={<BrandLoader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
      <MobileNavigation />
      <ScrollRestoration />
    </div>
  )
}
