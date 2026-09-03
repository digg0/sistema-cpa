import { apiClient } from './client'

export interface DimensaoApi {
  nome: string
  media: number
  anterior: number
}

export interface DistribuicaoItemApi {
  label: string
  pct: number
  n: number
  cor: string
}

export interface QuestaoCriticaApi {
  questao: string
  media: number
  respostas: number
}

export interface ResultadosApi {
  totalRespostas: number
  participacao: number
  mediaGeral: number
  satisfacao: number
  dimensoes: DimensaoApi[]
  distribuicao: DistribuicaoItemApi[]
  questoesCriticas: QuestaoCriticaApi[]
}

interface CampaignOut {
  publico_perfis: string[]
  [key: string]: unknown
}

interface ResultsOut {
  campanha: CampaignOut
  total_respostas: number
  participacao: number
  media_geral: number
  satisfacao: number
  dimensoes: DimensaoApi[]
  distribuicao: DistribuicaoItemApi[]
  questoes_criticas: QuestaoCriticaApi[]
}

export async function obterResultados(campanhaId: string, signal?: AbortSignal): Promise<ResultadosApi> {
  const data = await apiClient.get<ResultsOut>(`/api/v1/campanhas/${campanhaId}/resultados`, { signal })
  return {
    totalRespostas: data.total_respostas,
    participacao: data.participacao,
    mediaGeral: data.media_geral,
    satisfacao: data.satisfacao,
    dimensoes: data.dimensoes,
    distribuicao: data.distribuicao,
    questoesCriticas: data.questoes_criticas,
  }
}
