import { apiClient, apiDownload } from './client'
import { isoToBr } from '../utils/date'

export interface RelatorioApi {
  id: string
  titulo: string
  tipo: string
  formato: 'PDF' | 'CSV'
  autor: string
  gerado: string
  campanhaId: string | null
}

export interface GerarRelatorioInput {
  titulo: string
  tipo: string
  formato: 'PDF' | 'CSV'
  campanhaId?: string
}

interface ReportOut {
  id: string
  titulo: string
  tipo: string
  formato: 'PDF' | 'CSV'
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
    gerado: isoToBr(data.gerado.slice(0, 10)),
    campanhaId: data.campaign_id,
  }
}

export async function listarRelatorios(signal?: AbortSignal): Promise<RelatorioApi[]> {
  const data = await apiClient.get<ReportOut[]>('/api/v1/relatorios', { signal })
  return data.map(mapRelatorio)
}

export async function gerarRelatorio(input: GerarRelatorioInput, signal?: AbortSignal): Promise<RelatorioApi> {
  const data = await apiClient.post<ReportOut>(
    '/api/v1/relatorios',
    { titulo: input.titulo, tipo: input.tipo, formato: input.formato, campaign_id: input.campanhaId },
    { signal },
  )
  return mapRelatorio(data)
}

/** Baixa o relatório de verdade (conteúdo real vindo do backend) e dispara o
 * download no navegador — substitui o blob fabricado no cliente que existia
 * no protótipo. */
export async function baixarRelatorio(id: string, tituloFallback: string): Promise<void> {
  const { blob, filename } = await apiDownload(`/api/v1/relatorios/${id}/download`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `${tituloFallback.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`
  a.click()
  URL.revokeObjectURL(url)
}
