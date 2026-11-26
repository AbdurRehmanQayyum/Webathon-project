import { Link } from 'react-router'
import { tagSearchPath } from './tag-path'

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null

  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            to={tagSearchPath(tag)}
            className="inline-block rounded bg-surface-alt px-2 py-0.5 text-xs font-medium text-link hover:bg-selected"
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}
