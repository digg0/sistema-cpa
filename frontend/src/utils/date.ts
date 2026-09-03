import type { StatusCampanha } from '../data/mock'

/** Converte data ISO (`AAAA-MM-DD`, formato que a API sempre devolve) pro formato
 * `DD/MM/AAAA` que o resto da tela (statusPorPeriodo, diasAte) já sabe interpretar. */
export function isoToBr(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

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
