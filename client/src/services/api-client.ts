import type { Attachment } from '@/types/common'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const CSRF_HEADER = 'X-CSRF-TOKEN'
const CSRF_ERROR = 'invalid_csrf_token'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isNetworkError() {
    return this.status === 0
  }
}

interface Problem {
  title?: string
  code?: string
  errors?: Record<string, string[]>
}

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

let csrfToken: string | null = null
const unauthorizedListeners = new Set<() => void>()

// Tokens are bound to the signed-in identity
export function resetCsrfToken() {
  csrfToken = null
}

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener)
  return () => {
    unauthorizedListeners.delete(listener)
  }
}

function buildUrl(path: string, query?: QueryParams) {
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const search = params.toString()
  return `${BASE_URL}${path}${search ? `?${search}` : ''}`
}

function networkError() {
  return new ApiError(
    0,
    navigator.onLine
      ? 'The server could not be reached. Try again.'
      : 'You are offline. Reconnect to continue.',
  )
}

// Readable fallbacks for responses that carry no explanation of their own
const statusMessages: Record<number, string> = {
  400: 'Check the details and try again.',
  401: 'Sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'This item is no longer available.',
  409: 'This conflicts with a recent change. Refresh and try again.',
  413: 'That upload is larger than the server accepts.',
  429: 'Too many requests. Wait a minute and try again.',
  500: 'Something went wrong on our side. Try again shortly.',
  502: 'The server is temporarily unreachable.',
  503: 'This service is unavailable right now.',
}

function toApiError(status: number, problem: Problem) {
  const fieldErrors = Object.fromEntries(
    Object.entries(problem.errors ?? {}).map(([field, messages]) => [field, messages[0] ?? '']),
  )
  const hasOwnTitle = problem.title && !['Forbidden', 'Unauthorized'].includes(problem.title)
  const message =
    Object.values(fieldErrors)[0] ??
    (hasOwnTitle ? problem.title : statusMessages[status]) ??
    'The request failed.'
  return new ApiError(status, message ?? 'The request failed.', fieldErrors)
}

async function send(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, credentials: 'include' })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw networkError()
  }
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  const response = await send(buildUrl('/api/auth/csrf'), {})
  if (!response.ok) throw toApiError(response.status, {})
  const body = (await response.json()) as { token: string }
  csrfToken = body.token
  return csrfToken
}

interface RequestOptions {
  body?: unknown
  query?: QueryParams
  signal?: AbortSignal
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') headers[CSRF_HEADER] = await getCsrfToken()

  const response = await send(buildUrl(path, options.query), {
    method,
    headers,
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as Problem
    if (problem.code === CSRF_ERROR && !isRetry) {
      resetCsrfToken()
      return request<T>(method, path, options, true)
    }
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      unauthorizedListeners.forEach((listener) => listener())
    }
    throw toApiError(response.status, problem)
  }

  const isEmpty = response.status === 204 || response.headers.get('content-length') === '0'
  return (isEmpty ? undefined : await response.json()) as T
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T = undefined>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T = undefined>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: (path: string) => request<undefined>('DELETE', path),
}

export const fileUrl = (fileId: number) => `${BASE_URL}/api/files/${fileId}`
export const downloadUrl = (fileId: number) => `${fileUrl(fileId)}?download=true`

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

// XMLHttpRequest provides upload progress and cancellation
export async function uploadFile(
  path: string,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<Attachment> {
  const token = await getCsrfToken()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.open('POST', buildUrl(path))
    xhr.withCredentials = true
    xhr.setRequestHeader(CSRF_HEADER, token)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      const body = parseJson(xhr.responseText)
      if (xhr.status === 201) resolve(body as Attachment)
      else reject(toApiError(xhr.status, body as Problem))
    }
    xhr.onerror = () => reject(networkError())
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))
    signal.addEventListener('abort', () => xhr.abort(), { once: true })
    if (signal.aborted) reject(new DOMException('Upload cancelled', 'AbortError'))
    else xhr.send(form)
  })
}
