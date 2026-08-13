import { Card, GREEN } from '../components/ui'
import { Icons } from '../components/Icons'
import type { AvaliacaoDisponivel } from '../data/mock'

export default function AvaliacoesRespondidas({ avaliacoes, respondidas }: { avaliacoes: AvaliacaoDisponivel[]; respondidas: Record<string, string> }) {
  const lista = avaliacoes.filter(a => Boolean(respondidas[a.id]))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: GREEN }}>Histórico pessoal</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Avaliações Respondidas</h1>
        <p className="text-sm text-slate-500 mt-1">Aqui aparecem apenas as avaliações que você já concluiu.</p>
      </div>

      {lista.length === 0 ? (
        <Card className="py-14 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">{Icons.campaign()}</div>
          <p className="font-semibold text-slate-700">Nenhuma avaliação respondida</p>
          <p className="text-sm text-slate-400 mt-1">Quando você concluir uma avaliação, ela aparecerá nesta tela.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {lista.map(av => (
            <Card key={av.id} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">{Icons.check()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{av.titulo}</h3><span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Respondida</span></div>
                  <p className="text-sm text-slate-500 mt-1">{av.descricao}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-400"><span>Concluída em {respondidas[av.id]}</span><span>{av.perguntas.length} questões objetivas</span></div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">{Icons.lock({ width: 15, height: 15 })} Resposta registrada</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/70 px-5 py-4 flex gap-3 text-sm text-slate-600">
        <span className="text-green-700 mt-0.5">{Icons.shield({ width: 19, height: 19 })}</span>
        <p><strong className="text-slate-700">Privacidade preservada:</strong> o sistema registra que você participou para impedir resposta duplicada, mas os resultados são exibidos apenas de forma consolidada.</p>
      </div>
    </div>
  )
}
