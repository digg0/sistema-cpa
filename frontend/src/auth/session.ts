import type { Perfil } from '../data/mock'

const STORAGE_KEY = 'cpa.auth.session'
const EXPIRATION_SKEW_MS = 5_000

export interface AuthSession {
  accessToken: string
  nome: string
  perfil: Perfil
  expiresAt: number
}

interface JwtPayload {
  exp?: number
  nome?: string
  perfil?: Perfil
  sub?: string
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = window.atob(padded)
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(decodeBase64Url(payload)) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token)
  return typeof payload?.exp === 'number' ? payload.exp * 1000 : null
}

export function isSessionValid(session: AuthSession | null): session is AuthSession {
  if (!session?.accessToken || !session.nome || !session.perfil) return false
  return session.expiresAt > Date.now() + EXPIRATION_SKEW_MS
}

export function createSession(accessToken: string, nome: string, perfil: Perfil): AuthSession {
  const expiresAt = getTokenExpiration(accessToken)
  if (!expiresAt) {
    throw new Error('Token de autenticação inválido: expiração ausente.')
  }
  return { accessToken, nome, perfil, expiresAt }
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (!isSessionValid(session)) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
