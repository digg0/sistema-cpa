import { apiClient } from './client'

export interface QuestionarioResumo {
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

export async function listQuestionarios(signal?: AbortSignal): Promise<QuestionarioResumo[]> {
  return apiClient.get<QuestionarioResumo[]>('/api/v1/questionarios', { signal })
}
