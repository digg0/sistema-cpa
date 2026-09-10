import { useCallback, useEffect, useState } from 'react'
import { Card, CardHead, EmptyState, GREEN, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { ApiException } from '../api/client'
import { formatarTimestamp, listarAuditoria, type LogAuditoriaApi } from '../api/auditoria'

const ACOES = ['criar', 'editar', 'duplicar', 'gerar', 'baixar', 'login', 'logout']
const RECURSOS = ['questionario', 'campanha', 'relatorio', 'sessao']

const RESULTADO_ESTILO: Record<string, { bg: string; text: string }> = {
  sucesso: { bg: '#DCFCE7', text: '#166534' },
  falha: { bg: '#FEE2E2', text: '#991B1B' },
  bloqueado: { bg: '#FEF3C7', text: '#92400E' },
}

function ResultadoBadge({ resultado }: { resultado: string }) {
  const estilo = RESULTADO_ESTILO[resultado] ?? { bg: '#F1F5F9', text: '#64748B' }
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={{ background: estilo.bg, color: estilo.text }}>
      {resultado}
    </span>
  )
}

function Detalhes({ detalhes }: { detalhes: Record<string, unknown> }) {
  const entradas = Object.entries(detalhes)
  if (entradas.length === 0) return <span className="text-xs text-slate-300">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {entradas.map(([chave, valor]) => (
        <span key={chave} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
          {chave}: {valor === null || valor === undefined ? '—' : String(valor)}
        </span>
      ))}
    </div>
  )
}

export default function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoriaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [acao, setAcao] = useState('')
  const [recurso, setRecurso] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  const carregar = useCallback((signal?: AbortSignal) => {
    setLoading(true)
    setErro('')
    return listarAuditoria(
      {
        acao: acao || undefined,
        recurso: recurso || undefined,
        inicio: inicio || undefined,
        fim: fim || undefined,
        limit: 200,
      },
      signal,
    )
      .then(setLogs)
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErro(error instanceof ApiException ? error.message : 'Não foi possível carregar os registros de auditoria.')
      })
      .finally(() => setLoading(false))
  }, [acao, recurso, inicio, fim])

  useEffect(() => {
    const controller = new AbortController()
    carregar(controller.signal)
    return () => controller.abort()
  }, [carregar])

  function limparFiltros() {
    setAcao('')
    setRecurso('')
    setInicio('')
    setFim('')
  }

  const temFiltro = Boolean(acao || recurso || inicio || fim)

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Rastreabilidade</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Logs de Auditoria</h1>
          <p className="text-sm text-slate-500 mt-1">Registro das ações administrativas e de acesso ao sistema.</p>
        </div>
        <SecondaryButton onClick={() => carregar()} disabled={loading}>
          {Icons.arrow({ width: 16, height: 16 })} Atualizar
        </SecondaryButton>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 mb-5 flex gap-3 text-sm text-blue-900">
        <span className="mt-0.5">{Icons.shield({ width: 18, height: 18 })}</span>
        <p>O conteúdo das respostas <strong>nunca</strong> é registrado aqui. A trilha guarda apenas quem executou qual ação, sobre qual recurso e quando.</p>
      </div>

      <Card className="mb-5">
        <CardHead title="Filtros" sub="Combine período, ação e recurso para reduzir a lista" />
        <div className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label htmlFor="filtro-inicio" className="text-xs font-semibold text-slate-600">De</label>
            <input id="filtro-inicio" type="date" value={inicio} onChange={event => setInicio(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700" />
          </div>
          <div>
            <label htmlFor="filtro-fim" className="text-xs font-semibold text-slate-600">Até</label>
            <input id="filtro-fim" type="date" value={fim} onChange={event => setFim(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700" />
          </div>
          <div>
            <label htmlFor="filtro-acao" className="text-xs font-semibold text-slate-600">Ação</label>
            <select id="filtro-acao" value={acao} onChange={event => setAcao(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="">Todas</option>
              {ACOES.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-recurso" className="text-xs font-semibold text-slate-600">Recurso</label>
            <select id="filtro-recurso" value={recurso} onChange={event => setRecurso(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="">Todos</option>
              {RECURSOS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <SecondaryButton onClick={limparFiltros} disabled={!temFiltro}>Limpar</SecondaryButton>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Registros"
          sub={loading ? 'Carregando…' : `${logs.length} evento${logs.length === 1 ? '' : 's'} no período`}
        />

        {loading && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-slate-200 border-t-green-700 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Carregando registros…</p>
          </div>
        )}

        {!loading && erro && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>
        )}

        {!loading && !erro && logs.length === 0 && (
          <EmptyState title="Nenhum registro encontrado" text="Ajuste os filtros ou aguarde novas ações no sistema." />
        )}

        {!loading && !erro && logs.length > 0 && (
          <div className="responsive-table">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Data e hora', 'Perfil', 'Ação', 'Recurso', 'Resultado', 'Detalhes'].map(header => (
                    <th key={header} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/70 align-top">
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap tabular-nums">{formatarTimestamp(log.timestamp)}</td>
                    <td className="px-5 py-4 text-xs text-slate-600">{log.atorPerfil}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800 capitalize">{log.acao}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      <span className="capitalize">{log.recurso}</span>
                      <span className="block text-[11px] text-slate-300 truncate max-w-[220px]" title={log.recursoId}>{log.recursoId}</span>
                    </td>
                    <td className="px-5 py-4"><ResultadoBadge resultado={log.resultado} /></td>
                    <td className="px-5 py-4"><Detalhes detalhes={log.detalhes} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
