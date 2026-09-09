import { useEffect, useState } from 'react'
import { Card, CardHead, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { ApiException } from '../api/client'
import { obterDashboard, type HistoricoItemApi } from '../api/dashboard'
import {
  baixarRelatorio,
  criarRelatorio,
  formatarGerado,
  listarRelatorios,
  type CriarRelatorioInput,
  type RelatorioApi,
} from '../api/relatorios'

function Trend({ title, values, labels, color, suffix = '%' }: { title: string; values: number[]; labels: string[]; color: string; suffix?: string }) {
  if (values.length === 0) {
    return <Card className="p-5"><p className="text-sm font-bold text-slate-800">{title}</p><p className="text-sm text-slate-400 mt-4">Sem série histórica.</p></Card>
  }
  const W = 360, H = 110, pad = 16
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 2
  const span = Math.max(values.length - 1, 1)
  const range = max - min || 1
  const pts = values.map((value, i) => ({
    x: pad + i * ((W - pad * 2) / span),
    y: pad + (max - value) * ((H - pad * 2) / range),
    v: value,
  }))
  const path = pts.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ')
  const last = values[values.length - 1]
  const previous = values.length > 1 ? values[values.length - 2] : null
  const delta = previous === null ? null : last - previous
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">evolução semestral</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color }}>{last.toFixed(1).replace('.', ',')}{suffix}</p>
          {delta !== null && (
            <p className={`text-[11px] font-semibold ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1).replace('.', ',')} p.p.
            </p>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[125px]">
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((point, i) => <circle key={labels[i] ?? i} cx={point.x} cy={point.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? color : 'white'} stroke={color} strokeWidth="2"/>)}
        {labels.map((label, i) => <text key={label} x={pts[i].x} y={H - 1} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{label}</text>)}
      </svg>
    </Card>
  )
}

function GerarModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (input: CriarRelatorioInput) => Promise<void> }) {
  const [tipo, setTipo] = useState('Semestral')
  const [formato, setFormato] = useState<'PDF' | 'CSV'>('PDF')
  const [titulo, setTitulo] = useState('Relatório CPA 2026.2')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await onGenerate({ titulo: titulo.trim() || 'Relatório CPA 2026.2', tipo, formato })
      onClose()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Gerar Relatório"
      sub="Crie um documento consolidado com dados anônimos."
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={() => document.getElementById('gerar-relatorio-submit')?.click()} disabled={salvando}>
            {Icons.report({ width: 16, height: 16 })} {salvando ? 'Gerando…' : 'Gerar'}
          </PrimaryButton>
        </div>
      }
    >
      <form onSubmit={submit} className="p-6 grid gap-4">
        <button id="gerar-relatorio-submit" type="submit" className="hidden" />
        <div>
          <label className="text-sm font-semibold text-slate-700">Título</label>
          <input value={titulo} onChange={event => setTitulo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold text-slate-700">Tipo</label>
            <select value={tipo} onChange={event => setTipo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option>Semestral</option>
              <option>Analítico</option>
              <option>Institucional</option>
              <option>Por questão</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Formato</label>
            <select value={formato} onChange={event => setFormato(event.target.value as 'PDF' | 'CSV')} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option>PDF</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-slate-600">
          O relatório é persistido no servidor e o download usa indicadores consolidados. Dados individuais não são incluídos.
        </div>
        {erro && <p className="text-sm text-red-700">{erro}</p>}
      </form>
    </Modal>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState<RelatorioApi[]>([])
  const [historico, setHistorico] = useState<HistoricoItemApi[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [downloadErro, setDownloadErro] = useState('')
  const [novo, setNovo] = useState(false)
  const [filtro, setFiltro] = useState('Todos')

  function carregar(signal?: AbortSignal) {
    setLoading(true)
    setErro('')
    return Promise.all([listarRelatorios(signal), obterDashboard(signal)])
      .then(([lista, dashboard]) => {
        setRelatorios(lista)
        setHistorico(dashboard.historico)
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErro(error instanceof ApiException ? error.message : 'Não foi possível carregar os relatórios.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const controller = new AbortController()
    carregar(controller.signal)
    return () => controller.abort()
  }, [])

  async function gerar(input: CriarRelatorioInput) {
    try {
      const criado = await criarRelatorio(input)
      setRelatorios(atual => [criado, ...atual.filter(item => item.id !== criado.id)])
    } catch (error) {
      throw new Error(error instanceof ApiException ? error.message : 'Não foi possível gerar o relatório.')
    }
  }

  async function baixar(relatorio: RelatorioApi) {
    setDownloadErro('')
    try {
      const arquivo = await baixarRelatorio(relatorio.id)
      triggerDownload(arquivo.blob, arquivo.filename)
    } catch (error) {
      setDownloadErro(error instanceof ApiException ? error.message : 'Não foi possível baixar o relatório.')
    }
  }

  const lista = relatorios.filter(relatorio => filtro === 'Todos' || relatorio.tipo === filtro)

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Documentos e histórico</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-1">Gere e acompanhe consolidados da CPA por ciclo.</p>
        </div>
        <PrimaryButton onClick={() => setNovo(true)}>{Icons.plus({ width: 17, height: 17 })} Gerar Relatório</PrimaryButton>
      </div>

      {loading && <Card className="p-14 text-center mb-5"><div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-slate-200 border-t-green-700 animate-spin" /><p className="text-sm font-medium text-slate-500">Carregando relatórios…</p></Card>}
      {!loading && erro && <Card className="p-8 text-center text-sm text-red-800 bg-red-50 border-red-200 mb-5">{erro}</Card>}
      {downloadErro && <Card className="p-4 text-sm text-red-800 bg-red-50 border-red-200 mb-5">{downloadErro}</Card>}

      {!loading && !erro && (
        <div className="responsive-grid-2 grid grid-cols-2 gap-4 mb-5">
          <Trend title="Tendência de Participação" values={historico.map(item => item.participacao)} labels={historico.map(item => item.sem)} color="#2563EB" />
          <Trend title="Tendência de Satisfação" values={historico.map(item => item.satisfacao)} labels={historico.map(item => item.sem)} color="#2A7A3B" />
        </div>
      )}

      <Card>
        <CardHead
          title="Documentos Gerados"
          sub="Relatórios consolidados persistidos no servidor"
          right={
            <select value={filtro} onChange={event => setFiltro(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <option>Todos</option>
              <option>Semestral</option>
              <option>Analítico</option>
              <option>Institucional</option>
              <option>Por questão</option>
            </select>
          }
        />
        <div className="responsive-table">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                {['Documento', 'Tipo', 'Formato', 'Gerado em', 'Autor', ''].map(header => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(relatorio => (
                <tr key={relatorio.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: relatorio.formato === 'PDF' ? '#FDECEF' : '#DCFCE7', color: relatorio.formato === 'PDF' ? '#C8102E' : '#166534' }}>{relatorio.formato}</span>
                      <span className="text-sm font-semibold text-slate-800">{relatorio.titulo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{relatorio.tipo}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-600">{relatorio.formato}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{formatarGerado(relatorio.gerado)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{relatorio.autor}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => baixar(relatorio)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                      {Icons.download({ width: 14, height: 14 })} Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && lista.length === 0 && <p className="px-5 py-8 text-sm text-slate-400">Nenhum relatório gerado ainda.</p>}
        </div>
      </Card>
      {novo && <GerarModal onClose={() => setNovo(false)} onGenerate={gerar} />}
    </div>
  )
}
