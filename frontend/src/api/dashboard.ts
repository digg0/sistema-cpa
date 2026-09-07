import { mapCampanha, type CampanhaApi } from './campanhas'
import { apiClient } from './client'

export interface HistoricoItemApi {
  sem: string
  participacao: number
  satisfacao: number
}

export interface ParticipacaoPerfilApi {
  perfil: string
  valor: number
  cor: string
  fundo: string
  label: string
}

export interface SatisfacaoItemApi {
  label: string
  pct: number
  n: number
  cor: string
}

export interface DashboardApi {
  campanhas: CampanhaApi[]
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
  tipo: string
  descricao: string
  inicio: string
  fim: string
  participacao: number
  respostas: number
  publico: string
  publico_perfis: string[]
  questionario: string
  questionario_id: string
  status: CampanhaApi['status']
  categoria: string
}

interface DashboardOut {
  campanhas: CampaignOut[]
  historico: HistoricoItemApi[]
  participacao_por_perfil: { perfil: string; valor: number }[]
  satisfacao: SatisfacaoItemApi[]
  media_geral: number
  satisfacao_geral: number
  total_respostas: number
}

const PERFIL_ESTILO: Record<string, { cor: string; fundo: string; label: string }> = {
  Docente: { cor: '#2A7A3B', fundo: '#EAF4EC', label: 'Docentes' },
  Discente: { cor: '#2563EB', fundo: '#DBEAFE', label: 'Discentes' },
  Técnico: { cor: '#7C3AED', fundo: '#EDE9FE', label: 'Técnicos' },
}

function estiloPerfil(perfil: string) {
  return PERFIL_ESTILO[perfil] ?? { cor: '#475569', fundo: '#F1F5F9', label: perfil }
}

export async function obterDashboard(signal?: AbortSignal): Promise<DashboardApi> {
  const data = await apiClient.get<DashboardOut>('/api/v1/dashboard', { signal })
  return {
    campanhas: data.campanhas.map(mapCampanha),
    historico: data.historico,
    participacaoPorPerfil: data.participacao_por_perfil.map(item => ({
      ...item,
      ...estiloPerfil(item.perfil),
    })),
    satisfacao: data.satisfacao,
    mediaGeral: data.media_geral,
    satisfacaoGeral: data.satisfacao_geral,
    totalRespostas: data.total_respostas,
  }
}
