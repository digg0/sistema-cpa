import { apiClient } from './client'

export type FormatoRelatorioApi = 'PDF' | 'CSV'

export interface RelatorioApi {
  id: string
  titulo: string
  tipo: string
  formato: FormatoRelatorioApi
  autor: string
  gerado: string
  campaignId: string | null
}

export interface CriarRelatorioInput {
  titulo: string
  tipo: string
  formato: FormatoRelatorioApi
}

interface ReportOut {
  id: string
  titulo: string
  tipo: string
  formato: FormatoRelatorioApi
  autor: string
  gerado: string
  campaign_id: string | null
}

function mapRelatorio(data: ReportOut): RelatorioApi {
  return {
    id: data.id,
    titulo: data.titulo,
    tipo: data.tipo,
    formato: data.formato,
    autor: data.autor,
    gerado: data.gerado,
    campaignId: data.campaign_id,
  }
}

export async function listarRelatorios(signal?: AbortSignal): Promise<RelatorioApi[]> {
  const data = await apiClient.get<ReportOut[]>('/api/v1/relatorios', { signal })
  return data.map(mapRelatorio)
}

export async function criarRelatorio(
  input: CriarRelatorioInput,
  signal?: AbortSignal,
): Promise<RelatorioApi> {
  const created = await apiClient.post<ReportOut>(
    '/api/v1/relatorios',
    {
      titulo: input.titulo.trim(),
      tipo: input.tipo,
      formato: input.formato,
    },
    { signal },
  )
  return mapRelatorio(created)
}

export async function baixarRelatorio(
  reportId: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  return apiClient.getBlob(`/api/v1/relatorios/${reportId}/download`, { signal })
}

export function formatarGerado(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
