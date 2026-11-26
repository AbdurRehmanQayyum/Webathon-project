import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// List filters live in the URL so they survive reloads and can be shared
export function useListParams() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(Number(params.get('page')) || 1, 1)

  const get = useCallback((key: string) => params.get(key) ?? '', [params])

  const set = useCallback(
    (changes: Record<string, string | number | null>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (!('page' in changes)) next.delete('page')
          Object.entries(changes).forEach(([key, value]) => {
            if (value === null || value === '' || (key === 'page' && value === 1)) next.delete(key)
            else next.set(key, String(value))
          })
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { page, get, set }
}
