import type { HubConnection } from '@microsoft/signalr'

interface LiveHandlers {
  notificationsChanged: () => void
  commentsChanged: (postId: number) => void
}

let connection: HubConnection | null = null
const watchedPosts = new Set<number>()

const isConnected = () => connection?.state === 'Connected'

function invoke(method: 'WatchPost' | 'UnwatchPost', postId: number) {
  if (isConnected()) void connection?.invoke(method, postId).catch(() => undefined)
}

export function watchPost(postId: number) {
  watchedPosts.add(postId)
  invoke('WatchPost', postId)
  return () => {
    watchedPosts.delete(postId)
    invoke('UnwatchPost', postId)
  }
}

// Real-time signals; data is still read through the authorized REST API
export function startLiveUpdates(handlers: LiveHandlers) {
  let isStopped = false
  let active: HubConnection | null = null

  const start = async () => {
    const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr')
    if (isStopped) return

    const hub = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_BASE_URL ?? ''}/hubs/live`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()
    hub.on('NotificationsChanged', handlers.notificationsChanged)
    hub.on('CommentsChanged', handlers.commentsChanged)
    hub.onreconnected(() => watchedPosts.forEach((id) => invoke('WatchPost', id)))

    active = hub
    connection = hub
    await hub.start()
    if (isStopped) await hub.stop()
    else watchedPosts.forEach((id) => invoke('WatchPost', id))
  }

  // The app works without a live connection, so failures are non-fatal
  void start().catch(() => undefined)

  return () => {
    isStopped = true
    if (connection === active) connection = null
    void active?.stop()
  }
}
