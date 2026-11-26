import { Settings2 } from 'lucide-react'
import { useCallback } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { useListParams } from '@/hooks/useListParams'
import { useAnnouncements } from './api'
import { AnnouncementResults } from './AnnouncementResults'

export function AnnouncementsPage() {
  const { can } = useCurrentUser()
  const { page, get, set } = useListParams()
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])
  const announcements = useAnnouncements({ search, pageNumber: page, pageSize: 8 })

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Official notices from the department."
        actions={
          can(permissions.manageAnnouncements) && (
            <ButtonLink to="/admin/announcements" icon={<Settings2 className="size-4" />}>
              Manage
            </ButtonLink>
          )
        }
      />
      <SearchInput
        label="Search announcements"
        value={search}
        onSearch={onSearch}
        className="mb-4 sm:max-w-md"
      />
      <AnnouncementResults query={announcements} onPage={(next) => set({ page: next })} />
    </>
  )
}
