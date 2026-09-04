import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import type { CriarCampanhaInput } from '../api/campanhas'
import type { QuestionarioResumo } from '../api/questionarios'
import { Badge, Card, CardHead, GREEN, Modal, PrimaryButton, Progress, SecondaryButton, SLATE } from '../components/ui'
import { Icons } from '../components/Icons'
import type { Campanha, PerfilParticipante } from '../data/mock'
import { statusPorPeriodo } from '../utils/date'

const publicos: Array<{ label: string; perfis: PerfilParticipante[] }> = [
  { label: 'Discentes', perfis: ['Discente'] },
  { label: 'Docentes', perfis: ['Docente'] },
  { label: 'Técnicos', perfis: ['Técnico'] },
  { label: 'Discentes e Técnicos', perfis: ['Discente', 'Técnico'] },
  { label: 'Discentes, Docentes e Técnicos', perfis: ['Discente', 'Docente', 'Técnico'] },
]

function NovaCampanhaModal({ questionarios, onClose, onCreate }: { questionarios: QuestionarioResumo[]; onClose: () => void; onCreate: (input: CriarCampanhaInput) => Promise<void> }) {
  const publicados = questionarios.filter(item => item.status === 'Publicado')
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('Institucional')
  const [descricao, setDescricao] = useState('')
  const [publicoIndex, setPublicoIndex] = useState(0)
  const [questionarioId, setQuestionarioId] = useState(publicados[0]?.id ?? '')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !inicio || !fim || !questionarioId) {
      setErro('Preencha nome, questionário, data de início e data de encerramento.')
      return
    }
    if (new Date(inicio) > new Date(fim)) {
      setErro('A data de encerramento deve ser posterior à data de início.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await onCreate({ nome: nome.trim(), tipo, descricao: descricao.trim(), publico: publicos[publicoIndex].perfis, questionario_id: questionarioId, inicio, fim })
      onClose()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível criar a campanha.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal title="Nova Campanha" sub="Defina o ciclo, o público e o questionário objetivo que será aplicado." onClose={onClose} maxWidth="max-w-2xl"
      footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose} disabled={salvando}>Cancelar</SecondaryButton><PrimaryButton onClick={() => document.getElementById('nova-campanha-submit')?.click()} disabled={salvando || publicados.length === 0}>{Icons.plus({ width: 16, height: 16 })} {salvando ? 'Criando…' : 'Criar campanha'}</PrimaryButton></div>}>
      <form onSubmit={salvar} className="grid gap-4 p-6 sm:grid-cols-2">
        <button type="submit" id="nova-campanha-submit" className="hidden" />
        <div className="sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Nome da campanha</label><input value={nome} onChange={e => setNome(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        <div><label className="text-sm font-semibold text-slate-700">Tipo</label><select value={tipo} onChange={e => setTipo(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option>Institucional</option><option>Docente</option><option>Infraestrutura</option><option>Biblioteca</option><option>Serviços</option><option>Autoavaliação</option></select></div>
        <div><label className="text-sm font-semibold text-slate-700">Público-alvo</label><select value={publicoIndex} onChange={e => setPublicoIndex(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm">{publicos.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Descrição</label><textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        <div className="sm:col-span-2"><label className="text-sm font-semibold text-slate-700">Questionário</label><select value={questionarioId} onChange={e => setQuestionarioId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"><option value="">Selecione</option>{publicados.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>{publicados.length === 0 && <p className="mt-1 text-xs text-red-700">Nenhum questionário publicado foi encontrado.</p>}</div>
        <div><label className="text-sm font-semibold text-slate-700">Início</label><input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        <div><label className="text-sm font-semibold text-slate-700">Encerramento</label><input type="date" value={fim} onChange={e => setFim(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm" /></div>
        {erro && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>}
      </form>
    </Modal>
  )
}

function QrCodeModal({ campanha, onClose }: { campanha: Campanha; onClose: () => void }) {
  const evaluationUrl = `${window.location.origin}/avaliacoes/${campanha.id}`
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(evaluationUrl, { width: 320, margin: 2, errorCorrectionLevel: 'M' }).then(setImageUrl).catch(() => setError('Não foi possível gerar o QR Code.'))
  }, [evaluationUrl])

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(evaluationUrl)
      setCopied(true)
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o link abaixo.')
    }
  }

  function download() {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `qr-${campanha.nome.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <Modal title="QR Code da avaliação" sub={campanha.nome} onClose={onClose} maxWidth="max-w-lg"
      footer={<div className="flex flex-wrap justify-end gap-2"><SecondaryButton onClick={copyUrl}>{copied ? 'Link copiado' : 'Copiar link'}</SecondaryButton><PrimaryButton onClick={download} disabled={!imageUrl}>{Icons.download({ width: 16, height: 16 })} Baixar PNG</PrimaryButton></div>}>
      <div className="p-6 text-center">
        {imageUrl ? <img src={imageUrl} alt={`QR Code para ${campanha.nome}`} className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-200" /> : <div className="mx-auto flex h-[280px] max-w-[280px] items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">Gerando QR Code…</div>}
        <div className="mt-5 grid gap-2 rounded-xl bg-slate-50 p-4 text-left text-xs text-slate-600"><p><strong>Período:</strong> {campanha.inicio} a {campanha.fim}</p><p><strong>Público:</strong> {campanha.publico}</p><p className="break-all"><strong>URL:</strong> {evaluationUrl}</p></div>
        <p className="mt-3 text-xs text-slate-400">O QR Code contém somente o endereço e o identificador da campanha.</p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}

function DetalhesModal({ campanha, onClose }: { campanha: Campanha; onClose: () => void }) {
  const [showQr, setShowQr] = useState(false)
  const status = campanha.status ?? statusPorPeriodo(campanha.inicio, campanha.fim)
  if (showQr) return <QrCodeModal campanha={campanha} onClose={() => setShowQr(false)} />
  return (
    <Modal title={campanha.nome} sub={`${campanha.tipo} · ${campanha.publico}`} onClose={onClose} maxWidth="max-w-xl"
      footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose}>Fechar</SecondaryButton><PrimaryButton onClick={() => setShowQr(true)}>Gerar QR Code</PrimaryButton></div>}>
      <div className="p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {[['Início', campanha.inicio], ['Encerramento', campanha.fim], ['Questionário', campanha.questionario], ['Status', status]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>{label === 'Status' ? <div className="mt-2"><Badge status={value}/></div> : <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>}</div>)}
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Participação</p>
        {status === 'Agendada' ? <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-500">A coleta ainda não foi iniciada.</p> : <Progress value={campanha.participacao} color={status === 'Ativa' ? GREEN : SLATE} />}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"><span>Respostas coletadas</span><strong className="text-slate-900">{campanha.respostas.toLocaleString('pt-BR')}</strong></div>
      </div>
    </Modal>
  )
}

export default function Campanhas({ campanhas, questionarios, loading, error, onReload, onCreate, abrirNova, onNovaAberta }: { campanhas: Campanha[]; questionarios: QuestionarioResumo[]; loading?: boolean; error?: string | null; onReload: () => void; onCreate: (input: CriarCampanhaInput) => Promise<void>; abrirNova?: boolean; onNovaAberta?: () => void }) {
  const [filtro, setFiltro] = useState('Todos')
  const [busca, setBusca] = useState('')
  const [nova, setNova] = useState(false)
  const [detalhe, setDetalhe] = useState<Campanha | null>(null)
  useEffect(() => { if (abrirNova) { setNova(true); onNovaAberta?.() } }, [abrirNova, onNovaAberta])

  const enriched = useMemo(() => campanhas.map(item => ({ ...item, status: item.status ?? statusPorPeriodo(item.inicio, item.fim) })), [campanhas])
  const counts = { Ativa: enriched.filter(item => item.status === 'Ativa').length, Agendada: enriched.filter(item => item.status === 'Agendada').length, Encerrada: enriched.filter(item => item.status === 'Encerrada').length }
  const lista = enriched.filter(item => (filtro === 'Todos' || item.status === filtro) && item.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: GREEN }}>Ciclos de avaliação</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Campanhas</h1><p className="mt-1 text-sm text-slate-500">Crie, programe e acompanhe as avaliações institucionais.</p></div><PrimaryButton onClick={() => setNova(true)} disabled={loading}>{Icons.plus({ width: 17, height: 17 })} Nova Campanha</PrimaryButton></div>
      {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button onClick={onReload} className="font-bold underline">Tentar novamente</button></div>}
      <div className="responsive-grid-4 mb-5 grid grid-cols-4 gap-4">{[
        ['Total', campanhas.length, '#334155'], ['Ativas', counts.Ativa, '#166534'], ['Agendadas', counts.Agendada, '#1D4ED8'], ['Encerradas', counts.Encerrada, '#64748B'],
      ].map(([label, value, color]) => <Card key={String(label)} className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold" style={{ color: String(color) }}>{value}</p></Card>)}</div>
      <Card>
        <CardHead title="Todas as Campanhas" sub={loading ? 'Carregando campanhas…' : `${lista.length} registro${lista.length === 1 ? '' : 's'}`} right={<div className="flex gap-2"><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar campanha" className="w-48 rounded-xl border border-slate-200 px-3 py-2 text-xs" /><select value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"><option>Todos</option><option>Ativa</option><option>Agendada</option><option>Encerrada</option></select></div>} />
        <div className="responsive-table"><table className="w-full min-w-[980px]"><thead><tr className="border-b border-slate-100">{['Campanha', 'Tipo', 'Público', 'Período', 'Participação', 'Respostas', 'Status', ''].map(item => <th key={item} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{item}</th>)}</tr></thead><tbody>{lista.map(item => <tr key={item.id} className="border-b border-slate-50"><td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.nome}</td><td className="px-5 py-4 text-xs text-slate-500">{item.tipo}</td><td className="px-5 py-4 text-xs text-slate-500">{item.publico}</td><td className="px-5 py-4 text-xs text-slate-400">{item.inicio} — {item.fim}</td><td className="w-40 px-5 py-4"><Progress value={item.participacao} color={item.status === 'Ativa' ? GREEN : SLATE} /></td><td className="px-5 py-4 text-sm font-semibold">{item.respostas}</td><td className="px-5 py-4"><Badge status={item.status} /></td><td className="px-5 py-4"><button onClick={() => setDetalhe(item)} className="text-xs font-semibold text-blue-700 hover:underline">Detalhes</button></td></tr>)}</tbody></table></div>
        {!loading && lista.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Nenhuma campanha encontrada.</div>}
      </Card>
      {nova && <NovaCampanhaModal questionarios={questionarios} onClose={() => setNova(false)} onCreate={onCreate} />}
      {detalhe && <DetalhesModal campanha={detalhe} onClose={() => setDetalhe(null)} />}
    </div>
  )
}
