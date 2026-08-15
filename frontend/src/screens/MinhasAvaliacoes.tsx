import { useMemo, useState } from 'react'
import { Icons } from '../components/Icons'
import { Badge, Card, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import type { AvaliacaoDisponivel, Pergunta } from '../data/mock'
import { diasAte, statusPorPeriodo } from '../utils/date'

const likert = [
  { v: 1, label: 'Muito insatisfeito' },
  { v: 2, label: 'Insatisfeito' },
  { v: 3, label: 'Neutro' },
  { v: 4, label: 'Satisfeito' },
  { v: 5, label: 'Muito satisfeito' },
]

function RespostaObjetiva({ pergunta, valor, onChange }: { pergunta: Pergunta; valor?: string; onChange: (value: string) => void }) {
  if (pergunta.tipo === 'simnao') {
    return (
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {['Sim', 'Não'].map(op => (
          <button key={op} type="button" onClick={() => onChange(op)}
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-left transition"
            style={{ borderColor: valor === op ? GREEN : '#E2E8F0', background: valor === op ? '#F0F8F2' : '#FFF', color: valor === op ? '#1E5C2C' : '#475569' }}>
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: valor === op ? GREEN : '#CBD5E1' }}>
                {valor === op && <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />}
              </span>
              {op}
            </span>
          </button>
        ))}
      </div>
    )
  }

  if (pergunta.tipo === 'unica' && pergunta.opcoes) {
    return (
      <div className="grid gap-2.5 mt-5">
        {pergunta.opcoes.map(op => (
          <button key={op} type="button" onClick={() => onChange(op)} className="rounded-xl border px-4 py-3 text-sm text-left transition"
            style={{ borderColor: valor === op ? GREEN : '#E2E8F0', background: valor === op ? '#F0F8F2' : '#FFF', color: valor === op ? '#1E5C2C' : '#475569' }}>
            {op}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {likert.map(op => (
          <button key={op.v} type="button" onClick={() => onChange(String(op.v))}
            aria-label={`${op.v} - ${op.label}`}
            className="min-h-12 rounded-xl border text-sm font-bold transition"
            style={{ borderColor: valor === String(op.v) ? GREEN : '#E2E8F0', background: valor === String(op.v) ? '#EAF4EC' : '#FFF', color: valor === String(op.v) ? '#1E5C2C' : '#64748B' }}>
            {op.v}
          </button>
        ))}
      </div>
      <div className="flex justify-between gap-4 mt-2 text-[11px] text-slate-400">
        <span>Muito insatisfeito</span><span>Muito satisfeito</span>
      </div>
    </div>
  )
}

function QuestionarioModal({ avaliacao, onClose, onConcluir }: { avaliacao: AvaliacaoDisponivel; onClose: () => void; onConcluir: () => void }) {
  const [index, setIndex] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [confirmando, setConfirmando] = useState(false)
  const pergunta = avaliacao.perguntas[index]
  const progresso = Math.round(((index + 1) / avaliacao.perguntas.length) * 100)
  const podeAvancar = !pergunta.obrigatoria || Boolean(respostas[pergunta.id])
  const ultima = index === avaliacao.perguntas.length - 1

  if (confirmando) {
    return (
      <Modal title="Confirmar envio" sub={avaliacao.titulo} onClose={() => setConfirmando(false)} maxWidth="max-w-lg"
        footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={() => setConfirmando(false)}>Voltar</SecondaryButton><PrimaryButton onClick={onConcluir}>{Icons.check({ width: 17, height: 17 })} Enviar respostas</PrimaryButton></div>}>
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4" style={{ color: GREEN }}>{Icons.shield()}</div>
          <p className="text-sm text-slate-700 leading-6">Você respondeu <strong>{Object.keys(respostas).length} de {avaliacao.perguntas.length}</strong> questões. Após o envio, esta avaliação será considerada concluída e não poderá ser respondida novamente.</p>
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 flex gap-2">{Icons.lock({ width: 16, height: 16 })}<span>As respostas são registradas de forma anônima e apresentadas apenas de maneira consolidada.</span></div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={avaliacao.titulo} sub={`Questão ${index + 1} de ${avaliacao.perguntas.length}`} onClose={onClose} maxWidth="max-w-2xl"
      footer={<div className="flex items-center justify-between gap-3"><SecondaryButton onClick={() => index === 0 ? onClose() : setIndex(v => v - 1)}>{index === 0 ? 'Cancelar' : 'Anterior'}</SecondaryButton><PrimaryButton disabled={!podeAvancar} onClick={() => ultima ? setConfirmando(true) : setIndex(v => v + 1)}>{ultima ? 'Finalizar' : <>Próxima {Icons.arrow({ width: 16, height: 16 })}</>}</PrimaryButton></div>}>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${progresso}%`, background: GREEN }} /></div>
          <span className="text-xs font-semibold text-slate-500 w-10 text-right">{progresso}%</span>
        </div>
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{avaliacao.categoria}</span>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-7 mt-4">{pergunta.texto}</h3>
        {pergunta.obrigatoria && <p className="text-xs text-slate-400 mt-2">Questão obrigatória</p>}
        <RespostaObjetiva pergunta={pergunta} valor={respostas[pergunta.id]} onChange={v => setRespostas(r => ({ ...r, [pergunta.id]: v }))} />
      </div>
    </Modal>
  )
}

export default function MinhasAvaliacoes({ avaliacoes, respondidas, onResponder }: { avaliacoes: AvaliacaoDisponivel[]; respondidas: Record<string, string>; onResponder: (id: string) => void }) {
  const [selecionada, setSelecionada] = useState<AvaliacaoDisponivel | null>(null)

  const { disponiveis, proximas } = useMemo(() => {
    const abertas = avaliacoes.filter(a => statusPorPeriodo(a.inicio, a.fim) === 'Ativa' && !respondidas[a.id])
    const agendadas = avaliacoes.filter(a => statusPorPeriodo(a.inicio, a.fim) === 'Agendada')
    return { disponiveis: abertas, proximas: agendadas }
  }, [avaliacoes, respondidas])

  const respondidasNoPerfil = avaliacoes.filter(a => Boolean(respondidas[a.id])).length

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Participação CPA</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Minhas Avaliações</h1>
        <p className="text-sm text-slate-500 mt-1">Responda somente as avaliações disponíveis para o seu perfil e vínculo institucional.</p>
      </div>

      <div className="responsive-grid-3 grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Disponíveis', value: disponiveis.length, color: '#166534', bg: '#DCFCE7', detail: 'para responder agora' },
          { label: 'Próximas', value: proximas.length, color: '#1D4ED8', bg: '#DBEAFE', detail: 'já programadas' },
          { label: 'Respondidas', value: respondidasNoPerfil, color: '#6D28D9', bg: '#EDE9FE', detail: 'concluídas por você' },
        ].map(k => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{k.label}</p><p className="text-xs text-slate-400 mt-1">{k.detail}</p></div>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ color: k.color, background: k.bg }}>{k.value}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div><h2 className="text-base font-bold text-slate-800">Disponíveis agora</h2><p className="text-xs text-slate-400 mt-0.5">Ao concluir, a avaliação será movida para “Avaliações Respondidas”.</p></div>
          <span className="text-xs font-semibold text-slate-500">{disponiveis.length} pendente{disponiveis.length === 1 ? '' : 's'}</span>
        </div>

        {disponiveis.length === 0 ? (
          <Card className="p-10 text-center"><div className="w-12 h-12 rounded-full bg-green-50 text-green-700 mx-auto flex items-center justify-center mb-3">{Icons.check()}</div><p className="font-semibold text-slate-700">Nenhuma avaliação pendente</p><p className="text-sm text-slate-400 mt-1">Você está em dia com as avaliações atualmente abertas.</p></Card>
        ) : (
          <div className="grid gap-3">
            {disponiveis.map(av => (
              <Card key={av.id} className="p-5 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-green-50 flex-shrink-0" style={{ color: GREEN }}>{Icons.campaign()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{av.titulo}</h3><Badge status="Disponível" /></div>
                    <p className="text-sm text-slate-500 mt-1">{av.descricao}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-400"><span className="inline-flex items-center gap-1.5">{Icons.calendar({ width: 14, height: 14 })} até {av.fim}</span><span className="inline-flex items-center gap-1.5">{Icons.question({ width: 14, height: 14 })} {av.perguntas.length} questões objetivas</span></div>
                  </div>
                  <PrimaryButton onClick={() => setSelecionada(av)} className="sm:self-center">Responder {Icons.arrow({ width: 16, height: 16 })}</PrimaryButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {proximas.length > 0 && (
        <div>
          <div className="mb-4"><h2 className="text-base font-bold text-slate-800">Próximas Avaliações</h2><p className="text-xs text-slate-400 mt-0.5">Elas serão liberadas automaticamente quando chegar a data de abertura.</p></div>
          <div className="grid gap-3">
            {proximas.map(av => {
              const faltam = diasAte(av.inicio)
              return (
                <Card key={av.id} className="p-5 sm:p-6 border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0">{Icons.calendar()}</div>
                    <div className="flex-1 min-w-0"><div className="flex flex-wrap gap-2 items-center"><h3 className="font-bold text-slate-800">{av.titulo}</h3><Badge status="Agendada" /></div><p className="text-sm text-slate-500 mt-1">{av.descricao}</p><p className="text-xs text-slate-400 mt-2">Abre em <strong className="text-blue-700">{av.inicio}</strong>{faltam > 0 ? ` · daqui a ${faltam} dia${faltam === 1 ? '' : 's'}` : ''}</p></div>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Ainda não disponível</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {selecionada && <QuestionarioModal avaliacao={selecionada} onClose={() => setSelecionada(null)} onConcluir={() => { onResponder(selecionada.id); setSelecionada(null) }} />}
    </div>
  )
}
