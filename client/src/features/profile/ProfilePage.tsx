import { Settings } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { QueryState } from '@/components/common/QueryState'
import { RichText } from '@/components/common/RichText'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCurrentUser } from '@/features/auth/current-user'
import { ClubIcon } from '@/features/clubs/ClubIcon'
import { PostList } from '@/features/posts/PostList'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, pluralize } from '@/lib/format'
import { useProfile, type Profile } from './api'

export function ProfilePage() {
  const { user } = useCurrentUser()
  const params = useParams()
  const userId = params.userId ? Number(params.userId) : user.id
  const profile = useProfile(userId)
  useDocumentTitle(profile.data?.fullName)

  return (
    <div className="mx-auto max-w-3xl">
      <QueryState query={profile}>
        {(data) => <ProfileView profile={data} isOwn={data.id === user.id} />}
      </QueryState>
    </div>
  )
}

function ProfileView({ profile, isOwn }: { profile: Profile; isOwn: boolean }) {
  const roles = profile.roles.filter((role) => role !== 'Student')

  return (
    <>
      <Card className="flex flex-wrap items-start gap-4 p-4 sm:p-6">
        <Avatar name={profile.fullName} fileId={profile.avatarFileId} size="lg" />
        <div className="grid min-w-0 flex-1 gap-1">
          <h1 className="wrap-text text-xl font-semibold sm:text-2xl">{profile.fullName}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {profile.title && <Badge tone="primary">{profile.title}</Badge>}
            {roles.map((role) => (
              <Badge key={role} tone="info">
                {role}
              </Badge>
            ))}
            {profile.semester && <Badge>Semester {profile.semester}</Badge>}
          </div>
          {profile.bio && <RichText text={profile.bio} className="mt-2 text-sm" />}
          <p className="mt-1 text-sm text-muted">
            {pluralize(profile.postCount, 'post')} · {pluralize(profile.commentCount, 'comment')} ·
            Joined {formatDate(profile.createdAtUtc)}
          </p>
        </div>
        {isOwn && (
          <ButtonLink to="/settings" size="sm" icon={<Settings className="size-4" />}>
            Edit profile
          </ButtonLink>
        )}
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Clubs</h2>
        {profile.clubs.length === 0 ? (
          <p className="text-sm text-muted">Not a member of any club yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {profile.clubs.map((club) => (
              <li key={club.id}>
                <Link
                  to={`/clubs/${club.slug}`}
                  className="inline-flex items-center gap-2 rounded-control border border-line bg-surface py-1.5 pr-3 pl-1.5 text-sm hover:border-primary"
                >
                  <ClubIcon iconKey={club.iconKey} logoFileId={club.logoFileId} size="xs" />
                  {club.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Posts</h2>
        <PostList
          params={{ authorId: profile.id }}
          emptyTitle="No posts yet"
          emptyDescription={
            isOwn ? 'Your posts will appear here.' : 'This member has not posted yet.'
          }
        />
      </section>
    </>
  )
}
