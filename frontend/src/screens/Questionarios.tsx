import { useEffect, useState } from 'react'
import { Badge, Card, CardHead, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { ApiException } from '../api/client'
import type { TipoPergunta } from '../data/mock'
import {
  obterQuestionario,
  type CriarQuestionarioInput,
  type EditarQuestionarioInput,
  type QuestionarioApi,
  type QuestionarioDetalheApi,
} from '../api/questionarios'

const PERFIL_LABEL: Record<string, string> = {
  discente: 'Discente',
  docente: 'Docente',
  tecnico: 'Técnico',
}

const PERFIS_DISPONIVEIS = Object.keys(PERFIL_LABEL)

const TIPO_LABEL: Record<TipoPergunta, string> = {
  likert: 'Escala Likert (1 a 5)',
  simnao: 'Sim/Não',
  unica: 'Escolha única',
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

type PerguntaForm = {
  texto: string
  tipo: TipoPergunta
  opcoes: string
  dimensao: string
  perfisAlvo: string[]
}

function perguntaVazia(): PerguntaForm {
  return { texto: '', tipo: 'likert', opcoes: '', dimensao: '', perfisAlvo: [...PERFIS_DISPONIVEIS] }
}

function NovoQuestionarioModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: CriarQuestionarioInput) => Promise<void>
}) {
  const MAX_PERGUNTAS = 50
  const MAX_TEXTO = 500
  const MAX_NOME = 150

  const [nome, setNome] = useState('')
  const [perguntas, setPerguntas] = useState<string[]>([''])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  function atualizarPergunta(index: number, texto: string) {
    setPerguntas(atual =>
      atual.map((pergunta, i) =>
        i === index ? texto : pergunta,
      ),
    )
  }

  function adicionarPergunta() {
    if (perguntas.length >= MAX_PERGUNTAS) {
      setErro(`O questionário pode ter no máximo ${MAX_PERGUNTAS} perguntas.`)
      return
    }

    setErro('')
    setPerguntas(atual => [...atual, ''])
  }

  function removerPergunta(index: number) {
    if (perguntas.length === 1) return

    setPerguntas(atual =>
      atual.filter((_, i) => i !== index),
    )
  }

  function normalizar(texto: string) {
    return texto
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('pt-BR')
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault()
    setErro('')

    const nomeLimpo = nome.trim()
    const perguntasLimpas = perguntas.map(pergunta =>
      pergunta.trim(),
    )

    if (nomeLimpo.length < 3) {
      setErro('Informe um nome com pelo menos 3 caracteres.')
      return
    }

    if (nomeLimpo.length > MAX_NOME) {
      setErro(`O nome pode ter no máximo ${MAX_NOME} caracteres.`)
      return
    }

    if (
      perguntasLimpas.length < 1 ||
      perguntasLimpas.length > MAX_PERGUNTAS
    ) {
      setErro(
        `O questionário precisa ter entre 1 e ${MAX_PERGUNTAS} perguntas.`,
      )
      return
    }

    if (
      perguntasLimpas.some(
        pergunta => pergunta.length < 3,
      )
    ) {
      setErro(
        'Toda pergunta precisa ter pelo menos 3 caracteres.',
      )
      return
    }

    if (
      perguntasLimpas.some(
        pergunta => pergunta.length > MAX_TEXTO,
      )
    ) {
      setErro(
        `Cada pergunta pode ter no máximo ${MAX_TEXTO} caracteres.`,
      )
      return
    }

    const normalizadas = perguntasLimpas.map(normalizar)

    if (new Set(normalizadas).size !== normalizadas.length) {
      setErro(
        'Existem perguntas repetidas. Revise o questionário antes de criar.',
      )
      return
    }

    setSalvando(true)

    try {
      await onCreate({
        nome: nomeLimpo,
        perguntas: perguntasLimpas,
      })
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o questionário.',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Novo Questionário"
      sub="Crie um novo instrumento. Todas as perguntas usam automaticamente a escala Likert de 1 a 5."
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton
            onClick={onClose}
            disabled={salvando}
          >
            Cancelar
          </SecondaryButton>

          <PrimaryButton
            disabled={salvando}
            onClick={() =>
              document
                .getElementById('novo-questionario-submit')
                ?.click()
            }
          >
            {salvando ? 'Criando…' : 'Criar questionário'}
          </PrimaryButton>
        </div>
      }
    >
      <form
        onSubmit={salvar}
        className="p-6 grid gap-5"
      >
        <button
          id="novo-questionario-submit"
          type="submit"
          className="hidden"
        />

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Nome do questionário
          </label>

          <input
            value={nome}
            onChange={event => setNome(event.target.value)}
            maxLength={MAX_NOME}
            disabled={salvando}
            placeholder="Ex.: Autoavaliação Institucional CPA 2029"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50"
          />

          <div className="mt-1 text-right text-[11px] text-slate-400">
            {nome.length}/{MAX_NOME}
          </div>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-green-900">
            Escala de resposta
          </p>

          <p className="text-xs text-green-800 mt-1">
            Todas as perguntas serão obrigatórias e respondidas
            na escala Likert de 1 a 5.
          </p>

          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map(valor => (
              <span
                key={valor}
                className="w-8 h-8 rounded-lg border border-green-200 bg-white text-green-800 flex items-center justify-center text-xs font-bold"
              >
                {valor}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Perguntas
              </label>

              <p className="text-xs text-slate-400 mt-0.5">
                {perguntas.length} de {MAX_PERGUNTAS} perguntas
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarPergunta}
              disabled={
                salvando ||
                perguntas.length >= MAX_PERGUNTAS
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline disabled:text-slate-300 disabled:no-underline"
            >
              {Icons.plus({ width: 14, height: 14 })}
              Adicionar pergunta
            </button>
          </div>

          {perguntas.map((pergunta, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                  {index + 1}
                </span>

                <div className="flex-1">
                  <textarea
                    value={pergunta}
                    onChange={event =>
                      atualizarPergunta(
                        index,
                        event.target.value,
                      )
                    }
                    maxLength={MAX_TEXTO}
                    disabled={salvando}
                    rows={2}
                    placeholder={`Digite a pergunta ${index + 1}`}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50"
                  />

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Resposta: escala de 1 a 5
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {pergunta.length}/{MAX_TEXTO}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removerPergunta(index)}
                  disabled={
                    salvando || perguntas.length === 1
                  }
                  aria-label={`Remover pergunta ${index + 1}`}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-30 flex items-center justify-center flex-shrink-0"
                >
                  {Icons.close({
                    width: 16,
                    height: 16,
                  })}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
          O novo questionário será criado como <strong>Rascunho</strong>.
          Revise as perguntas antes de publicá-lo e vinculá-lo a uma campanha.
        </div>

        {erro && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {erro}
          </div>
        )}
      </form>
    </Modal>
  )
}

function EditarModal({
  questionarioId,
  onClose,
  onSave,
}: {
  questionarioId: string
  onClose: () => void
  onSave: (input: EditarQuestionarioInput) => Promise<void>
}) {
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState('')
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('')
  const [status, setStatus] = useState<'Rascunho' | 'Publicado'>('Rascunho')
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    obterQuestionario(questionarioId, controller.signal)
      .then(detalhe => {
        setNome(detalhe.nome)
        setCategoria(detalhe.categoria)
        setStatus(detalhe.status)
        setPerguntas(
          detalhe.itens.map(item => ({
            texto: item.texto,
            tipo: item.tipo,
            opcoes: item.opcoes ? item.opcoes.join(', ') : '',
            dimensao: item.dimensao ?? '',
            perfisAlvo: item.perfisAlvo,
          })),
        )
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErroCarga(error instanceof ApiException ? error.message : 'Não foi possível carregar o questionário.')
      })
      .finally(() => setCarregando(false))
    return () => controller.abort()
  }, [questionarioId])

  function atualizarPergunta(index: number, patch: Partial<PerguntaForm>) {
    setPerguntas(atual => atual.map((pergunta, i) => (i === index ? { ...pergunta, ...patch } : pergunta)))
  }
  function alternarPerfil(index: number, perfil: string) {
    setPerguntas(atual =>
      atual.map((pergunta, i) => {
        if (i !== index) return pergunta
        const tem = pergunta.perfisAlvo.includes(perfil)
        return { ...pergunta, perfisAlvo: tem ? pergunta.perfisAlvo.filter(item => item !== perfil) : [...pergunta.perfisAlvo, perfil] }
      }),
    )
  }
  function removerPergunta(index: number) {
    setPerguntas(atual => atual.filter((_, i) => i !== index))
  }
  function adicionarPergunta() {
    setPerguntas(atual => [...atual, perguntaVazia()])
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault()
    setErroSalvar('')
    if (!nome.trim()) {
      setErroSalvar('Informe o nome do questionário.')
      return
    }
    if (perguntas.length === 0) {
      setErroSalvar('Adicione ao menos uma pergunta.')
      return
    }
    if (perguntas.some(pergunta => !pergunta.texto.trim())) {
      setErroSalvar('Toda pergunta precisa de um texto.')
      return
    }
    setSalvando(true)
    try {
      await onSave({
        nome,
        categoria,
        status,
        perguntas: perguntas.map(pergunta => ({
          texto: pergunta.texto,
          tipo: pergunta.tipo,
          opcoes:
            pergunta.tipo === 'unica'
              ? pergunta.opcoes.split(',').map(item => item.trim()).filter(Boolean)
              : null,
          dimensao: pergunta.dimensao.trim() || null,
          perfisAlvo: pergunta.perfisAlvo,
        })),
      })
    } catch (error) {
      setErroSalvar(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Editar Questionário"
      sub="Só é possível editar enquanto não há respostas registradas nele."
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={salvando}>Cancelar</SecondaryButton>
          <PrimaryButton disabled={salvando || carregando} onClick={() => document.getElementById('editar-questionario-submit')?.click()}>
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </PrimaryButton>
        </div>
      }
    >
      {carregando && <p className="text-sm text-slate-400 text-center py-10">Carregando…</p>}
      {!carregando && erroCarga && <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erroCarga}</div>}
      {!carregando && !erroCarga && (
        <form onSubmit={salvar} className="p-6 grid gap-5">
          <button id="editar-questionario-submit" type="submit" className="hidden" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">Nome</label>
              <input value={nome} onChange={event => setNome(event.target.value)} disabled={salvando} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Categoria</label>
              <input value={categoria} onChange={event => setCategoria(event.target.value)} disabled={salvando} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select value={status} onChange={event => setStatus(event.target.value as 'Rascunho' | 'Publicado')} disabled={salvando} className="mt-1.5 w-full max-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option>Rascunho</option>
              <option>Publicado</option>
            </select>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Perguntas</label>
              <button type="button" onClick={adicionarPergunta} disabled={salvando} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
                {Icons.plus({ width: 14, height: 14 })} Adicionar pergunta
              </button>
            </div>
            {perguntas.map((pergunta, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4 grid gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">{index + 1}</span>
                  <textarea
                    value={pergunta.texto}
                    onChange={event => atualizarPergunta(index, { texto: event.target.value })}
                    disabled={salvando}
                    rows={2}
                    placeholder="Texto da pergunta"
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => removerPergunta(index)}
                    disabled={salvando}
                    aria-label="Remover pergunta"
                    className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-red-600 flex items-center justify-center flex-shrink-0"
                  >
                    {Icons.close({ width: 16, height: 16 })}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-10">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Tipo</label>
                    <select
                      value={pergunta.tipo}
                      onChange={event => atualizarPergunta(index, { tipo: event.target.value as TipoPergunta })}
                      disabled={salvando}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
                    >
                      {(Object.keys(TIPO_LABEL) as TipoPergunta[]).map(tipo => <option key={tipo} value={tipo}>{TIPO_LABEL[tipo]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Dimensão (opcional)</label>
                    <input value={pergunta.dimensao} onChange={event => atualizarPergunta(index, { dimensao: event.target.value })} disabled={salvando} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
                  </div>
                </div>
                {pergunta.tipo === 'unica' && (
                  <div className="pl-10">
                    <label className="text-xs font-semibold text-slate-500">Opções (separadas por vírgula)</label>
                    <input
                      value={pergunta.opcoes}
                      onChange={event => atualizarPergunta(index, { opcoes: event.target.value })}
                      disabled={salvando}
                      placeholder="Opção A, Opção B, Opção C"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                    />
                  </div>
                )}
                <div className="pl-10 flex flex-wrap gap-3">
                  {PERFIS_DISPONIVEIS.map(perfil => (
                    <label key={perfil} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={pergunta.perfisAlvo.includes(perfil)} onChange={() => alternarPerfil(index, perfil)} disabled={salvando} />
                      {PERFIL_LABEL[perfil]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {erroSalvar && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erroSalvar}</div>}
        </form>
      )}
    </Modal>
  )
}

export default function Questionarios({ questionarios, onCreate, onDuplicate, onEdit, loading, error }: { questionarios: QuestionarioApi[]; onCreate: (input: CriarQuestionarioInput) => Promise<void>; onDuplicate: (id: string) => Promise<void>; onEdit: (id: string, input: EditarQuestionarioInput) => Promise<void>; loading: boolean; error: string | null }) {
  const [filtro, setFiltro] = useState('Todos')
  const [novo, setNovo] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
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
          <p className="text-sm text-slate-500 mt-1">Crie, consulte e edite os questionários. Modelos com respostas registradas ficam bloqueados para preservar o histórico.</p>
        </div>

        <PrimaryButton
          onClick={() => setNovo(true)}
          disabled={loading}
        >
          {Icons.plus({ width: 17, height: 17 })}
          Novo Questionário
        </PrimaryButton>
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
          <div className="responsive-table"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100">{['Nome','Categoria','Questões','Versão','Uso','Atualizado','Status',''].map(h => <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(q => <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4 text-sm font-semibold text-slate-800">{q.nome}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{q.categoria}</span></td><td className="px-5 py-4 text-sm font-semibold text-blue-700">{q.perguntas}</td><td className="px-5 py-4 text-xs text-slate-500">v{q.versao}</td><td className="px-5 py-4 text-xs text-slate-500">{q.usos} campanha{q.usos===1?'':'s'}</td><td className="px-5 py-4 text-xs text-slate-400">{q.atualizado}</td><td className="px-5 py-4"><Badge status={q.status}/></td><td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => setPreview(q.id)} className="text-xs font-semibold text-blue-700 hover:underline">Visualizar</button>{!q.locked && <button onClick={() => setEditando(q.id)} className="text-xs font-semibold text-slate-500 hover:underline">Editar</button>}<button onClick={() => duplicar(q.id)} disabled={duplicando===q.id} className="text-xs font-semibold text-slate-500 hover:underline disabled:opacity-50">{duplicando===q.id?'Duplicando…':'Duplicar'}</button></div></td></tr>)}</tbody></table>
          {lista.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Nenhum questionário encontrado.</div>}
          </div>
        )}
      </Card>
      {novo && (
        <NovoQuestionarioModal
          onClose={() => setNovo(false)}
          onCreate={async input => {
            await onCreate(input)
            setNovo(false)
          }}
        />
      )}

      {preview && <Preview questionarioId={preview} onClose={() => setPreview(null)} />}
      {editando && (
        <EditarModal
          questionarioId={editando}
          onClose={() => setEditando(null)}
          onSave={async input => {
            await onEdit(editando, input)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}
