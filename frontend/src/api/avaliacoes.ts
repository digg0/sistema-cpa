import { apiClient } from './client'
import type { Perfil, StatusCampanha, TipoPergunta } from '../data/mock'
import { isoToBr } from '../utils/date'

export interface PerguntaApi {
  id: string
  texto: string
  tipo: TipoPergunta
  obrigatoria: boolean
  opcoes?: string[] | null
  dimensao?: string | null
  ordem: number
}

interface AvaliacaoRaw {
  id: string
  titulo: string
  descricao: string
  inicio: string
  fim: string
  perguntas: PerguntaApi[]
  publico: Perfil
  categoria: string
  status: StatusCampanha
  respondida_em: string | null
}

export type StatusAcessoAvaliacao =
  | 'AVAILABLE'
  | 'SCHEDULED'
  | 'CLOSED'
  | 'ALREADY_ANSWERED'
  | 'NO_QUESTIONS'

interface AvaliacaoDiretaRaw extends AvaliacaoRaw {
  access_status: StatusAcessoAvaliacao
}

/** Formato já pronto pro que as telas existentes (MinhasAvaliacoes,
 * AvaliacoesRespondidas) esperam: datas em DD/MM/AAAA, respondidaEm já formatada. */
export interface Avaliacao {
  id: string
  titulo: string
  descricao: string
  inicio: string
  fim: string
  perguntas: PerguntaApi[]
  publico: Perfil
  categoria: string
  status: StatusCampanha
  respondidaEm: string | null
}

export interface AvaliacaoDireta extends Avaliacao {
  accessStatus: StatusAcessoAvaliacao
}

function mapAvaliacao(raw: AvaliacaoRaw): Avaliacao {
  return {
    id: raw.id,
    titulo: raw.titulo,
    descricao: raw.descricao,
    inicio: isoToBr(raw.inicio),
    fim: isoToBr(raw.fim),
    perguntas: raw.perguntas,
    publico: raw.publico,
    categoria: raw.categoria,
    status: raw.status,
    respondidaEm: raw.respondida_em ? isoToBr(raw.respondida_em.slice(0, 10)) : null,
  }
}

export async function listAvaliacoes(signal?: AbortSignal): Promise<Avaliacao[]> {
  const raw = await apiClient.get<AvaliacaoRaw[]>('/api/v1/avaliacoes', { signal })
  return raw.map(mapAvaliacao)
}

export async function getAvaliacao(avaliacaoId: string, signal?: AbortSignal): Promise<AvaliacaoDireta> {
  const raw = await apiClient.get<AvaliacaoDiretaRaw>(`/api/v1/avaliacoes/${avaliacaoId}`, { signal })
  return { ...mapAvaliacao(raw), accessStatus: raw.access_status }
}

export async function enviarRespostas(
  avaliacaoId: string,
  respostas: Record<string, string>,
): Promise<void> {
  await apiClient.post(`/api/v1/avaliacoes/${avaliacaoId}/respostas`, {
    respostas: Object.entries(respostas).map(([pergunta_id, valor]) => ({ pergunta_id, valor })),
  })
}
