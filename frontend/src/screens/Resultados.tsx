import { useMemo, useState } from 'react'
import { Card, CardHead, GREEN } from '../components/ui'
import { Icons } from '../components/Icons'
import { resultadosData, type Campanha } from '../data/mock'
import { statusPorPeriodo } from '../utils/date'

function Radar() {
  const dims = resultadosData.dimensoes.slice(0, 6)
  const cx = 120, cy = 110, r = 78
  const point = (i: number, scale: number) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / dims.length
    return [cx + Math.cos(a) * r * scale, cy + Math.sin(a) * r * scale]
  }
  const polygon = (scale: number) => dims.map((_, i) => point(i, scale).join(',')).join(' ')
  const dataPoints = dims.map((d, i) => point(i, d.media / 5).join(',')).join(' ')
  return (
    <svg viewBox="0 0 240 225" className="w-full max-w-[320px] mx-auto">
      {[.25,.5,.75,1].map(s => <polygon key={s} points={polygon(s)} fill="none" stroke="#E2E8F0" strokeWidth="1" />)}
      {dims.map((_, i) => { const [x,y]=point(i,1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E2E8F0"/> })}
      <polygon points={dataPoints} fill="rgba(37,99,235,.16)" stroke="#2563EB" strokeWidth="2.5" />
      {dims.map((d,i)=>{ const [x,y]=point(i,d.media/5); return <circle key={d.nome} cx={x} cy={y} r="3.5" fill="#2563EB"/> })}
    </svg>
  )
}

export default function Resultados({ campanhas }: { campanhas: Campanha[] }) {
  const encerradas = useMemo(() => campanhas.filter(c => statusPorPeriodo(c.inicio, c.fim) === 'Encerrada'), [campanhas])
  const [campId, setCampId] = useState<number>(() => encerradas[0]?.id ?? 0)
  const camp = encerradas.find(c => c.id === campId) ?? encerradas[0]

  if (!camp) {
    return <div className="max-w-5xl mx-auto"><h1 className="text-3xl font-bold text-slate-900">Resultados</h1><Card className="mt-6 p-12 text-center text-slate-500">Nenhuma campanha encerrada possui resultados consolidados.</Card></div>
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Análise consolidada</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Resultados</h1><p className="text-sm text-slate-500 mt-1">Somente campanhas encerradas aparecem nesta área.</p></div>
        <select value={camp.id} onChange={e => setCampId(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 min-w-[270px]">{encerradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 mb-5 flex gap-3 text-sm text-blue-900"><span className="mt-0.5">{Icons.shield({ width: 18, height: 18 })}</span><p>Os dados abaixo são <strong>anônimos e consolidados</strong>. Não há identificação individual nem campos de comentário livre.</p></div>

      <div className="responsive-grid-4 grid grid-cols-4 gap-4 mb-5">
        {[
          { label:'Respostas', value:camp.respostas.toLocaleString('pt-BR'), color:'#334155', bg:'#F1F5F9' },
          { label:'Participação', value:`${camp.participacao}%`, color:'#166534', bg:'#DCFCE7' },
          { label:'Média geral', value:resultadosData.mediaGeral.toFixed(1), color:'#1D4ED8', bg:'#DBEAFE' },
          { label:'Satisfação', value:`${resultadosData.satisfacao.toFixed(1).replace('.',',')}%`, color:'#6D28D9', bg:'#EDE9FE' },
        ].map(k => <Card key={k.label} className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{k.label}</p><div className="flex items-end justify-between mt-2"><p className="text-3xl font-bold" style={{ color:k.color }}>{k.value}</p><span className="w-9 h-9 rounded-xl" style={{ background:k.bg }}/></div></Card>)}
      </div>

      <div className="responsive-grid-2 grid grid-cols-[1.2fr_.8fr] gap-4 mb-5">
        <Card><CardHead title="Resultados por Dimensão" sub="Média de 1 a 5 e comparação com o ciclo anterior"/><div className="p-5 grid gap-4">{resultadosData.dimensoes.map(d => { const delta=d.media-d.anterior; const color=d.media>=4.2?'#2A7A3B':d.media>=3.8?'#2563EB':'#D97706'; return <div key={d.nome}><div className="flex items-center justify-between gap-3 mb-1.5"><span className="text-sm font-medium text-slate-600">{d.nome}</span><div className="flex items-center gap-3"><span className="text-[11px] font-semibold" style={{ color:delta>=0?'#15803D':'#B45309' }}>{delta>=0?'↑':'↓'} {Math.abs(delta).toFixed(1)}</span><strong className="text-sm" style={{ color }}>{d.media.toFixed(1)}</strong></div></div><div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width:`${d.media/5*100}%`, background:color }}/></div></div>})}</div></Card>
        <Card><CardHead title="Radar das Dimensões" sub="Visão comparativa do desempenho"/><div className="px-5 pt-2 pb-5"><Radar/><div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">{resultadosData.dimensoes.slice(0,6).map((d,i)=><div key={d.nome} className="flex items-center gap-2 text-[11px] text-slate-500"><span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center font-bold">{i+1}</span><span className="truncate">{d.nome}</span></div>)}</div></div></Card>
      </div>

      <div className="responsive-grid-2 grid grid-cols-2 gap-4">
        <Card><CardHead title="Distribuição das Respostas" sub="Escala de satisfação"/><div className="p-5 grid gap-3">{resultadosData.distribuicao.map(d => <div key={d.label} className="grid grid-cols-[135px_1fr_54px] items-center gap-3"><span className="text-xs text-slate-500">{d.label}</span><div className="h-7 rounded-lg bg-slate-100 overflow-hidden relative"><div className="h-full rounded-lg" style={{ width:`${d.pct}%`, background:d.cor, opacity:.8 }}/><span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-bold text-slate-800">{d.pct}%</span></div><span className="text-xs text-right text-slate-400">{d.n}</span></div>)}</div></Card>
        <Card><CardHead title="Pontos de Atenção" sub="Itens com menores médias consolidadas"/><div className="p-5 grid gap-3">{resultadosData.questoesCriticas.map((q,i)=><div key={q.questao} className="rounded-xl border border-slate-200 p-4 flex items-center gap-4"><span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">{i+1}</span><div className="flex-1"><p className="text-sm font-semibold text-slate-700">{q.questao}</p><p className="text-xs text-slate-400 mt-0.5">{q.respostas} respostas</p></div><strong className="text-lg text-amber-700">{q.media.toFixed(1)}</strong></div>)}</div></Card>
      </div>
    </div>
  )
}
