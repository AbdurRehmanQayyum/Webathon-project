import type { ClubReference } from '@/types/common'

export type Role = 'Admin' | 'Moderator' | 'Student'

export interface CurrentUser {
  id: number
  fullName: string
  username: string
  email: string
  registrationNumber: string | null
  semester: number | null
  title: string | null
  bio: string | null
  avatarFileId: number | null
  createdAtUtc: string
  mustChangePassword: boolean
  roles: Role[]
  permissions: string[]
  interestIds: number[]
  moderatedClubs: ClubReference[]
  joinedClubCount: number
}
