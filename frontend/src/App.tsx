import { useEffect, useState, type ReactNode } from 'react'
import IfceLogo from './components/IfceLogo'
import { Icons } from './components/Icons'
import { GREEN, GREEN_L } from './components/ui'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Campanhas from './screens/Campanhas'
import Questionarios from './screens/Questionarios'
import Resultados from './screens/Resultados'
import Relatorios from './screens/Relatorios'
import MinhasAvaliacoes from './screens/MinhasAvaliacoes'
import AvaliacoesRespondidas from './screens/AvaliacoesRespondidas'
import { avaliacoesPorPerfil, campanhasBase, questionariosBase, relatoriosBase, type Campanha, type Perfil, type PerfilParticipante, type QuestionarioAdmin, type Relatorio } from './data/mock'
import { statusPorPeriodo } from './utils/date'

type NavItem = { id: string; label: string; icon: ReactNode }

const adminNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard() },
  { id: 'campanhas', label: 'Campanhas', icon: Icons.campaign() },
  { id: 'questionarios', label: 'Questionários', icon: Icons.question() },
  { id: 'resultados', label: 'Resultados', icon: Icons.chart() },
  { id: 'relatorios', label: 'Relatórios', icon: Icons.report() },
]
const participantNav: NavItem[] = [
  { id: 'minhas', label: 'Minhas Avaliações', icon: Icons.edit() },
  { id: 'respondidas', label: 'Avaliações Respondidas', icon: Icons.check() },
]

function Navigation({ items, active, onChange, badge, onLogout, mobile = false, onClose }: { items: NavItem[]; active: string; onChange: (id:string)=>void; badge?:number; onLogout:()=>void; mobile?:boolean; onClose?:()=>void }) {
  function choose(id:string){ onChange(id); onClose?.() }
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-center rounded-2xl bg-white p-2">
          <IfceLogo className="w-[112px] h-[82px]" />
        </div>
        <div className="text-center mt-1"><p className="text-xs font-extrabold uppercase tracking-[0.17em]" style={{color:GREEN}}>Sistema CPA</p><p className="text-[11px] text-slate-400 mt-0.5">IFCE · Campus Tauá</p></div>
      </div>
      <nav className="flex-1 px-3 py-5 grid content-start gap-1.5" aria-label="Navegação principal">
        {items.map(item => { const selected=active===item.id; return <button key={item.id} onClick={()=>choose(item.id)} className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm text-left transition" style={{background:selected?GREEN_L:'transparent',color:selected?'#1E5C2C':'#64748B',fontWeight:selected?700:500}}><span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:selected?'#DDF0E1':'#F8FAFC',color:selected?GREEN:'#94A3B8'}}>{item.icon}</span><span className="flex-1">{item.label}</span>{item.id==='minhas'&&badge!==undefined&&badge>0?<span className="min-w-6 h-6 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{badge}</span>:null}</button> })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-100"><button onClick={()=>{onLogout();onClose?.()}} className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">{Icons.logout({width:18,height:18})}</span>Sair do sistema</button>{!mobile&&<p className="text-center text-[10px] text-slate-300 mt-3">Protótipo · dados mockados</p>}</div>
    </div>
  )
}

export default function App() {
  const [session,setSession]=useState<{perfil:Perfil;nome:string}|null>(null)
  const [active,setActive]=useState('dashboard')
  const [mobileMenu,setMobileMenu]=useState(false)
  const [campanhas,setCampanhas]=useState<Campanha[]>(campanhasBase)
  const [questionarios,setQuestionarios]=useState<QuestionarioAdmin[]>(questionariosBase)
  const [relatorios,setRelatorios]=useState<Relatorio[]>(relatoriosBase)
  const [abrirNovaCampanha,setAbrirNovaCampanha]=useState(false)
  const [respondidas,setRespondidas]=useState<Record<string,string>>({})

  useEffect(()=>{
    if(!session || session.perfil==='Coordenador CPA'){setRespondidas({});return}
    const key=`cpa-demo-respostas-${session.perfil}`
    try{ setRespondidas(JSON.parse(localStorage.getItem(key)||'{}')) }catch{ setRespondidas({}) }
  },[session])

  function login(perfil:Perfil,nome:string){setSession({perfil,nome});setActive(perfil==='Coordenador CPA'?'dashboard':'minhas')}
  function logout(){setSession(null);setActive('dashboard');setMobileMenu(false)}
  function responder(id:string){
    if(!session || session.perfil==='Coordenador CPA') return
    const next={...respondidas,[id]:new Date().toLocaleDateString('pt-BR')}
    setRespondidas(next)
    localStorage.setItem(`cpa-demo-respostas-${session.perfil}`,JSON.stringify(next))
    setActive('respondidas')
  }
  function criarCampanha(c:Campanha){setCampanhas(v=>[c,...v])}
  function criarQuestionario(q:QuestionarioAdmin){setQuestionarios(v=>[q,...v])}
  function duplicarQuestionario(q:QuestionarioAdmin){setQuestionarios(v=>[{...q,id:`Q-${Date.now()}`,nome:`${q.nome} — cópia`,versao:q.versao+1,status:'Rascunho',usos:0,atualizado:new Date().toLocaleDateString('pt-BR')},...v])}
  function gerarRelatorio(r:Relatorio){setRelatorios(v=>[r,...v])}

  if(!session) return <Login onLogin={login}/>

  const admin=session.perfil==='Coordenador CPA'
  const items=admin?adminNav:participantNav
  const avaliacoes=admin?[]:avaliacoesPorPerfil[session.perfil as PerfilParticipante]
  const pendentes=admin?0:avaliacoes.filter(a=>statusPorPeriodo(a.inicio,a.fim)==='Ativa'&&!respondidas[a.id]).length

  let screen:ReactNode
  if(admin){
    if(active==='campanhas') screen=<Campanhas campanhas={campanhas} onCreate={criarCampanha} abrirNova={abrirNovaCampanha} onNovaAberta={()=>setAbrirNovaCampanha(false)}/>
    else if(active==='questionarios') screen=<Questionarios questionarios={questionarios} onCreate={criarQuestionario} onDuplicate={duplicarQuestionario}/>
    else if(active==='resultados') screen=<Resultados campanhas={campanhas}/>
    else if(active==='relatorios') screen=<Relatorios relatorios={relatorios} onGenerate={gerarRelatorio}/>
    else screen=<Dashboard campanhas={campanhas} onNovaCampanha={()=>{setActive('campanhas');setAbrirNovaCampanha(true)}}/>
  } else {
    screen=active==='respondidas'?<AvaliacoesRespondidas avaliacoes={avaliacoes} respondidas={respondidas}/>:<MinhasAvaliacoes avaliacoes={avaliacoes} respondidas={respondidas} onResponder={responder}/>
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5]">
      <aside className="desktop-sidebar fixed inset-y-0 left-0 w-[250px] border-r border-slate-200 z-40"><Navigation items={items} active={active} onChange={setActive} badge={pendentes} onLogout={logout}/></aside>
      <header className="mobile-header hidden sticky top-0 z-30 h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4"><button onClick={()=>setMobileMenu(true)} aria-label="Abrir menu" className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">{Icons.menu()}</button><div className="flex items-center gap-2"><IfceLogo className="w-12 h-10"/><div><p className="text-xs font-bold" style={{color:GREEN}}>Sistema CPA</p><p className="text-[10px] text-slate-400">Campus Tauá</p></div></div><span className="w-10"/></header>
      {mobileMenu&&<div className="fixed inset-0 z-[70] lg:hidden"><button aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/35" onClick={()=>setMobileMenu(false)}/><aside className="relative w-[280px] h-full shadow-2xl"><Navigation items={items} active={active} onChange={setActive} badge={pendentes} onLogout={logout} mobile onClose={()=>setMobileMenu(false)}/></aside></div>}
      <main className="page-shell min-h-screen px-7 py-7 lg:ml-[250px] xl:px-9">{screen}</main>
    </div>
  )
}
