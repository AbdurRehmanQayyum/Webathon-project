import {
  BrainCircuit,
  ChartColumn,
  Code,
  Gamepad2,
  GitFork,
  GraduationCap,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { fileUrl } from '@/services/api-client'

const categoryIcons: Record<string, LucideIcon> = {
  ai: BrainCircuit,
  code: Code,
  security: ShieldCheck,
  competition: Trophy,
  data: ChartColumn,
  games: Gamepad2,
  opensource: GitFork,
  academics: GraduationCap,
}

const sizes = {
  xs: { box: 'size-6 rounded-md', icon: 'size-3.5' },
  md: { box: 'size-10 rounded-control', icon: 'size-5' },
  lg: { box: 'size-16 rounded-panel', icon: 'size-8' },
}

interface ClubIconProps {
  iconKey: string
  logoFileId?: number | null
  size?: keyof typeof sizes
}

export function ClubIcon({ iconKey, logoFileId, size = 'md' }: ClubIconProps) {
  const { box, icon } = sizes[size]

  if (logoFileId) {
    return <img src={fileUrl(logoFileId)} alt="" className={cn(box, 'shrink-0 object-cover')} />
  }

  const Icon = categoryIcons[iconKey] ?? Users
  return (
    <span className={cn(box, 'grid shrink-0 place-items-center bg-selected text-selected-fg')}>
      <Icon className={icon} aria-hidden="true" />
    </span>
  )
}
