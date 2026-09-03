import { useEffect, useState } from 'react'
import { Badge, Card, CardHead, GREEN, Modal, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { ApiException } from '../api/client'
import { obterQuestionario, type QuestionarioApi, type QuestionarioDetalheApi } from '../api/questionarios'

const PERFIL_LABEL: Record<string, string> = {
  discente: 'Discente',
  docente: 'Docente',
  tecnico: 'Técnico',
}

function PerfisAlvoBadges({ perfisAlvo }: { perfisAlvo: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {perfisAlvo.map(perfil => (
        <span key={perfil} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {PERFIL_LABEL[perfil] ?? perfil}
        </span>
      ))}
    </div>
  )
}

function Preview({ questionarioId, onClose }: { questionarioId: string; onClose: () => void }) {
  const [detalhe, setDetalhe] = useState<QuestionarioDetalheApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    obterQuestionario(questionarioId, controller.signal)
      .then(setDetalhe)
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErro(error instanceof ApiException ? error.message : 'Não foi possível carregar o questionário.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [questionarioId])

  return (
    <Modal title={detalhe?.nome ?? 'Questionário'} sub={detalhe ? `${detalhe.perguntas} questões objetivas · versão ${detalhe.versao}` : undefined} onClose={onClose} maxWidth="max-w-2xl"
      footer={<div className="flex justify-end"><SecondaryButton onClick={onClose}>Fechar</SecondaryButton></div>}>
      <div className="p-6 grid gap-5">
        {loading && <p className="text-sm text-slate-400 text-center py-6">Carregando perguntas…</p>}
        {!loading && erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>}
        {!loading && detalhe && (
          <>
            <div className="rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 text-xs text-slate-600 flex gap-2"><span className="text-green-700">{Icons.check({ width: 16, height: 16 })}</span><span>Este modelo contém apenas perguntas objetivas. As perguntas são específicas por perfil — nem todos respondem todas.</span></div>
            {detalhe.itens.map((pergunta, i) => (
              <div key={pergunta.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{pergunta.texto}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {pergunta.dimensao ? `${pergunta.dimensao} · ` : ''}
                      {pergunta.tipo === 'likert' ? 'Escala Likert (1 a 5)' : pergunta.tipo === 'simnao' ? 'Sim/Não' : 'Escolha única'}
                      {pergunta.obrigatoria ? ' · obrigatória' : ''}
                    </p>
                    <PerfisAlvoBadges perfisAlvo={pergunta.perfisAlvo} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Modal>
  )
}

export default function Questionarios({ questionarios, onDuplicate, loading, error }: { questionarios: QuestionarioApi[]; onDuplicate: (id: string) => Promise<void>; loading: boolean; error: string | null }) {
  const [filtro, setFiltro] = useState('Todos')
  const [preview, setPreview] = useState<string | null>(null)
  const [duplicando, setDuplicando] = useState<string | null>(null)
  const [erroDuplicar, setErroDuplicar] = useState('')
  const lista = questionarios.filter(q => filtro === 'Todos' || q.status === filtro)
  const published = questionarios.filter(q => q.status === 'Publicado').length
  const drafts = questionarios.filter(q => q.status === 'Rascunho').length
  const questions = questionarios.reduce((s, q) => s + q.perguntas, 0)

  async function duplicar(id: string) {
    setDuplicando(id)
    setErroDuplicar('')
    try {
      await onDuplicate(id)
    } catch (err) {
      setErroDuplicar(err instanceof Error ? err.message : 'Não foi possível duplicar o questionário.')
    } finally {
      setDuplicando(null)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Instrumentos de avaliação</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Questionários</h1>
          <p className="text-sm text-slate-500 mt-1">Consulte os questionários e as perguntas de cada perfil. Só existe um questionário oficial, populado pela CPA — para atualizar as perguntas em um novo ciclo, duplique-o.</p>
        </div>
      </div>
      <div className="responsive-grid-3 grid grid-cols-3 gap-4 mb-5">{[
        { label:'Publicados', value:published, color:'#166534', bg:'#DCFCE7' },
        { label:'Rascunhos', value:drafts, color:'#92400E', bg:'#FEF3C7' },
        { label:'Questões objetivas', value:questions, color:'#1D4ED8', bg:'#DBEAFE' },
      ].map(s => <Card key={s.label} className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p><div className="flex items-center justify-between mt-2"><p className="text-3xl font-bold" style={{ color:s.color }}>{s.value}</p><span className="w-10 h-10 rounded-2xl" style={{ background:s.bg }}/></div></Card>)}</div>

      {erroDuplicar && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erroDuplicar}</div>}

      <Card>
        <CardHead title="Biblioteca de Questionários" sub={loading ? 'Carregando…' : 'Modelos disponíveis para vincular às campanhas'} right={<select value={filtro} onChange={e => setFiltro(e.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Todos</option><option>Publicado</option><option>Rascunho</option></select>}/>
        {loading && <div className="py-14 text-center"><div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-slate-200 border-t-green-700 animate-spin" /><p className="text-sm font-medium text-slate-500">Carregando questionários…</p></div>}
        {!loading && error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {!loading && !error && (
          <div className="responsive-table"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100">{['Nome','Categoria','Questões','Versão','Uso','Atualizado','Status',''].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(q => <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4 text-sm font-semibold text-slate-800">{q.nome}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{q.categoria}</span></td><td className="px-5 py-4 text-sm font-semibold text-blue-700">{q.perguntas}</td><td className="px-5 py-4 text-xs text-slate-500">v{q.versao}</td><td className="px-5 py-4 text-xs text-slate-500">{q.usos} campanha{q.usos===1?'':'s'}</td><td className="px-5 py-4 text-xs text-slate-400">{q.atualizado}</td><td className="px-5 py-4"><Badge status={q.status}/></td><td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => setPreview(q.id)} className="text-xs font-semibold text-blue-700 hover:underline">Visualizar</button><button onClick={() => duplicar(q.id)} disabled={duplicando===q.id} className="text-xs font-semibold text-slate-500 hover:underline disabled:opacity-50">{duplicando===q.id?'Duplicando…':'Duplicar'}</button></div></td></tr>)}</tbody></table>
          {lista.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Nenhum questionário encontrado.</div>}
          </div>
        )}
      </Card>
      {preview && <Preview questionarioId={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}
