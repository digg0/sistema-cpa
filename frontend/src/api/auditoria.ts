import { apiClient } from './client'

export interface LogAuditoriaApi {
  id: string
  timestamp: string
  atorId: string | null
  atorPerfil: string
  acao: string
  recurso: string
  recursoId: string
  resultado: string
  detalhes: Record<string, unknown>
}

export interface FiltroAuditoria {
  inicio?: string
  fim?: string
  acao?: string
  recurso?: string
  limit?: number
  offset?: number
}

interface AuditLogOut {
  id: string
  timestamp: string
  ator_id: string | null
  ator_perfil: string
  acao: string
  recurso: string
  recurso_id: string
  resultado: string
  detalhes: Record<string, unknown>
}

function mapLog(data: AuditLogOut): LogAuditoriaApi {
  return {
    id: data.id,
    timestamp: data.timestamp,
    atorId: data.ator_id,
    atorPerfil: data.ator_perfil,
    acao: data.acao,
    recurso: data.recurso,
    recursoId: data.recurso_id,
    resultado: data.resultado,
    detalhes: data.detalhes ?? {},
  }
}

export async function listarAuditoria(
  filtro: FiltroAuditoria = {},
  signal?: AbortSignal,
): Promise<LogAuditoriaApi[]> {
  const params = new URLSearchParams()
  if (filtro.inicio) params.set('inicio', filtro.inicio)
  if (filtro.fim) params.set('fim', filtro.fim)
  if (filtro.acao) params.set('acao', filtro.acao)
  if (filtro.recurso) params.set('recurso', filtro.recurso)
  params.set('limit', String(filtro.limit ?? 100))
  params.set('offset', String(filtro.offset ?? 0))

  const data = await apiClient.get<AuditLogOut[]>(`/api/v1/auditoria?${params}`, { signal })
  return data.map(mapLog)
}

export function formatarTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
