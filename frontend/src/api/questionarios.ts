import { apiClient } from './client'
import type { TipoPergunta } from '../data/mock'

export interface PerguntaDetalheApi {
  id: string
  texto: string
  tipo: TipoPergunta
  obrigatoria: boolean
  opcoes: string[] | null
  dimensao: string | null
  ordem: number
  perfisAlvo: string[]
}

export interface QuestionarioApi {
  id: string
  nome: string
  categoria: string
  perguntas: number
  versao: number
  status: 'Publicado' | 'Rascunho'
  criador: string
  atualizado: string
  usos: number
  locked: boolean
}

export interface QuestionarioDetalheApi extends QuestionarioApi {
  itens: PerguntaDetalheApi[]
}

interface QuestionOut {
  id: string
  texto: string
  tipo: TipoPergunta
  obrigatoria: boolean
  opcoes: string[] | null
  dimensao: string | null
  ordem: number
  perfis_alvo: string[]
}

interface QuestionnaireSummaryOut {
  id: string
  nome: string
  categoria: string
  perguntas: number
  versao: number
  status: 'Publicado' | 'Rascunho'
  criador: string
  atualizado: string
  usos: number
  locked: boolean
}

interface QuestionnaireDetailOut extends QuestionnaireSummaryOut {
  itens: QuestionOut[]
}

function mapQuestionario(data: QuestionnaireSummaryOut): QuestionarioApi {
  return {
    id: data.id,
    nome: data.nome,
    categoria: data.categoria,
    perguntas: data.perguntas,
    versao: data.versao,
    status: data.status,
    criador: data.criador,
    atualizado: data.atualizado,
    usos: data.usos,
    locked: data.locked,
  }
}

function mapPergunta(data: QuestionOut): PerguntaDetalheApi {
  return {
    id: data.id,
    texto: data.texto,
    tipo: data.tipo,
    obrigatoria: data.obrigatoria,
    opcoes: data.opcoes,
    dimensao: data.dimensao,
    ordem: data.ordem,
    perfisAlvo: data.perfis_alvo,
  }
}

export async function listarQuestionarios(signal?: AbortSignal): Promise<QuestionarioApi[]> {
  const data = await apiClient.get<QuestionnaireSummaryOut[]>('/api/v1/questionarios', { signal })
  return data.map(mapQuestionario)
}

export async function obterQuestionario(id: string, signal?: AbortSignal): Promise<QuestionarioDetalheApi> {
  const data = await apiClient.get<QuestionnaireDetailOut>(`/api/v1/questionarios/${id}`, { signal })
  return { ...mapQuestionario(data), itens: data.itens.map(mapPergunta) }
}

export async function duplicarQuestionario(id: string, signal?: AbortSignal): Promise<QuestionarioApi> {
  const data = await apiClient.post<QuestionnaireDetailOut>(`/api/v1/questionarios/${id}/duplicar`, undefined, { signal })
  return mapQuestionario(data)
}
