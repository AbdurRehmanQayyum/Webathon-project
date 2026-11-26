import type { ClubReference } from '@/types/common'

export type Role = 'Admin' | 'Moderator' | 'Student'

export interface CurrentUser {
  id: number
  fullName: string
  email: string
  registrationNumber: string | null
  semester: number | null
  title: string | null
  bio: string | null
  avatarFileId: number | null
  createdAtUtc: string
  roles: Role[]
  moderatedClubs: ClubReference[]
  joinedClubCount: number
}
