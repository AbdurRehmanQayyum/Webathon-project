import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { Tooltip } from 'radix-ui'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router/dom'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { router } from '@/app/routes/router'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { sessionKey } from '@/features/auth/api'
import { UpdatePrompt } from '@/features/pwa/ConnectivityNotices'
import { useActivityFavicon } from '@/hooks/useActivityFavicon'
import { onUnauthorized } from '@/services/api-client'
import { queryClient } from '@/services/query-client'
import '@/features/pwa/install'

// An expired session returns the user to the sign-in screen
function SessionWatcher() {
  useActivityFavicon()
  useEffect(() => onUnauthorized(() => queryClient.setQueryData(sessionKey, null)), [])
  return null
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <Tooltip.Provider delayDuration={300}>
            <ToastProvider>
              <SessionWatcher />
              <RouterProvider router={router} />
              <UpdatePrompt />
            </ToastProvider>
          </Tooltip.Provider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
