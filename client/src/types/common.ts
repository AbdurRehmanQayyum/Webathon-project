export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface UserSummary {
  id: number
  fullName: string
  title: string | null
  avatarFileId: number | null
}

export interface ClubReference {
  id: number
  name: string
  slug: string
  iconKey: string
  logoFileId: number | null
}

export interface Attachment {
  id: number
  fileName: string
  contentType: string
  sizeBytes: number
}

export type ContentStatus = 'Published' | 'Deleted' | 'Removed'
