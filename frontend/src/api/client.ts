import { loadSession } from '../auth/session'

// Mesma resolução de `auth/api.ts`: vazio em dev (usa o proxy do Vite, ver
// vite.config.ts) e em produção (nginx já proxia /api/ pro backend, ver
// frontend/nginx.conf) — só é preenchida quando o ambiente define explicitamente
// (ex.: docker-compose.dev.yml). Nunca cair num fallback fixo tipo
// 'http://localhost:8000': isso quebraria em produção, onde essa variável é
// deixada vazia de propósito.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export interface ApiError {
  detail: string
  code?: string
}

export class ApiException extends Error {
  public code?: string
  public status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = 'ApiException'
  }
}

function currentToken(): string | null {
  // A sessão vive em sessionStorage (auth/session.ts), nunca em localStorage —
  // decisão de segurança deliberada (ver docs/02-plano-execucao.md, tarefa C2).
  return loadSession()?.accessToken ?? null
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback

  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return detail

  // Erros de validação do FastAPI/Pydantic vêm como lista de objetos, não string.
  if (Array.isArray(detail)) {
    const messages = detail
      .map(item => {
        if (!item || typeof item !== 'object') return null
        const message = (item as { msg?: unknown }).msg
        return typeof message === 'string' ? message : null
      })
      .filter((item): item is string => Boolean(item))

    if (messages.length > 0) return messages.join(' ')
  }

  return fallback
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const token = currentToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiException('Não foi possível conectar ao servidor. Tente novamente em instantes.', 0)
  }

  if (!response.ok) {
    let body: unknown = null
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      try {
        body = await response.json()
      } catch {
        body = null
      }
    }
    const code = body && typeof body === 'object' ? (body as { code?: string }).code : undefined
    throw new ApiException(
      extractErrorMessage(body, response.statusText || 'Erro desconhecido na API'),
      response.status,
      code,
    )
  }

  if (response.status === 204) {
    return null as T
  }
  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
}
