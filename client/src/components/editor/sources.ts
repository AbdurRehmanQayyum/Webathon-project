import { api } from '@/services/api-client'
import type { SuggestionItem } from './SuggestionList'

export async function userSuggestions(query: string): Promise<SuggestionItem[]> {
  const users = await api.get<{ username: string; fullName: string }[]>('/api/users/search', {
    search: query,
  })
  return users.map((user) => ({
    id: user.username,
    title: user.fullName,
    detail: `@${user.username}`,
  }))
}

export async function tagSuggestions(query: string): Promise<SuggestionItem[]> {
  const tags = await api.get<{ name: string; postCount: number }[]>('/api/tags', { search: query })
  const typed = query.toLowerCase()
  const items = tags.map((tag) => ({
    id: tag.name,
    title: `#${tag.name}`,
    detail: `${tag.postCount} posts`,
  }))

  // A new tag can be created by typing it
  return /^[a-z][a-z0-9_-]{1,29}$/.test(typed) && !tags.some((tag) => tag.name === typed)
    ? [...items, { id: typed, title: `#${typed}`, detail: 'New tag' }]
    : items
}
