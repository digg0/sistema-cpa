import { Badge, Card, CardHead, GREEN, BLUE, PURPLE } from '../components/ui'
import { Icons } from '../components/Icons'
import { historico, participacaoPorPerfil, satisfacao, type Campanha } from '../data/mock'
import { statusPorPeriodo } from '../utils/date'

function Donut() {
  let cumulative = 0
  const radius = 44
  const circumference = 2 * Math.PI * radius
  return (
    <div className="grid sm:grid-cols-[150px_1fr] gap-4 items-center">
      <div className="relative w-[132px] h-[132px] mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="15" />
          {satisfacao.map(item => {
            const dash = (item.valor / 100) * circumference
            const offset = -(cumulative / 100) * circumference
            cumulative += item.valor
            return <circle key={item.label} cx="60" cy="60" r={radius} fill="none" stroke={item.cor} strokeWidth="15" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} />
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl text-slate-900">75,4%</strong><span className="text-[10px] text-slate-400">satisfação</span></div>
      </div>
      <div className="grid gap-2">
        {satisfacao.map(s => <div key={s.label} className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.cor }} /><span className="flex-1 text-slate-500">{s.label}</span><strong className="text-slate-700">{s.valor}%</strong></div>)}
      </div>
    </div>
  )
}

function HistoryLine() {
  const W = 360, H = 128, left = 18, right = 12, top = 14, bottom = 24
  const values = historico.map(h => h.participacao)
  const min = 50, max = 72
  const pts = historico.map((h, i) => ({ x: left + i * ((W - left - right) / (historico.length - 1)), y: top + (max - h.participacao) * ((H - top - bottom) / (max - min)), ...h }))
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const area = `${path} L${pts[pts.length - 1].x},${H - bottom} L${pts[0].x},${H - bottom} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px]">
      <defs><linearGradient id="historyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.18"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></linearGradient></defs>
      {[55, 60, 65, 70].map(v => { const y = top + (max - v) * ((H - top - bottom) / (max - min)); return <line key={v} x1={left} y1={y} x2={W-right} y2={y} stroke="#EEF2F6" strokeWidth="1"/> })}
      <path d={area} fill="url(#historyArea)" />
      <path d={path} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <g key={p.sem}><circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? GREEN : 'white'} stroke={i === pts.length - 1 ? GREEN : '#2563EB'} strokeWidth="2"/><text x={p.x} y={H-7} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{p.sem}</text></g>)}
    </svg>
  )
}

export default function Dashboard({ campanhas, onNovaCampanha }: { campanhas: Campanha[]; onNovaCampanha: () => void }) {
  const enriquecidas = campanhas.map(c => ({ ...c, status: statusPorPeriodo(c.inicio, c.fim) }))
  const ativas = enriquecidas.filter(c => c.status === 'Ativa')
  const agendadas = enriquecidas.filter(c => c.status === 'Agendada')
  const respostas = enriquecidas.reduce((sum, c) => sum + c.respostas, 0)

  const kpis = [
    { label: 'Taxa de participação', valor: '68,4%', detalhe: '+1,4 p.p. vs. 2026.1', cor: '#166534', fundo: '#DCFCE7', icon: Icons.chart({ width: 19, height: 19 }) },
    { label: 'Avaliações ativas', valor: String(ativas.length), detalhe: `${agendadas.length} agendada${agendadas.length === 1 ? '' : 's'}`, cor: '#1D4ED8', fundo: '#DBEAFE', icon: Icons.campaign({ width: 19, height: 19 }) },
    { label: 'Respostas coletadas', valor: respostas.toLocaleString('pt-BR'), detalhe: 'ciclo demonstrativo', cor: '#6D28D9', fundo: '#EDE9FE', icon: Icons.check({ width: 19, height: 19 }) },
  ]

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Gestão CPA</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Painel de Controle</h1><p className="text-sm text-slate-500 mt-1">Ciclo 2026.2 · IFCE — Campus Tauá</p></div>
        <button onClick={onNovaCampanha} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: GREEN }}>{Icons.plus({ width: 17, height: 17 })} Nova Campanha</button>
      </div>

      <div className="responsive-grid-3 grid grid-cols-3 gap-4 mb-5">
        {kpis.map(k => <Card key={k.label} className="p-5"><div className="flex items-start gap-4"><span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: k.fundo, color: k.cor }}>{k.icon}</span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{k.label}</p><p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{k.valor}</p><p className="text-xs font-medium mt-1" style={{ color: k.cor }}>{k.detalhe}</p></div></div></Card>)}
      </div>

      <div className="responsive-grid-3 grid grid-cols-[1fr_1.05fr_1.25fr] gap-4 mb-5">
        <Card><CardHead title="Participação por Perfil" sub="Ciclo 2026.2"/><div className="p-5 grid gap-5">{participacaoPorPerfil.map(p => <div key={p.perfil}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.cor }}/><span className="text-sm font-medium text-slate-600">{p.perfil}</span></div><strong className="text-sm" style={{ color: p.cor }}>{p.valor}%</strong></div><div className="h-2.5 rounded-full overflow-hidden" style={{ background: p.fundo }}><div className="h-full rounded-full" style={{ width: `${p.valor}%`, background: p.cor }}/></div></div>)}</div></Card>
        <Card><CardHead title="Satisfação Geral" sub="Índice consolidado"/><div className="p-5"><Donut/></div></Card>
        <Card><CardHead title="Histórico de Participação" sub="Evolução semestral"/><div className="p-4"><HistoryLine/><div className="flex justify-end gap-4 px-2 text-[11px] text-slate-400"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: BLUE }}/>histórico</span><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: GREEN }}/>ciclo atual</span></div></div></Card>
      </div>

      <Card>
        <CardHead title="Campanhas Recentes" sub="Status calculado automaticamente pelo período de aplicação" />
        <div className="responsive-table">
          <table className="w-full min-w-[820px]">
            <thead><tr className="border-b border-slate-100">{['Campanha','Público','Período','Participação','Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead>
            <tbody>{enriquecidas.slice(0,6).map(c => {
              const progressColor = c.status === 'Ativa' ? GREEN : c.status === 'Agendada' ? BLUE : '#94A3B8'
              return <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-6 py-4 text-sm font-semibold text-slate-800">{c.nome}</td><td className="px-6 py-4 text-sm text-slate-500">{c.publico}</td><td className="px-6 py-4 text-xs text-slate-400">{c.inicio} — {c.fim}</td><td className="px-6 py-4 w-44">{c.status === 'Agendada' ? <span className="text-xs text-slate-400">Ainda não iniciada</span> : <div className="flex items-center gap-2"><div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${c.participacao}%`, background: progressColor }}/></div><span className="text-xs font-semibold text-slate-500">{c.participacao}%</span></div>}</td><td className="px-6 py-4"><Badge status={c.status}/></td></tr>
            })}</tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
