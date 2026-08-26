import type { Perfil } from '../data/mock'
import { createSession, type AuthSession } from './session'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

interface LoginResponse {
  access_token: string
  token_type: string
  nome: string
  perfil: Perfil
}

interface CurrentUserResponse {
  id: string
  nome: string
  perfil: Perfil
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback

  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.trim()) return detail

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

async function readJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function loginWithApi(
  identificador: string,
  senha: string,
  perfil: Perfil,
  signal?: AbortSignal,
): Promise<AuthSession> {
  let response: Response

  try {
    response = await fetch(apiUrl('/api/v1/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador: identificador.trim(), senha, perfil }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível conectar ao servidor. Tente novamente em instantes.', 0)
  }

  const body = await readJsonSafely(response)
  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(body, 'Não foi possível realizar o login.'),
      response.status,
    )
  }

  const data = body as LoginResponse
  if (!data?.access_token || !data.nome || !data.perfil) {
    throw new ApiError('Resposta de autenticação inválida recebida do servidor.', response.status)
  }

  return createSession(data.access_token, data.nome, data.perfil)
}

export async function getCurrentUser(accessToken: string, signal?: AbortSignal): Promise<CurrentUserResponse> {
  let response: Response

  try {
    response = await fetch(apiUrl('/api/v1/auth/me'), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Não foi possível validar a sessão no servidor.', 0)
  }

  const body = await readJsonSafely(response)
  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(body, 'Sessão inválida ou expirada.'),
      response.status,
    )
  }

  return body as CurrentUserResponse
}
