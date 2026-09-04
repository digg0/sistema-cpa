import { apiClient } from './client'
import type { Campanha, PerfilParticipante, StatusCampanha } from '../data/mock'
import { isoToBr } from '../utils/date'

interface CampanhaRaw {
  id: string
  nome: string
  tipo: string
  descricao: string
  inicio: string
  fim: string
  participacao: number
  respostas: number
  publico: string
  publico_perfis: PerfilParticipante[]
  questionario: string
  questionario_id: string
  status: StatusCampanha
  categoria: string
}

export interface CriarCampanhaInput {
  nome: string
  tipo: string
  descricao: string
  publico: PerfilParticipante[]
  questionario_id: string
  inicio: string
  fim: string
}

function mapCampanha(raw: CampanhaRaw): Campanha {
  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo,
    descricao: raw.descricao,
    inicio: isoToBr(raw.inicio),
    fim: isoToBr(raw.fim),
    participacao: raw.participacao,
    respostas: raw.respostas,
    publico: raw.publico,
    publicoPerfis: raw.publico_perfis,
    questionario: raw.questionario,
    questionarioId: raw.questionario_id,
    status: raw.status,
    categoria: raw.categoria,
  }
}

export async function listCampanhas(signal?: AbortSignal): Promise<Campanha[]> {
  const response = await apiClient.get<CampanhaRaw[]>('/api/v1/campanhas', { signal })
  return response.map(mapCampanha)
}

export async function createCampanha(input: CriarCampanhaInput): Promise<Campanha> {
  const response = await apiClient.post<CampanhaRaw>('/api/v1/campanhas', input)
  return mapCampanha(response)
}
