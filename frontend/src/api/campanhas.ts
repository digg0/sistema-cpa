import { ApiException, apiClient } from './client'
import { isoToBr } from '../utils/date'

export type StatusCampanhaApi = 'Ativa' | 'Agendada' | 'Encerrada'

export interface CampanhaApi {
  id: string
  nome: string
  tipo: string
  descricao: string
  inicio: string
  fim: string
  participacao: number
  respostas: number
  publico: string
  publicoPerfis: string[]
  questionario: string
  questionarioId: string
  status: StatusCampanhaApi
  categoria: string
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
  status: StatusCampanhaApi
  categoria: string
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

export interface CriarCampanhaInput {
  nome: string
  inicio: string
  fim: string
}

function mapCampanha(data: CampaignOut): CampanhaApi {
  return {
    id: data.id,
    nome: data.nome,
    tipo: data.tipo,
    descricao: data.descricao,
    inicio: isoToBr(data.inicio),
    fim: isoToBr(data.fim),
    participacao: data.participacao,
    respostas: data.respostas,
    publico: data.publico,
    publicoPerfis: data.publico_perfis,
    questionario: data.questionario,
    questionarioId: data.questionario_id,
    status: data.status,
    categoria: data.categoria,
  }
}

export async function listarCampanhas(
  signal?: AbortSignal,
): Promise<CampanhaApi[]> {
  const campanhas = await apiClient.get<CampaignOut[]>(
    '/api/v1/campanhas',
    { signal },
  )

  return campanhas.map(mapCampanha)
}

async function encontrarQuestionarioOficial(
  signal?: AbortSignal,
): Promise<QuestionnaireSummaryOut> {
  const questionarios = await apiClient.get<QuestionnaireSummaryOut[]>(
    '/api/v1/questionarios',
    { signal },
  )

  const publicados = questionarios.filter(
    questionario => questionario.status === 'Publicado',
  )

  if (publicados.length === 0) {
    throw new ApiException(
      'Nenhum questionário publicado foi encontrado. Não é possível criar a campanha.',
      422,
      'QUESTIONARIO_PUBLICADO_NAO_ENCONTRADO',
    )
  }

  const prefixoOficial = 'autoavaliação institucional cpa'

  const oficial = publicados.find(questionario =>
    questionario.nome
      .trim()
      .toLocaleLowerCase('pt-BR')
      .startsWith(prefixoOficial),
  )

  return oficial ?? publicados[0]
}

export async function criarCampanha(
  input: CriarCampanhaInput,
  signal?: AbortSignal,
): Promise<CampanhaApi> {
  const questionario = await encontrarQuestionarioOficial(signal)

  const criada = await apiClient.post<CampaignOut>(
    '/api/v1/campanhas',
    {
      nome: input.nome.trim(),
      questionario_id: questionario.id,
      inicio: input.inicio,
      fim: input.fim,
    },
    { signal },
  )

  return mapCampanha(criada)
}