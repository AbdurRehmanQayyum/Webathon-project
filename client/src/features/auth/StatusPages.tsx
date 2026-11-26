import { Compass, ShieldAlert, type LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface StatusPageProps {
  icon: LucideIcon
  title: string
  description: string
}

function StatusPage({ icon: Icon, title, description }: StatusPageProps) {
  useDocumentTitle(title)

  return (
    <div className="grid justify-items-center gap-2 px-4 py-20 text-center">
      <Icon className="size-10 text-link" aria-hidden="true" />
      <h1 className="mt-2 text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      <ButtonLink to="/" variant="primary" className="mt-4">
        Back to home
      </ButtonLink>
    </div>
  )
}

export const AccessDeniedPage = () => (
  <StatusPage
    icon={ShieldAlert}
    title="Access denied"
    description="Your account does not have permission to open this page."
  />
)

export const NotFoundPage = () => (
  <StatusPage
    icon={Compass}
    title="Page not found"
    description="The address may be wrong, or the content has been removed."
  />
)
