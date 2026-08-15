import { useState } from 'react'
import { Card, CardHead, GREEN, Modal, PrimaryButton, SecondaryButton } from '../components/ui'
import { Icons } from '../components/Icons'
import { historico, type Relatorio } from '../data/mock'

function Trend({ title, values, color, suffix='%' }: { title:string; values:number[]; color:string; suffix?:string }) {
  const W=360,H=110,pad=16
  const min=Math.min(...values)-2,max=Math.max(...values)+2
  const pts=values.map((v,i)=>({x:pad+i*((W-pad*2)/(values.length-1)),y:pad+(max-v)*((H-pad*2)/(max-min)),v}))
  const path=pts.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')
  const last=values[values.length-1]
  const previous=values[values.length-2]
  const delta=last-previous
  return <Card className="p-5"><div className="flex items-start justify-between gap-3 mb-3"><div><p className="text-sm font-bold text-slate-800">{title}</p><p className="text-xs text-slate-400 mt-0.5">evolução semestral</p></div><div className="text-right"><p className="text-2xl font-bold" style={{color}}>{last.toFixed(1).replace('.',',')}{suffix}</p><p className="text-[11px] font-semibold text-green-700">↑ {delta.toFixed(1).replace('.',',')} p.p.</p></div></div><svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[125px]"><path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3.5} fill={i===pts.length-1?color:'white'} stroke={color} strokeWidth="2"/>)}{historico.map((h,i)=><text key={h.sem} x={pts[i].x} y={H-1} textAnchor="middle" fontSize="8.5" fill="#94A3B8">{h.sem}</text>)}</svg></Card>
}

function GerarModal({ onClose, onGenerate }: { onClose:()=>void; onGenerate:(r:Relatorio)=>void }) {
  const [tipo,setTipo]=useState('Semestral')
  const [formato,setFormato]=useState<'PDF'|'CSV'>('PDF')
  const [titulo,setTitulo]=useState('Relatório CPA 2026.2')
  function submit(e:React.FormEvent){e.preventDefault(); onGenerate({id:`R-${Date.now()}`,titulo:titulo.trim()||'Relatório CPA 2026.2',tipo,formato,gerado:new Date().toLocaleDateString('pt-BR'),autor:'Coordenação CPA'})}
  return <Modal title="Gerar Relatório" sub="Crie um documento consolidado com dados anônimos." onClose={onClose} maxWidth="max-w-lg" footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose}>Cancelar</SecondaryButton><PrimaryButton onClick={()=>document.getElementById('gerar-relatorio-submit')?.click()}>{Icons.report({width:16,height:16})} Gerar</PrimaryButton></div>}><form onSubmit={submit} className="p-6 grid gap-4"><button id="gerar-relatorio-submit" type="submit" className="hidden"/><div><label className="text-sm font-semibold text-slate-700">Título</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"/></div><div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-semibold text-slate-700">Tipo</label><select value={tipo} onChange={e=>setTipo(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>Semestral</option><option>Analítico</option><option>Institucional</option><option>Por questão</option></select></div><div><label className="text-sm font-semibold text-slate-700">Formato</label><select value={formato} onChange={e=>setFormato(e.target.value as 'PDF'|'CSV')} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option>PDF</option><option>CSV</option></select></div></div><div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-xs text-slate-600">O protótipo registra a geração do relatório e permite baixar uma versão demonstrativa. Dados individuais não são incluídos.</div></form></Modal>
}

function normalizeAscii(value:string){
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'')
}

function createSimplePdf(r:Relatorio){
  const lines=[
    normalizeAscii(r.titulo),
    'IFCE - Campus Taua | Sistema CPA',
    `Tipo: ${normalizeAscii(r.tipo)} | Gerado em: ${r.gerado}`,
    '',
    'Indicadores demonstrativos:',
    'Participacao geral: 68,4%',
    'Satisfacao geral: 75,4%',
    'Respostas consolidadas: 3.241',
    '',
    'Documento de demonstracao. Dados individuais nao sao exibidos.',
  ]
  const escape=(v:string)=>v.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
  const content=['BT','/F1 16 Tf','60 780 Td',...lines.flatMap((line,i)=> i===0?[`(${escape(line)}) Tj`]:['0 -24 Td',`(${escape(line)}) Tj`]),'ET'].join('\n')
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf='%PDF-1.4\n'
  const offsets=[0]
  objects.forEach((obj,i)=>{ offsets[i+1]=pdf.length; pdf+=`${i+1} 0 obj\n${obj}\nendobj\n` })
  const xref=pdf.length
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`
  for(let i=1;i<=objects.length;i++) pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf],{type:'application/pdf'})
}

function downloadDemo(r:Relatorio){
  let blob:Blob
  let extension:string
  if(r.formato==='CSV'){
    blob=new Blob(['Indicador;Valor\nParticipacao;68,4%\nSatisfacao;75,4%\nRespostas;3241\n'],{type:'text/csv;charset=utf-8'})
    extension='csv'
  }else{
    blob=createSimplePdf(r)
    extension='pdf'
  }
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=`${r.titulo.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}.${extension}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Relatorios({ relatorios, onGenerate }: { relatorios:Relatorio[]; onGenerate:(r:Relatorio)=>void }) {
  const [novo,setNovo]=useState(false)
  const [filtro,setFiltro]=useState('Todos')
  const lista=relatorios.filter(r=>filtro==='Todos'||r.tipo===filtro)
  return <div className="max-w-[1400px] mx-auto"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"><div><p className="text-xs uppercase tracking-[0.16em] font-bold" style={{color:GREEN}}>Documentos e histórico</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">Relatórios</h1><p className="text-sm text-slate-500 mt-1">Gere e acompanhe consolidados da CPA por ciclo.</p></div><PrimaryButton onClick={()=>setNovo(true)}>{Icons.plus({width:17,height:17})} Gerar Relatório</PrimaryButton></div><div className="responsive-grid-2 grid grid-cols-2 gap-4 mb-5"><Trend title="Tendência de Participação" values={historico.map(h=>h.participacao)} color="#2563EB"/><Trend title="Tendência de Satisfação" values={historico.map(h=>h.satisfacao)} color="#2A7A3B"/></div><Card><CardHead title="Documentos Gerados" sub="Relatórios demonstrativos disponíveis no protótipo" right={<select value={filtro} onChange={e=>setFiltro(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><option>Todos</option><option>Semestral</option><option>Analítico</option><option>Institucional</option><option>Por questão</option></select>}/><div className="responsive-table"><table className="w-full min-w-[800px]"><thead><tr className="border-b border-slate-100">{['Documento','Tipo','Formato','Gerado em','Autor',''].map(h=><th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead><tbody>{lista.map(r=><tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{background:r.formato==='PDF'?'#FDECEF':'#DCFCE7',color:r.formato==='PDF'?'#C8102E':'#166534'}}>{r.formato}</span><span className="text-sm font-semibold text-slate-800">{r.titulo}</span></div></td><td className="px-5 py-4 text-xs text-slate-500">{r.tipo}</td><td className="px-5 py-4 text-xs font-semibold text-slate-600">{r.formato}</td><td className="px-5 py-4 text-xs text-slate-400">{r.gerado}</td><td className="px-5 py-4 text-xs text-slate-500">{r.autor}</td><td className="px-5 py-4"><button onClick={()=>downloadDemo(r)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">{Icons.download({width:14,height:14})} Baixar</button></td></tr>)}</tbody></table></div></Card>{novo&&<GerarModal onClose={()=>setNovo(false)} onGenerate={r=>{onGenerate(r);setNovo(false)}}/>}</div>
}
