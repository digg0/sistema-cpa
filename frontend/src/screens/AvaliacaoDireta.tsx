import { useEffect, useState, type ReactNode } from 'react'
import { ApiException } from '../api/client'
import { enviarRespostas, getAvaliacao, type AvaliacaoDireta } from '../api/avaliacoes'
import { Card, GREEN, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { QuestionarioModal } from './MinhasAvaliacoes'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ViewState =
  | { kind: 'loading' }
  | { kind: 'ready'; avaliacao: AvaliacaoDireta }
  | { kind: 'error'; title: string; message: string; retryable: boolean }
  | { kind: 'completed' }

function stateMessage(avaliacao: AvaliacaoDireta): { title: string; message: string } | null {
  switch (avaliacao.accessStatus) {
    case 'SCHEDULED':
      return { title: 'Avaliação agendada', message: `Esta avaliação estará disponível a partir de ${avaliacao.inicio}.` }
    case 'CLOSED':
      return { title: 'Período encerrado', message: `O período desta avaliação foi encerrado em ${avaliacao.fim}.` }
    case 'ALREADY_ANSWERED':
      return { title: 'Avaliação já respondida', message: 'Você já respondeu esta avaliação.' }
    case 'NO_QUESTIONS':
      return { title: 'Questionário indisponível', message: 'Este questionário não possui perguntas disponíveis para o seu perfil.' }
    default:
      return null
  }
}

export default function AvaliacaoDireta({ campaignId, onBack, onSessionExpired }: { campaignId: string; onBack: () => void; onSessionExpired: () => void }) {
  const [state, setState] = useState<ViewState>({ kind: 'loading' })
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!UUID_PATTERN.test(campaignId)) {
      setState({ kind: 'error', title: 'Link inválido', message: 'O identificador informado no link da avaliação é inválido.', retryable: false })
      return
    }
    const controller = new AbortController()
    setState({ kind: 'loading' })
    getAvaliacao(campaignId, controller.signal)
      .then(avaliacao => setState({ kind: 'ready', avaliacao }))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiException && error.status === 401) {
          onSessionExpired()
          return
        }
        if (error instanceof ApiException && error.status === 404) {
          setState({ kind: 'error', title: 'Avaliação não encontrada', message: 'A campanha informada não existe ou não está mais disponível.', retryable: false })
          return
        }
        if (error instanceof ApiException && error.status === 403) {
          setState({ kind: 'error', title: 'Acesso não permitido', message: error.message || 'Esta avaliação não está disponível para o seu perfil.', retryable: false })
          return
        }
        setState({ kind: 'error', title: 'Não foi possível carregar', message: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.', retryable: true })
      })
    return () => controller.abort()
  }, [campaignId, onSessionExpired, reload])

  if (state.kind === 'loading') {
    return <DirectLayout><Card className="p-10 text-center text-sm text-slate-500">Carregando avaliação…</Card></DirectLayout>
  }

  if (state.kind === 'completed') {
    return <DirectLayout><StateCard title="Respostas enviadas" message="Sua participação foi registrada com sucesso." onBack={onBack} success /></DirectLayout>
  }

  if (state.kind === 'error') {
    return <DirectLayout><StateCard title={state.title} message={state.message} onBack={onBack} onRetry={state.retryable ? () => setReload(value => value + 1) : undefined} /></DirectLayout>
  }

  const statusMessage = stateMessage(state.avaliacao)
  if (statusMessage) {
    return <DirectLayout><StateCard {...statusMessage} onBack={onBack} /></DirectLayout>
  }

  return (
    <DirectLayout>
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GREEN }}>Acesso direto</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{state.avaliacao.titulo}</h1>
        <p className="mt-2 text-sm text-slate-500">{state.avaliacao.descricao}</p>
      </Card>
      <QuestionarioModal
        avaliacao={state.avaliacao}
        onClose={onBack}
        onConcluir={async respostas => {
          await enviarRespostas(state.avaliacao.id, respostas)
          setState({ kind: 'completed' })
        }}
      />
    </DirectLayout>
  )
}

function DirectLayout({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#F5F7F5] px-5 py-10"><div className="mx-auto max-w-2xl">{children}</div></main>
}

function StateCard({ title, message, onBack, onRetry, success = false }: { title: string; message: string; onBack: () => void; onRetry?: () => void; success?: boolean }) {
  return (
    <Card className="p-8 text-center">
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${success ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {success ? Icons.check() : Icons.info()}
      </div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      <div className="mt-6 flex justify-center gap-2">
        <SecondaryButton onClick={onBack}>Voltar ao sistema</SecondaryButton>
        {onRetry && <PrimaryButton onClick={onRetry}>Tentar novamente</PrimaryButton>}
      </div>
    </Card>
  )
}
