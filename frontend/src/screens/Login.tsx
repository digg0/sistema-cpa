import { useState } from 'react'
import IfceLogo from '../components/IfceLogo'
import { Icons } from '../components/Icons'
import { GREEN, GREEN_D } from '../components/ui'
import { credenciais, type Perfil } from '../data/mock'

const perfis: Perfil[] = ['Discente', 'Docente', 'Técnico', 'Coordenador CPA']

const meta: Record<Perfil, { descricao: string; icon: React.ReactNode; accent: string }> = {
  Discente: { descricao: 'Responder avaliações do curso e do campus', icon: Icons.student(), accent: '#2563EB' },
  Docente: { descricao: 'Responder autoavaliações institucionais', icon: Icons.user(), accent: '#2A7A3B' },
  Técnico: { descricao: 'Responder avaliações administrativas', icon: Icons.tool(), accent: '#7C3AED' },
  'Coordenador CPA': { descricao: 'Gerenciar campanhas, resultados e relatórios', icon: Icons.shield(), accent: '#0F766E' },
}

export default function Login({ onLogin }: { onLogin: (perfil: Perfil, nome: string) => void }) {
  const [perfil, setPerfil] = useState<Perfil>('Discente')
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const cred = credenciais[perfil]

  function trocarPerfil(p: Perfil) {
    setPerfil(p)
    setIdentificador('')
    setSenha('')
    setErro('')
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      if (identificador.trim() === cred.id && senha === cred.senha) {
        onLogin(perfil, cred.nome)
      } else {
        setErro('Credenciais inválidas. Confira os dados e tente novamente.')
      }
    }, 450)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[390px_1fr] bg-[#F5F7F5]">
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between px-9 py-10 text-white" style={{ background: `linear-gradient(155deg, ${GREEN_D}, ${GREEN} 72%, #348A49)` }}>
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10" />

        <div className="relative">
          <div className="inline-flex bg-white rounded-2xl p-3 shadow-lg shadow-green-950/10 mb-8">
            <IfceLogo className="w-28 h-[78px]" />
          </div>
          <p className="text-xs uppercase tracking-[0.24em] font-bold text-emerald-100">IFCE · Campus Tauá</p>
          <h1 className="text-3xl font-bold mt-3 leading-tight">Sistema CPA</h1>
          <p className="text-sm text-emerald-50/80 mt-3 leading-6 max-w-[285px]">
            Ambiente de autoavaliação institucional com participação anônima e acompanhamento consolidado dos resultados.
          </p>
        </div>

        <div className="relative rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">{Icons.lock()}</div>
            <div>
              <p className="text-sm font-semibold">Respostas anônimas</p>
              <p className="text-xs text-emerald-50/65 mt-1 leading-5">As respostas são utilizadas apenas de forma consolidada nos relatórios da CPA.</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="soft-grid flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="lg:hidden flex items-center justify-center mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
              <IfceLogo className="w-24 h-[68px]" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-[26px] shadow-xl shadow-slate-900/5 overflow-hidden">
            <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-slate-100">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: GREEN }}>Sistema CPA</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Acessar o sistema</h2>
              <p className="text-sm text-slate-500 mt-1">Escolha seu perfil e use as credenciais de demonstração.</p>
            </div>

            <div className="px-6 sm:px-8 py-6">
              <fieldset>
                <legend className="text-sm font-semibold text-slate-700 mb-3">Perfil de acesso</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {perfis.map(p => {
                    const ativo = perfil === p
                    const m = meta[p]
                    return (
                      <button key={p} type="button" onClick={() => trocarPerfil(p)} aria-pressed={ativo}
                        className="group text-left rounded-2xl border p-4 transition hover:border-slate-300"
                        style={{ borderColor: ativo ? GREEN : '#E2E8F0', background: ativo ? '#F0F8F2' : '#FFFFFF' }}>
                        <div className="flex items-start gap-3">
                          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.accent}14`, color: m.accent }}>{m.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold" style={{ color: ativo ? GREEN_D : '#334155' }}>{p}</span>
                              {ativo && <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-4">{m.descricao}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <form onSubmit={entrar} className="mt-6 grid gap-4">
                <div>
                  <label htmlFor="identificador" className="block text-sm font-semibold text-slate-700 mb-1.5">{cred.rotuloId}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{perfil === 'Discente' ? Icons.student({ width: 18, height: 18 }) : Icons.user({ width: 18, height: 18 })}</span>
                    <input id="identificador" autoComplete="username" required value={identificador} onChange={e => setIdentificador(e.target.value)}
                      placeholder={perfil === 'Discente' ? 'Ex.: 20261001' : '000.000.000-00'}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10" />
                  </div>
                </div>

                <div>
                  <label htmlFor="senha" className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{Icons.lock({ width: 18, height: 18 })}</span>
                    <input id="senha" autoComplete="current-password" required type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10" />
                    <button type="button" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      {mostrarSenha ? Icons.eyeOff({ width: 18, height: 18 }) : Icons.eye({ width: 18, height: 18 })}
                    </button>
                  </div>
                </div>

                {erro && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-sm text-red-800">
                    <span className="mt-0.5">{Icons.info({ width: 17, height: 17 })}</span>
                    <span>{erro}</span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
                  style={{ background: GREEN }}>
                  {loading ? 'Verificando acesso…' : 'Entrar'}
                </button>
              </form>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Credenciais de demonstração</p>
                    <p className="text-xs text-slate-500 mt-1"><span className="font-mono">{cred.id}</span> · <span className="font-mono">{cred.senha}</span></p>
                  </div>
                  <button type="button" onClick={() => { setIdentificador(cred.id); setSenha(cred.senha); setErro('') }}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Preencher automaticamente
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">Protótipo navegável · dados de demonstração · Ciclo 2026.2</p>
        </div>
      </main>
    </div>
  )
}
