import { apiClient } from './client'
import { isoToBr } from '../utils/date'

export interface HistoricoItemApi {
  sem: string
  participacao: number
  satisfacao: number
}

export interface ParticipacaoPerfilApi {
  perfil: string
  valor: number
}

export interface SatisfacaoItemApi {
  label: string
  pct: number
  n: number
  cor: string
}

export interface CampanhaResumoApi {
  id: string
  nome: string
  publico: string
  inicio: string
  fim: string
  participacao: number
  status: 'Ativa' | 'Agendada' | 'Encerrada'
}

export interface DashboardApi {
  campanhas: CampanhaResumoApi[]
  historico: HistoricoItemApi[]
  participacaoPorPerfil: ParticipacaoPerfilApi[]
  satisfacao: SatisfacaoItemApi[]
  mediaGeral: number
  satisfacaoGeral: number
  totalRespostas: number
}

interface CampaignOut {
  id: string
  nome: string
  publico: string
  inicio: string
  fim: string
  participacao: number
  status: 'Ativa' | 'Agendada' | 'Encerrada'
  [key: string]: unknown
}

interface DashboardOut {
  campanhas: CampaignOut[]
  historico: HistoricoItemApi[]
  participacao_por_perfil: ParticipacaoPerfilApi[]
  satisfacao: SatisfacaoItemApi[]
  media_geral: number
  satisfacao_geral: number
  total_respostas: number
}

export async function obterDashboard(signal?: AbortSignal): Promise<DashboardApi> {
  const data = await apiClient.get<DashboardOut>('/api/v1/dashboard', { signal })
  return {
    campanhas: data.campanhas.map(campanha => ({
      id: campanha.id,
      nome: campanha.nome,
      publico: campanha.publico,
      inicio: isoToBr(campanha.inicio),
      fim: isoToBr(campanha.fim),
      participacao: campanha.participacao,
      status: campanha.status,
    })),
    historico: data.historico,
    participacaoPorPerfil: data.participacao_por_perfil,
    satisfacao: data.satisfacao,
    mediaGeral: data.media_geral,
    satisfacaoGeral: data.satisfacao_geral,
    totalRespostas: data.total_respostas,
  }
}
