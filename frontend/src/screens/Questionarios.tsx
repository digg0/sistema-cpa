import { useState } from 'react'
import { Badge, Card, CardHead, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import type { QuestionarioAdmin } from '../data/mock'

const previewQuestions = [
  'O item avaliado atende às expectativas institucionais?',
  'A organização das atividades é adequada?',
  'Os recursos disponíveis são suficientes para a realização das atividades?',
  'A comunicação das informações é clara e acessível?',
  'De forma geral, qual é o seu nível de satisfação com este item?',
]

function Preview({ q, onClose }: { q: QuestionarioAdmin; onClose: () => void }) {
  return (
    <Modal title={q.nome} sub={`${q.perguntas} questões objetivas · versão ${q.versao}`} onClose={onClose} maxWidth="max-w-2xl"
      footer={<div className="flex justify-end"><SecondaryButton onClick={onClose}>Fechar</SecondaryButton></div>}>
      <div className="p-6 grid gap-5">
        <div className="rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 text-xs text-slate-600 flex gap-2"><span className="text-green-700">{Icons.check({ width: 16, height: 16 })}</span><span>Este modelo contém apenas perguntas objetivas. Não existem campos de comentário ou resposta discursiva.</span></div>
        {previewQuestions.map((texto, i) => (
          <div key={texto} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex gap-3"><span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i + 1}</span><div className="flex-1"><p className="text-sm font-semibold text-slate-800">{texto}</p><p className="text-xs text-slate-400 mt-1">Escala Likert (1 a 5) · obrigatória</p><div className="grid grid-cols-5 gap-2 mt-3">{[1,2,3,4,5].map(n => <div key={n} className="rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-500">{n}</div>)}</div></div></div>
          </div>
        ))}
        {q.perguntas > previewQuestions.length && <p className="text-center text-xs text-slate-400">+ {q.perguntas - previewQuestions.length} questões objetivas adicionais no modelo.</p>}
      </div>
    </Modal>
  )
}

function NovoQuestionario({ onClose, onCreate }: { onClose: () => void; onCreate: (q: QuestionarioAdmin) => void }) {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Institucional')
  const [perguntas, setPerguntas] = useState(6)
  const [status, setStatus] = useState<'Publicado' | 'Rascunho'>('Rascunho')

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    onCreate({ id: `Q-${Date.now()}`, nome: nome.trim(), categoria, perguntas, versao: 1, status, criador: 'Coordenação CPA', atualizado: new Date().toLocaleDateString('pt-BR'), usos: 0 })
  }

  return (
    <Modal title="Novo Questionário" sub="Crie um modelo exclusivamente com perguntas objetivas." onClose={onClose} maxWidth="max-w-lg"
      footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose}>Cancelar</SecondaryButton><PrimaryButton onClick={() => document.getElementById('novo-questionario-submit')?.click()}>{Icons.plus({ width: 16, height: 16 })} Criar</PrimaryButton></div>}>
      <form onSubmit={salvar} className="p-6 grid gap-4"><button id="novo-questionario-submit" type="submit" className="hidden"/><div><label className="text-sm font-semibold text-slate-700">Nome</label><input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Avaliação Institucional v1" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10"/></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-semibold text-slate-700">Categoria</label><select value={categoria} onChange={e => setCategoria(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>Institucional</option><option>Docente</option><option>Infraestrutura</option><option>Biblioteca</option><option>Serviços</option><option>Autoavaliação</option></select></div><div><label className="text-sm font-semibold text-slate-700">Questões</label><input type="number" min={1} max={50} value={perguntas} onChange={e => setPerguntas(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></div></div><div><label className="text-sm font-semibold text-slate-700">Situação inicial</label><div className="grid grid-cols-2 gap-2 mt-2">{(['Rascunho','Publicado'] as const).map(v => <button key={v} type="button" onClick={() => setStatus(v)} className="rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ borderColor: status === v ? GREEN : '#E2E8F0', background: status === v ? '#F0F8F2' : '#FFF', color: status === v ? '#1E5C2C' : '#64748B' }}>{v}</button>)}</div></div><div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-800">Tipos permitidos no projeto: escala 1–5, Sim/Não e escolha única. Campos de texto livre não são oferecidos.</div></form>
    </Modal>
  )
}

export default function Questionarios({ questionarios, onCreate, onDuplicate }: { questionarios: QuestionarioAdmin[]; onCreate: (q: QuestionarioAdmin) => void; onDuplicate: (q: QuestionarioAdmin) => void }) {
  const [filtro, setFiltro] = useState('Todos')
  const [preview, setPreview] = useState<QuestionarioAdmin | null>(null)
  const [novo, setNovo] = useState(false)
  const lista = questionarios.filter(q => filtro === 'Todos' || q.status === filtro)
  const published = questionarios.filter(q => q.status === 'Publicado').length
  const drafts = questionarios.filter(q => q.status === 'Rascunho').length
  const questions = questionarios.reduce((s, q) => s + q.perguntas, 0)

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Instrumentos de avaliação</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Questionários</h1><p className="text-sm text-slate-500 mt-1">Gerencie modelos compostos exclusivamente por perguntas objetivas.</p></div><PrimaryButton onClick={() => setNovo(true)}>{Icons.plus({ width: 17, height: 17 })} Novo Questionário</PrimaryButton></div>
      <div className="responsive-grid-3 grid grid-cols-3 gap-4 mb-5">{[
        { label:'Publicados', value:published, color:'#166534', bg:'#DCFCE7' },
        { label:'Rascunhos', value:drafts, color:'#92400E', bg:'#FEF3C7' },
        { label:'Questões objetivas', value:questions, color:'#1D4ED8', bg:'#DBEAFE' },
      ].map(s => <Card key={s.label} className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p><div className="flex items-center justify-between mt-2"><p className="text-3xl font-bold" style={{ color:s.color }}>{s.value}</p><span className="w-10 h-10 rounded-2xl" style={{ background:s.bg }}/></div></Card>)}</div>
      <Card><CardHead title="Biblioteca de Questionários" sub="Modelos disponíveis para vincular às campanhas" right={<select value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Todos</option><option>Publicado</option><option>Rascunho</option></select>}/><div className="responsive-table"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100">{['Nome','Categoria','Questões','Versão','Uso','Atualizado','Status',''].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(q => <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4 text-sm font-semibold text-slate-800">{q.nome}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{q.categoria}</span></td><td className="px-5 py-4 text-sm font-semibold text-blue-700">{q.perguntas}</td><td className="px-5 py-4 text-xs text-slate-500">v{q.versao}</td><td className="px-5 py-4 text-xs text-slate-500">{q.usos} campanha{q.usos===1?'':'s'}</td><td className="px-5 py-4 text-xs text-slate-400">{q.atualizado}</td><td className="px-5 py-4"><Badge status={q.status}/></td><td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => setPreview(q)} className="text-xs font-semibold text-blue-700 hover:underline">Visualizar</button><button onClick={() => onDuplicate(q)} className="text-xs font-semibold text-slate-500 hover:underline">Duplicar</button></div></td></tr>)}</tbody></table></div></Card>
      {preview && <Preview q={preview} onClose={() => setPreview(null)} />}
      {novo && <NovoQuestionario onClose={() => setNovo(false)} onCreate={q => { onCreate(q); setNovo(false) }} />}
    </div>
  )
}
