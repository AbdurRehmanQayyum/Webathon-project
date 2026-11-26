import { ImagePlus, PenLine } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Breadcrumb } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { RichText } from '@/components/common/RichText'
import { Alert } from '@/components/feedback/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Tabs } from '@/components/ui/Tabs'
import { useCurrentUser } from '@/features/auth/current-user'
import { permissions } from '@/features/auth/permissions'
import { ImageUploader } from '@/features/files/ImageUploader'
import { PostList } from '@/features/posts/PostList'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useListParams } from '@/hooks/useListParams'
import { formatDate, pluralize } from '@/lib/format'
import { fileUrl } from '@/services/api-client'
import { useClub } from './api'
import { ClubIcon } from './ClubIcon'
import { MembershipButton } from './MembershipButton'
import type { Club } from './types'

export function ClubDetailPage() {
  const { slug = '' } = useParams()
  const club = useClub(slug)
  useDocumentTitle(club.data?.name)

  return <QueryState query={club}>{(data) => <ClubView club={data} />}</QueryState>
}

function ClubView({ club }: { club: Club }) {
  const { isAdmin, can } = useCurrentUser()
  const { get, set } = useListParams()
  const [isEditingImages, setEditingImages] = useState(false)
  const tab = get('tab') || 'discussion'
  const canPost =
    club.status === 'Active' && (club.isMember || isAdmin) && can(permissions.createPosts)

  return (
    <>
      <Breadcrumb items={[{ label: 'Clubs', to: '/clubs' }, { label: club.name }]} />
      <Card className="mb-5 overflow-hidden">
        {club.coverFileId && (
          <img
            src={fileUrl(club.coverFileId)}
            alt=""
            className="aspect-3/1 max-h-48 w-full bg-surface-alt object-cover sm:aspect-5/1"
          />
        )}
        <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
          <ClubIcon iconKey={club.category.iconKey} logoFileId={club.logoFileId} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="wrap-text text-xl font-semibold sm:text-2xl">{club.name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {club.category.name} · {pluralize(club.memberCount, 'member')} ·{' '}
              {pluralize(club.postCount, 'post')}
            </p>
            <p className="wrap-text mt-2 text-sm">{club.description}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <MembershipButton club={club} />
            {canPost && (
              <ButtonLink
                to={`/posts/new?club=${club.id}`}
                size="sm"
                icon={<PenLine className="size-4" />}
              >
                New post
              </ButtonLink>
            )}
            {club.canModerate && (
              <Button
                size="sm"
                variant="ghost"
                icon={<ImagePlus className="size-4" />}
                onClick={() => setEditingImages(true)}
              >
                Images
              </Button>
            )}
          </div>
        </div>
      </Card>

      {club.status === 'Archived' && (
        <Alert tone="warning" className="mb-4">
          This club is archived. Existing discussions are read-only.
        </Alert>
      )}
      {!club.isMember && club.status === 'Active' && !isAdmin && (
        <Alert className="mb-4">Join this club to post and comment.</Alert>
      )}

      <Tabs
        label="Club sections"
        value={tab}
        onChange={(value) => set({ tab: value === 'discussion' ? null : value })}
        items={[
          { value: 'discussion', label: 'Discussion', content: <ClubFeed club={club} /> },
          { value: 'about', label: 'About', content: <ClubAbout club={club} /> },
        ]}
      />

      <Modal
        open={isEditingImages}
        onClose={() => setEditingImages(false)}
        title="Club images"
        description="Shown on the club page and beside its posts."
      >
        <div className="grid gap-6">
          <ImageUploader
            title="Logo"
            shape="square"
            fileId={club.logoFileId}
            uploadPath={`/api/clubs/${club.id}/logo`}
          />
          <ImageUploader
            title="Cover"
            shape="wide"
            fileId={club.coverFileId}
            uploadPath={`/api/clubs/${club.id}/cover`}
          />
        </div>
      </Modal>
    </>
  )
}

function ClubFeed({ club }: { club: Club }) {
  const { get, set } = useListParams()
  const sort = (['Popular', 'ForYou'] as const).find((value) => value === get('sort')) ?? 'Recent'
  const search = get('q')
  const onSearch = useCallback((q: string) => set({ q }), [set])

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Sort posts"
          value={sort}
          onChange={(value) => set({ sort: value === 'Recent' ? null : value })}
          segments={[
            { value: 'Recent', label: 'Recent' },
            { value: 'Popular', label: 'Popular' },
          ]}
        />
        <SearchInput
          label="Search this club"
          value={search}
          onSearch={onSearch}
          className="min-w-48 flex-1"
        />
      </div>
      <PostList
        params={{ clubId: club.id, sort, search }}
        emptyTitle={search ? 'No posts match' : 'No discussions yet'}
        emptyDescription={search ? 'Try different words.' : 'Start the first conversation.'}
      />
    </>
  )
}

function ClubAbout({ club }: { club: Club }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section>
        <h2 className="mb-2 text-base font-semibold">Club rules</h2>
        {club.rules ? (
          <RichText text={club.rules} className="text-sm" />
        ) : (
          <p className="text-sm text-muted">No specific rules have been published.</p>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold">Moderators</h2>
        {club.moderators.length === 0 ? (
          <p className="text-sm text-muted">No moderator is assigned yet.</p>
        ) : (
          <ul className="grid gap-2">
            {club.moderators.map((moderator) => (
              <li key={moderator.id}>
                <Link
                  to={`/users/${moderator.id}`}
                  className="inline-flex items-center gap-2.5 rounded text-sm font-medium hover:text-link"
                >
                  <Avatar name={moderator.fullName} fileId={moderator.avatarFileId} />
                  {moderator.fullName}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm text-muted">Established {formatDate(club.createdAtUtc)}</p>
    </div>
  )
}
