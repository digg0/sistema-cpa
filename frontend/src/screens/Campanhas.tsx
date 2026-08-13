import { useEffect, useMemo, useState } from 'react'
import { Badge, BLUE, Card, CardHead, GREEN, Modal, PrimaryButton, Progress, SecondaryButton, SLATE } from '../components/ui'
import { Icons } from '../components/Icons'
import type { Campanha } from '../data/mock'
import { statusPorPeriodo } from '../utils/date'

function NovaCampanhaModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Campanha) => void }) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('Institucional')
  const [publico, setPublico] = useState('Discentes')
  const [questionario, setQuestionario] = useState('Avaliação Docente v3')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')

  function br(date: string) {
    if (!date) return ''
    const [a, m, d] = date.split('-')
    return `${d}/${m}/${a}`
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !inicio || !fim) { setErro('Preencha nome, data de início e data de encerramento.'); return }
    if (new Date(inicio) > new Date(fim)) { setErro('A data de encerramento deve ser posterior à data de início.'); return }
    onCreate({ id: Date.now(), nome: nome.trim(), tipo, publico, questionario, inicio: br(inicio), fim: br(fim), participacao: 0, respostas: 0 })
  }

  return (
    <Modal title="Nova Campanha" sub="Defina o ciclo, o público e o questionário objetivo que será aplicado." onClose={onClose} maxWidth="max-w-2xl"
      footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose}>Cancelar</SecondaryButton><PrimaryButton onClick={() => document.getElementById('nova-campanha-submit')?.click()}>{Icons.plus({ width: 16, height: 16 })} Criar campanha</PrimaryButton></div>}>
      <form onSubmit={salvar} className="p-6 grid sm:grid-cols-2 gap-4">
        <button type="submit" id="nova-campanha-submit" className="hidden" />
        <div className="sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Nome da campanha</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Avaliação Institucional 2026.2" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10" /></div>
        <div><label className="text-sm font-semibold text-slate-700">Tipo</label><select value={tipo} onChange={e => setTipo(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option>Institucional</option><option>Docente</option><option>Infraestrutura</option><option>Biblioteca</option><option>Serviços</option><option>Autoavaliação</option></select></div>
        <div><label className="text-sm font-semibold text-slate-700">Público-alvo</label><select value={publico} onChange={e => setPublico(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option>Discentes</option><option>Docentes</option><option>Técnicos</option><option>Discentes e Técnicos</option><option>Discentes, Docentes e Técnicos</option></select></div>
        <div className="sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Questionário</label><select value={questionario} onChange={e => setQuestionario(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option>Avaliação Docente v3</option><option>Infraestrutura v2</option><option>Autoavaliação v1</option><option>Serviços v1</option><option>Biblioteca v1</option></select><p className="text-xs text-slate-400 mt-1">Somente questionários objetivos são permitidos.</p></div>
        <div><label className="text-sm font-semibold text-slate-700">Início</label><input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        <div><label className="text-sm font-semibold text-slate-700">Encerramento</label><input type="date" value={fim} onChange={e => setFim(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        {erro && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>}
      </form>
    </Modal>
  )
}

function DetalhesModal({ campanha, onClose }: { campanha: Campanha; onClose: () => void }) {
  const status = statusPorPeriodo(campanha.inicio, campanha.fim)
  return (
    <Modal title={campanha.nome} sub={`${campanha.tipo} · ${campanha.publico}`} onClose={onClose} maxWidth="max-w-xl"
      footer={<div className="flex justify-end"><SecondaryButton onClick={onClose}>Fechar</SecondaryButton></div>}>
      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {[['Início', campanha.inicio], ['Encerramento', campanha.fim], ['Questionário', campanha.questionario], ['Status', status]].map(([l,v]) => <div key={l} className="rounded-xl bg-slate-50 border border-slate-100 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l}</p>{l === 'Status' ? <div className="mt-2"><Badge status={v}/></div> : <p className="text-sm font-semibold text-slate-700 mt-1">{v}</p>}</div>)}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Participação</p>
        {status === 'Agendada' ? <p className="text-sm text-slate-500 rounded-xl bg-blue-50 border border-blue-100 p-3">A coleta ainda não foi iniciada.</p> : <Progress value={campanha.participacao} color={status === 'Ativa' ? GREEN : SLATE}/>} 
        <div className="mt-5 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 flex items-center justify-between"><span>Respostas coletadas</span><strong className="text-slate-900">{campanha.respostas.toLocaleString('pt-BR')}</strong></div>
      </div>
    </Modal>
  )
}

export default function Campanhas({ campanhas, onCreate, abrirNova, onNovaAberta }: { campanhas: Campanha[]; onCreate: (c: Campanha) => void; abrirNova?: boolean; onNovaAberta?: () => void }) {
  const [filtro, setFiltro] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [nova, setNova] = useState(false)
  const [detalhe, setDetalhe] = useState<Campanha | null>(null)

  useEffect(() => { if (abrirNova) { setNova(true); onNovaAberta?.() } }, [abrirNova, onNovaAberta])

  const enriched = useMemo(() => campanhas.map(c => ({ ...c, status: statusPorPeriodo(c.inicio, c.fim) })), [campanhas])
  const counts = { Ativa: enriched.filter(c => c.status === 'Ativa').length, Agendada: enriched.filter(c => c.status === 'Agendada').length, Encerrada: enriched.filter(c => c.status === 'Encerrada').length }
  const lista = enriched.filter(c => (filtro === 'Todos' || c.status === filtro) && c.nome.toLowerCase().includes(busca.toLowerCase()))

  const stats = [
    { label: 'Total', value: campanhas.length, color: '#334155', bg: '#F1F5F9' },
    { label: 'Ativas', value: counts.Ativa, color: '#166534', bg: '#DCFCE7' },
    { label: 'Agendadas', value: counts.Agendada, color: '#1D4ED8', bg: '#DBEAFE' },
    { label: 'Encerradas', value: counts.Encerrada, color: '#64748B', bg: '#F1F5F9' },
  ]

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Ciclos de avaliação</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Campanhas</h1><p className="text-sm text-slate-500 mt-1">Crie, programe e acompanhe as avaliações institucionais.</p></div><PrimaryButton onClick={() => setNova(true)}>{Icons.plus({ width: 17, height: 17 })} Nova Campanha</PrimaryButton></div>

      <div className="responsive-grid-4 grid grid-cols-4 gap-4 mb-5">{stats.map(s => <Card key={s.label} className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p><p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p></div><span className="w-10 h-10 rounded-2xl" style={{ background: s.bg }}/></div></Card>)}</div>

      <Card>
        <CardHead title="Todas as Campanhas" sub={`${lista.length} registro${lista.length === 1 ? '' : 's'} exibido${lista.length === 1 ? '' : 's'}`} right={<div className="hidden md:flex items-center gap-2"><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{Icons.search({ width: 15, height: 15 })}</span><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar campanha" className="w-48 rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-green-600" /></div><select value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Todos</option><option>Ativa</option><option>Agendada</option><option>Encerrada</option></select></div>} />
        <div className="md:hidden p-4 border-b border-slate-100 grid gap-2"><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar campanha" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><select value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>Todos</option><option>Ativa</option><option>Agendada</option><option>Encerrada</option></select></div>
        <div className="responsive-table"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100">{['Campanha','Tipo','Público','Período','Participação','Respostas','Status',''].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(c => <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4 text-sm font-semibold text-slate-800 max-w-[240px]">{c.nome}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{c.tipo}</span></td><td className="px-5 py-4 text-xs text-slate-500">{c.publico}</td><td className="px-5 py-4 text-xs text-slate-400">{c.inicio} — {c.fim}</td><td className="px-5 py-4 w-40">{c.status === 'Agendada' ? <span className="text-xs text-slate-400">—</span> : <Progress value={c.participacao} color={c.status === 'Ativa' ? GREEN : SLATE}/>}</td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{c.respostas ? c.respostas.toLocaleString('pt-BR') : '—'}</td><td className="px-5 py-4"><Badge status={c.status}/></td><td className="px-5 py-4"><button onClick={() => setDetalhe(c)} className="text-xs font-semibold text-blue-700 hover:underline">Detalhes</button></td></tr>)}</tbody></table></div>
        {lista.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Nenhuma campanha encontrada com os filtros atuais.</div>}
      </Card>

      {nova && <NovaCampanhaModal onClose={() => setNova(false)} onCreate={c => { onCreate(c); setNova(false) }} />}
      {detalhe && <DetalhesModal campanha={detalhe} onClose={() => setDetalhe(null)} />}
    </div>
  )
}
