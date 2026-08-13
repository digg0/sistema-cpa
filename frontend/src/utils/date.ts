import type { StatusCampanha } from '../data/mock'

export function parseBrDate(value: string) {
  const [dia, mes, ano] = value.split('/').map(Number)
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0)
}

export function statusPorPeriodo(inicio: string, fim: string, agora = new Date()): StatusCampanha {
  const start = parseBrDate(inicio)
  const end = parseBrDate(fim)
  const today = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12, 0, 0, 0)
  if (today < start) return 'Agendada'
  if (today > end) return 'Encerrada'
  return 'Ativa'
}

export function diasAte(data: string, agora = new Date()) {
  const target = parseBrDate(data)
  const today = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}
