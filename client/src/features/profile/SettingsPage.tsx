import type { ReactNode } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { ThemeControl } from '@/components/navigation/ThemeControl'
import { useCurrentUser } from '@/features/auth/current-user'
import { ImageUploader } from '@/features/files/ImageUploader'
import { useFilePolicy } from '@/features/files/api'
import { InstallCard } from '@/features/pwa/InstallCard'
import { formatBytes } from '@/lib/format'
import { PasswordForm } from './PasswordForm'
import { ProfileForm } from './ProfileForm'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export function SettingsPage() {
  const { user } = useCurrentUser()
  const policy = useFilePolicy()

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <PageHeader title="Settings" description={user.email} />
      <Section
        title="Profile picture"
        description={
          policy.data &&
          `Storage used: ${formatBytes(policy.data.usedBytes)} of ${formatBytes(policy.data.quotaBytes)}.`
        }
      >
        <ImageUploader
          title="Picture"
          shape="round"
          fileId={user.avatarFileId}
          uploadPath="/api/users/me/avatar"
        />
      </Section>
      <Section title="Profile details">
        <ProfileForm />
      </Section>
      <Section title="Password" description="Changing it signs out your other sessions.">
        <PasswordForm />
      </Section>
      <Section title="Appearance">
        <ThemeControl />
      </Section>
      <Section title="Install the app">
        <InstallCard />
      </Section>
    </div>
  )
}
