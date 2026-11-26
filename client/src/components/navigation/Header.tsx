import { LogOut, Moon, PenLine, Search, Settings, Sun, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTheme } from '@/app/providers/theme-context'
import { Logo } from '@/components/brand/Logo'
import { useToast } from '@/components/feedback/toast-context'
import { Avatar } from '@/components/ui/Avatar'
import { ButtonLink } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Menu } from '@/components/ui/Menu'
import { useLogout } from '@/features/auth/api'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { NotificationMenu } from '@/features/notifications/NotificationMenu'
import { InstallButton } from '@/features/pwa/InstallButton'

function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    setQuery('')
    void navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <form role="search" onSubmit={submit} className="relative hidden w-full max-w-md md:block">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        aria-label="Search Campus Connect"
        placeholder="Search posts, clubs and events"
        value={query}
        maxLength={100}
        onChange={(event) => setQuery(event.target.value)}
        className="pl-9"
      />
    </form>
  )
}

export function Header() {
  const { user, can } = useCurrentUser()
  const { isDark, setPreference } = useTheme()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  return (
    <header className="app-header sticky top-0 z-30 border-b border-line bg-surface">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5 lg:h-16">
        <div className="lg:hidden">
          <Logo />
        </div>
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
          {location.pathname !== '/posts/new' && can(permissions.createPosts) && (
            <div className="hidden lg:block">
              <ButtonLink to="/posts/new" size="sm" icon={<PenLine className="size-4" />}>
                New post
              </ButtonLink>
            </div>
          )}
          <div className="md:hidden">
            <IconButton
              label="Search"
              icon={<Search className="size-5" />}
              onClick={() => void navigate('/search')}
            />
          </div>
          <div className="hidden sm:block">
            <IconButton
              label={isDark ? 'Use light theme' : 'Use dark theme'}
              icon={isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              onClick={() => setPreference(isDark ? 'light' : 'dark')}
            />
          </div>
          <InstallButton iconOnly />
          <NotificationMenu />
          <Menu
            header={
              <div className="max-w-56">
                <p className="truncate text-sm font-semibold">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            }
            items={[
              { label: 'My profile', icon: UserRound, onSelect: () => void navigate('/profile') },
              { label: 'Settings', icon: Settings, onSelect: () => void navigate('/settings') },
              {
                label: isDark ? 'Light theme' : 'Dark theme',
                icon: isDark ? Sun : Moon,
                onSelect: () => setPreference(isDark ? 'light' : 'dark'),
              },
              {
                label: 'Sign out',
                icon: LogOut,
                onSelect: () => logout.mutate(undefined, { onError: toast.error }),
              },
            ]}
            trigger={
              <button
                type="button"
                aria-label="Account menu"
                className={buttonStyles('ghost', 'icon', 'rounded-full')}
              >
                <Avatar name={user.fullName} fileId={user.avatarFileId} />
              </button>
            }
          />
        </div>
      </div>
    </header>
  )
}
