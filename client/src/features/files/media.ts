import { FileSpreadsheet, FileText, Film, Image, Music, Presentation } from 'lucide-react'
import type { Attachment } from '@/types/common'

export type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'office'

export function mediaKind(contentType: string): MediaKind {
  if (contentType.startsWith('image/')) return 'image'
  if (contentType.startsWith('video/')) return 'video'
  if (contentType.startsWith('audio/')) return 'audio'
  if (contentType === 'application/pdf') return 'pdf'
  if (contentType === 'text/plain') return 'text'
  return 'office'
}

export function mediaIcon(attachment: Pick<Attachment, 'contentType'>) {
  const type = attachment.contentType
  if (type.includes('spreadsheet')) return FileSpreadsheet
  if (type.includes('presentation')) return Presentation
  const icons = { image: Image, video: Film, audio: Music, pdf: FileText, text: FileText, office: FileText }
  return icons[mediaKind(type)]
}

export const isVisual = (attachment: Attachment) =>
  ['image', 'video'].includes(mediaKind(attachment.contentType))
