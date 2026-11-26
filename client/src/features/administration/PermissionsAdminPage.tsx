import { Lock, RotateCcw, Save } from 'lucide-react'
import { Switch as Primitive } from 'radix-ui'
import { useId, useState } from 'react'
import { Masonry } from '@/components/common/Masonry'
import { PageHeader } from '@/components/common/PageHeader'
import { Reveal } from '@/components/common/Reveal'
import { QueryState } from '@/components/common/QueryState'
import { Alert } from '@/components/feedback/Alert'
import { useToast } from '@/components/feedback/toast-context'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useListParams } from '@/hooks/useListParams'
import { pluralize } from '@/lib/format'
import {
  usePermissionMatrix,
  useUpdateRolePermissions,
  type PermissionDefinition,
  type PermissionMatrix,
  type RolePermissions,
} from './permissions-api'

const roleOrder = ['Student', 'Moderator', 'Admin']

const roleNotes: Record<string, string> = {
  Student: 'Applies to every student account.',
  Moderator: 'Added on top of the student permissions, inside assigned clubs only.',
  Admin: 'Administrators always hold every permission, so nobody can be locked out.',
}

export function PermissionsAdminPage() {
  const matrix = usePermissionMatrix()

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="Choose what each role may do. Changes apply on the next request."
      />
      <QueryState query={matrix}>{(data) => <Matrix matrix={data} />}</QueryState>
    </>
  )
}

function Matrix({ matrix }: { matrix: PermissionMatrix }) {
  const { get, set } = useListParams()
  const ordered = [...matrix.roles].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
  )
  const selected = ordered.find((item) => item.role === get('role')) ?? ordered[0]
  if (!selected) return null

  return (
    <>
      <SegmentedControl
        label="Role"
        value={selected.role}
        onChange={(value) => set({ role: value })}
        segments={ordered.map((item) => ({ value: item.role, label: item.role }))}
        className="mb-4 w-full sm:w-96"
      />
      <Reveal when={selected.role}>
        {/* Remounts when the stored set changes, discarding stale edits */}
        <RoleEditor
          key={`${selected.roleId}:${[...selected.permissions].sort().join()}`}
          role={selected}
          definitions={matrix.permissions}
        />
      </Reveal>
    </>
  )
}

function RoleEditor({
  role,
  definitions,
}: {
  role: RolePermissions
  definitions: PermissionDefinition[]
}) {
  const [granted, setGranted] = useState(() => new Set(role.permissions))
  const update = useUpdateRolePermissions()
  const toast = useToast()
  const groups = [...new Set(definitions.map((item) => item.group))]
  const changes =
    definitions.filter((item) => granted.has(item.key) !== role.permissions.includes(item.key))
      .length

  const toggle = (key: string, on: boolean) =>
    setGranted((current) => {
      const next = new Set(current)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })

  return (
    <div className="grid gap-4">
      <Alert tone={role.isLocked ? 'warning' : 'info'}>{roleNotes[role.role]}</Alert>
      <Masonry columns="md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group) => {
          const items = definitions.filter((item) => item.group === group)
          return (
            <Card key={group} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{group}</h2>
                <Badge>
                  {items.filter((item) => granted.has(item.key)).length} of {items.length}
                </Badge>
              </div>
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <PermissionRow
                    key={item.key}
                    definition={item}
                    checked={granted.has(item.key)}
                    disabled={role.isLocked || item.adminOnly}
                    onChange={(on) => toggle(item.key, on)}
                  />
                ))}
              </ul>
            </Card>
          )
        })}
      </Masonry>
      {!role.isLocked && changes > 0 && (
        <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-3 shadow-pop lg:bottom-4">
          <p className="text-sm text-muted" aria-live="polite">
            {pluralize(changes, 'unsaved change')}
          </p>
          <div className="flex gap-2">
            <Button
              icon={<RotateCcw className="size-4" />}
              disabled={update.isPending}
              onClick={() => setGranted(new Set(role.permissions))}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              icon={<Save className="size-4" />}
              loading={update.isPending}
              onClick={() =>
                update.mutate(
                  { roleId: role.roleId, permissions: [...granted] },
                  {
                    onSuccess: () => toast.success(`${role.role} permissions saved`),
                    onError: toast.error,
                  },
                )
              }
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionRow({
  definition,
  checked,
  disabled,
  onChange,
}: {
  definition: PermissionDefinition
  checked: boolean
  disabled: boolean
  onChange: (on: boolean) => void
}) {
  const id = useId()

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <label htmlFor={id} className="min-w-0 select-none">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {definition.label}
          {definition.adminOnly && (
            <Lock className="size-3.5 text-muted" aria-label="Administrators only" />
          )}
        </span>
        <span className="block text-xs text-muted">{definition.description}</span>
      </label>
      <Primitive.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="h-6 w-10.5 shrink-0 rounded-full bg-line-strong p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-primary"
      >
        <Primitive.Thumb className="block size-5 rounded-full bg-on-primary shadow-card transition-transform duration-150 data-[state=checked]:translate-x-4.5" />
      </Primitive.Root>
    </li>
  )
}
