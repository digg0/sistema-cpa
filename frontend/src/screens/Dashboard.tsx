import { useEffect, useState } from 'react'
import { Badge, Card, CardHead, GREEN, BLUE } from '../components/ui'
import { Icons } from '../components/Icons'
import { ApiException } from '../api/client'
import { obterDashboard, type DashboardApi, type HistoricoItemApi, type SatisfacaoItemApi } from '../api/dashboard'
import { statusPorPeriodo } from '../utils/date'

function Donut({ items, centro }: { items: SatisfacaoItemApi[]; centro: string }) {
  let cumulative = 0
  const radius = 44
  const circumference = 2 * Math.PI * radius
  return (
    <div className="grid sm:grid-cols-[150px_1fr] gap-4 items-center">
      <div className="relative w-[132px] h-[132px] mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="15" />
          {items.map(item => {
            const dash = (item.pct / 100) * circumference
            const offset = -(cumulative / 100) * circumference
            cumulative += item.pct
            return <circle key={item.label} cx="60" cy="60" r={radius} fill="none" stroke={item.cor} strokeWidth="15" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} />
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-900">{centro}</strong><span className="text-[10px] text-slate-400">satisfação</span></div>
      </div>
      <div className="grid gap-2">
        {items.map(item => <div key={item.label} className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: item.cor }} /><span className="flex-1 text-slate-500">{item.label}</span><strong className="text-slate-700">{item.pct}%</strong></div>)}
      </div>
    </div>
  )
}

function HistoryLine({ historico }: { historico: HistoricoItemApi[] }) {
  if (historico.length === 0) return <p className="text-sm text-slate-400 p-4">Sem histórico suficiente.</p>
  const W = 360, H = 128, left = 18, right = 12, top = 14, bottom = 24
  const values = historico.map(item => item.participacao)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const span = Math.max(historico.length - 1, 1)
  const range = max - min || 1
  const pts = historico.map((item, i) => ({
    x: left + i * ((W - left - right) / span),
    y: top + (max - item.participacao) * ((H - top - bottom) / range),
    ...item,
  }))
  const path = pts.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ')
  const area = `${path} L${pts[pts.length - 1].x},${H - bottom} L${pts[0].x},${H - bottom} Z`
  const ticks = [min, min + range / 3, min + (2 * range) / 3, max]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px]">
      <defs><linearGradient id="historyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.18"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></linearGradient></defs>
      {ticks.map(value => { const y = top + (max - value) * ((H - top - bottom) / range); return <line key={value} x1={left} y1={y} x2={W-right} y2={y} stroke="#EEF2F6" strokeWidth="1"/> })}
      <path d={area} fill="url(#historyArea)" />
      <path d={path} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((point, i) => <g key={point.sem}><circle cx={point.x} cy={point.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? GREEN : 'white'} stroke={i === pts.length - 1 ? GREEN : '#2563EB'} strokeWidth="2"/><text x={point.x} y={H-7} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{point.sem}</text></g>)}
    </svg>
  )
}

function formatPct(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

export default function Dashboard({ onNovaCampanha }: { onNovaCampanha: () => void }) {
  const [data, setData] = useState<DashboardApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setErro('')
    obterDashboard(controller.signal)
      .then(setData)
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErro(error instanceof ApiException ? error.message : 'Não foi possível carregar o dashboard.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  if (loading) {
    return <div className="max-w-[1400px] mx-auto"><Card className="p-14 text-center"><div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-slate-200 border-t-green-700 animate-spin" /><p className="text-sm font-medium text-slate-500">Carregando painel…</p></Card></div>
  }
  if (erro || !data) {
    return <div className="max-w-[1400px] mx-auto"><Card className="p-8 text-center text-sm text-red-800 bg-red-50 border-red-200">{erro || 'Dashboard indisponível.'}</Card></div>
  }

  const enriquecidas = data.campanhas.map(campanha => ({ ...campanha, status: statusPorPeriodo(campanha.inicio, campanha.fim) }))
  const ativas = enriquecidas.filter(campanha => campanha.status === 'Ativa')
  const agendadas = enriquecidas.filter(campanha => campanha.status === 'Agendada')
  const atual = data.historico[data.historico.length - 1]
  const anterior = data.historico[data.historico.length - 2]
  const delta = atual && anterior ? atual.participacao - anterior.participacao : null

  const kpis = [
    {
      label: 'Taxa de participação',
      valor: atual ? formatPct(atual.participacao) : '0,0%',
      detalhe: delta === null ? 'ciclo atual' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')} p.p. vs. ${anterior.sem}`,
      cor: '#166534',
      fundo: '#DCFCE7',
      icon: Icons.chart({ width: 19, height: 19 }),
    },
    {
      label: 'Avaliações ativas',
      valor: String(ativas.length),
      detalhe: `${agendadas.length} agendada${agendadas.length === 1 ? '' : 's'}`,
      cor: '#1D4ED8',
      fundo: '#DBEAFE',
      icon: Icons.campaign({ width: 19, height: 19 }),
    },
    {
      label: 'Respostas coletadas',
      valor: data.totalRespostas.toLocaleString('pt-BR'),
      detalhe: atual ? `ciclo ${atual.sem}` : 'sem ciclo',
      cor: '#6D28D9',
      fundo: '#EDE9FE',
      icon: Icons.check({ width: 19, height: 19 }),
    },
  ]

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Gestão CPA</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Painel de Controle</h1><p className="text-sm text-slate-500 mt-1">{atual ? `Ciclo ${atual.sem}` : 'Ciclo atual'} · IFCE — Campus Tauá</p></div>
        <button onClick={onNovaCampanha} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: GREEN }}>{Icons.plus({ width: 17, height: 17 })} Nova Campanha</button>
      </div>

      <div className="responsive-grid-3 grid grid-cols-3 gap-4 mb-5">
        {kpis.map(kpi => <Card key={kpi.label} className="p-5"><div className="flex items-start gap-4"><span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: kpi.fundo, color: kpi.cor }}>{kpi.icon}</span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p><p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{kpi.valor}</p><p className="text-xs font-medium mt-1" style={{ color: kpi.cor }}>{kpi.detalhe}</p></div></div></Card>)}
      </div>

      <div className="responsive-grid-3 grid grid-cols-[1fr_1.05fr_1.25fr] gap-4 mb-5">
        <Card><CardHead title="Participação por Perfil" sub={atual ? `Ciclo ${atual.sem}` : 'Ciclo atual'}/><div className="p-5 grid gap-5">{data.participacaoPorPerfil.map(perfil => <div key={perfil.perfil}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: perfil.cor }}/><span className="text-sm font-medium text-slate-600">{perfil.label}</span></div><strong className="text-sm" style={{ color: perfil.cor }}>{perfil.valor}%</strong></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: perfil.fundo }}><div className="h-full rounded-full" style={{ width: `${perfil.valor}%`, background: perfil.cor }}/></div></div>)}</div></Card>
        <Card><CardHead title="Satisfação Geral" sub="Índice consolidado"/><div className="p-5"><Donut items={data.satisfacao} centro={formatPct(data.satisfacaoGeral)}/></div></Card>
        <Card><CardHead title="Histórico de Participação" sub="Evolução semestral"/><div className="p-4"><HistoryLine historico={data.historico}/><div className="flex justify-end gap-4 px-2 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: BLUE }}/>histórico</span><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: GREEN }}/>ciclo atual</span></div></div></Card>
      </div>

      <Card>
        <CardHead title="Campanhas Recentes" sub="Status calculado automaticamente pelo período de aplicação" />
        <div className="responsive-table">
          <table className="w-full min-w-[820px]">
            <thead><tr className="border-b border-slate-100">{['Campanha','Público','Período','Participação','Status'].map(header => <th key={header} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">{header}</th>)}</tr></thead>
            <tbody>{enriquecidas.slice(0,6).map(campanha => {
              const progressColor = campanha.status === 'Ativa' ? GREEN : campanha.status === 'Agendada' ? BLUE : '#94A3B8'
              return <tr key={campanha.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-6 py-4 text-sm font-semibold text-slate-800">{campanha.nome}</td><td className="px-6 py-4 text-sm text-slate-500">{campanha.publico}</td><td className="px-6 py-4 text-xs text-slate-400">{campanha.inicio} — {campanha.fim}</td><td className="px-6 py-4 w-44">{campanha.status === 'Agendada' ? <span className="text-xs text-slate-400">Ainda não iniciada</span> : <div className="flex items-center gap-2"><div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${campanha.participacao}%`, background: progressColor }}/></div><span className="text-xs font-semibold text-slate-500">{campanha.participacao}%</span></div>}</td><td className="px-6 py-4"><Badge status={campanha.status}/></td></tr>
            })}</tbody>
          </table>
          {enriquecidas.length === 0 && <p className="px-6 py-8 text-sm text-slate-400">Nenhuma campanha cadastrada.</p>}
        </div>
      </Card>
    </div>
  )
}
