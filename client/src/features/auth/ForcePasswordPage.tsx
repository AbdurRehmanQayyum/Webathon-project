import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordForm } from '@/features/profile/PasswordForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { sessionKey, useLogout } from './api'

// Shown until a temporary password has been replaced; the API enforces the same
export function ForcePasswordPage() {
  useDocumentTitle('Set your password')
  const queryClient = useQueryClient()
  const logout = useLogout()
  const toast = useToast()

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-lg content-center gap-4 p-4">
      <div className="justify-self-center">
        <Logo />
      </div>
      <Card className="grid gap-4 p-5 sm:p-6">
        <h1 className="text-xl font-semibold">Set your own password</h1>
        <Alert tone="warning">
          Your account was created with a temporary password. Replace it to continue.
        </Alert>
        <PasswordForm
          onChanged={() => void queryClient.invalidateQueries({ queryKey: sessionKey })}
        />
      </Card>
      <Button
        variant="ghost"
        className="justify-self-center"
        icon={<LogOut className="size-4" />}
        loading={logout.isPending}
        onClick={() => logout.mutate(undefined, { onError: toast.error })}
      >
        Sign out
      </Button>
    </main>
  )
}
