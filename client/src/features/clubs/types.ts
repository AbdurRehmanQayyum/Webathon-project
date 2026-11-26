import type { UserSummary } from '@/types/common'

export type ClubStatus = 'Active' | 'Archived'
export type ClubRequestStatus = 'Pending' | 'Approved' | 'Rejected'

export interface ClubCategory {
  id: number
  name: string
  iconKey: string
}

export interface Club {
  id: number
  name: string
  slug: string
  description: string
  rules: string | null
  logoFileId: number | null
  coverFileId: number | null
  status: ClubStatus
  category: ClubCategory
  createdAtUtc: string
  memberCount: number
  postCount: number
  isMember: boolean
  isModerator: boolean
  canModerate: boolean
  moderators: UserSummary[]
}

export interface ClubRequest {
  id: number
  proposedName: string
  description: string
  justification: string
  status: ClubRequestStatus
  rejectionReason: string | null
  category: ClubCategory
  requestedBy: UserSummary
  reviewedBy: UserSummary | null
  createdAtUtc: string
  reviewedAtUtc: string | null
  createdClubSlug: string | null
}
