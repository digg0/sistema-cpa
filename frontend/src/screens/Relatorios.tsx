import { useState } from 'react'
import { Card, CardHead, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import type { DashboardApi } from '../api/dashboard'
import { baixarRelatorio, type GerarRelatorioInput, type RelatorioApi } from '../api/relatorios'

function Trend({ title, historico, campo, color, suffix='%' }: { title:string; historico:DashboardApi['historico']; campo:'participacao'|'satisfacao'; color:string; suffix?:string }) {
  const values = historico.map(h => h[campo])
  if (values.length < 2) {
    return <Card className="p-5"><p className="text-sm font-bold text-slate-800 mb-1">{title}</p><p className="text-sm text-slate-400 py-8 text-center">Ainda não há histórico suficiente.</p></Card>
  }
  const W=360,H=110,pad=16
  const min=Math.min(...values)-2,max=Math.max(...values)+2
  const pts=values.map((v,i)=>({x:pad+i*((W-pad*2)/(values.length-1)),y:pad+(max-v)*((H-pad*2)/(max-min || 1)),v}))
  const path=pts.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')
  const last=values[values.length-1]
  const previous=values[values.length-2]
  const delta=last-previous
  return <Card className="p-5"><div className="flex items-start justify-between gap-3 mb-3"><div><p className="text-sm font-bold text-slate-800">{title}</p><p className="text-xs text-slate-400 mt-0.5">evolução semestral</p></div><div className="text-right"><p className="text-2xl font-bold" style={{color}}>{last.toFixed(1).replace('.',',')}{suffix}</p><p className="text-[11px] font-semibold" style={{ color: delta>=0?'#15803D':'#B45309' }}>{delta>=0?'↑':'↓'} {Math.abs(delta).toFixed(1).replace('.',',')} p.p.</p></div></div><svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[125px]"><path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3.5} fill={i===pts.length-1?color:'white'} stroke={color} strokeWidth="2"/>)}{historico.map((h,i)=><text key={h.sem} x={pts[i].x} y={H-1} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{h.sem}</text>)}</svg></Card>
}

function GerarModal({ onClose, onGenerate }: { onClose:()=>void; onGenerate:(input: GerarRelatorioInput)=>Promise<void> }) {
  const [tipo,setTipo]=useState('Semestral')
  const [formato,setFormato]=useState<'PDF'|'CSV'>('PDF')
  const [titulo,setTitulo]=useState('Relatório CPA')
  const [gerando,setGerando]=useState(false)
  const [erro,setErro]=useState('')

  async function submit(e:React.FormEvent){
    e.preventDefault()
    setErro('')
    setGerando(true)
    try{
      await onGenerate({ titulo: titulo.trim() || 'Relatório CPA', tipo, formato })
      onClose()
    }catch(error){
      setErro(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.')
    }finally{
      setGerando(false)
    }
  }

  return <Modal title="Gerar Relatório" sub="Crie um documento consolidado com dados anônimos." onClose={onClose} maxWidth="max-w-lg" footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose} disabled={gerando}>Cancelar</SecondaryButton><PrimaryButton disabled={gerando} onClick={()=>document.getElementById('gerar-relatorio-submit')?.click()}>{Icons.report({width:16,height:16})} {gerando?'Gerando…':'Gerar'}</PrimaryButton></div>}>
    <form onSubmit={submit} className="p-6 grid gap-4">
      <button id="gerar-relatorio-submit" type="submit" className="hidden"/>
      <div><label className="text-sm font-semibold text-slate-700">Título</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} disabled={gerando} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm disabled:bg-slate-50"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-semibold text-slate-700">Tipo</label><select value={tipo} onChange={e=>setTipo(e.target.value)} disabled={gerando} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>Semestral</option><option>Analítico</option><option>Institucional</option><option>Por questão</option></select></div>
        <div><label className="text-sm font-semibold text-slate-700">Formato</label><select value={formato} onChange={e=>setFormato(e.target.value as 'PDF'|'CSV')} disabled={gerando} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>PDF</option><option>CSV</option></select></div>
      </div>
      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-slate-600">O relatório consolida os indicadores atuais do painel. Dados individuais não são incluídos.</div>
      {erro && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</div>}
    </form>
  </Modal>
}

export default function Relatorios({ relatorios, historico, loading, error, onGenerate }: { relatorios:RelatorioApi[]; historico:DashboardApi['historico']; loading:boolean; error:string|null; onGenerate:(input: GerarRelatorioInput)=>Promise<void> }) {
  const [novo,setNovo]=useState(false)
  const [filtro,setFiltro]=useState('Todos')
  const [baixando,setBaixando]=useState<string|null>(null)
  const [erroBaixar,setErroBaixar]=useState('')
  const lista=relatorios.filter(r=>filtro==='Todos'||r.tipo===filtro)

  async function baixar(r: RelatorioApi){
    setBaixando(r.id)
    setErroBaixar('')
    try{
      await baixarRelatorio(r.id, r.titulo)
    }catch(err){
      setErroBaixar(err instanceof Error ? err.message : 'Não foi possível baixar o relatório.')
    }finally{
      setBaixando(null)
    }
  }

  return <div className="max-w-[1400px] mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{color:GREEN}}>Documentos e histórico</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Relatórios</h1><p className="text-sm text-slate-500 mt-1">Gere e acompanhe consolidados da CPA por ciclo.</p></div><PrimaryButton onClick={()=>setNovo(true)} disabled={loading}>{Icons.plus({width:17,height:17})} Gerar Relatório</PrimaryButton></div>

    <div className="responsive-grid-2 grid grid-cols-2 gap-4 mb-5">
      <Trend title="Tendência de Participação" historico={historico} campo="participacao" color="#2563EB"/>
      <Trend title="Tendência de Satisfação" historico={historico} campo="satisfacao" color="#2A7A3B"/>
    </div>

    {erroBaixar && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erroBaixar}</div>}

    <Card>
      <CardHead title="Documentos Gerados" sub={loading ? 'Carregando…' : 'Relatórios disponíveis'} right={<select value={filtro} onChange={e=>setFiltro(e.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Todos</option><option>Semestral</option><option>Analítico</option><option>Institucional</option><option>Por questão</option></select>}/>
      {loading && <div className="py-14 text-center"><div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-slate-200 border-t-green-700 animate-spin" /><p className="text-sm font-medium text-slate-500">Carregando relatórios…</p></div>}
      {!loading && error && <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {!loading && !error && (
        <div className="responsive-table"><table className="w-full min-w-[800px]"><thead><tr className="border-b border-slate-100">{['Documento','Tipo','Formato','Gerado em','Autor',''].map(h=><th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(r=><tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{background:r.formato==='PDF'?'#FDECEF':'#DCFCE7',color:r.formato==='PDF'?'#C8102E':'#166534'}}>{r.formato}</span><span className="text-sm font-semibold text-slate-800">{r.titulo}</span></div></td><td className="px-5 py-4 text-xs text-slate-500">{r.tipo}</td><td className="px-5 py-4 text-xs font-semibold text-slate-600">{r.formato}</td><td className="px-5 py-4 text-xs text-slate-400">{r.gerado}</td><td className="px-5 py-4 text-xs text-slate-500">{r.autor}</td><td className="px-5 py-4"><button onClick={()=>baixar(r)} disabled={baixando===r.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50">{Icons.download({width:14,height:14})} {baixando===r.id?'Baixando…':'Baixar'}</button></td></tr>)}</tbody></table>
        {lista.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Nenhum relatório encontrado.</div>}
        </div>
      )}
    </Card>
    {novo&&<GerarModal onClose={()=>setNovo(false)} onGenerate={onGenerate}/>}
  </div>
}
