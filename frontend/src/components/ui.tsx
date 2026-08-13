import type { ReactNode } from 'react'
import { Icons } from './Icons'

export const GREEN = '#2A7A3B'
export const GREEN_D = '#1E5C2C'
export const GREEN_L = '#EAF4EC'
export const RED = '#C8102E'
export const BLUE = '#2563EB'
export const PURPLE = '#7C3AED'
export const AMBER = '#D97706'
export const SLATE = '#64748B'

export const STATUS: Record<string, { bg: string; text: string; dot?: string }> = {
  Ativa: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  Agendada: { bg: '#DBEAFE', text: '#1D4ED8', dot: '#60A5FA' },
  Encerrada: { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
  Publicado: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
  Rascunho: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  Pendente: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  Respondida: { bg: '#ECFDF5', text: '#047857', dot: '#10B981' },
  Disponível: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>{children}</section>
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-slate-100">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export function Badge({ status }: { status: string }) {
  const s = STATUS[status] ?? { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
      {s.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />}
      {status}
    </span>
  )
}

export function Progress({ value, color = GREEN }: { value: number; color?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${safe}%`, background: color }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums font-medium text-slate-500">{safe}%</span>
    </div>
  )
}

export function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-50 ${className}`}
      style={{ background: disabled ? '#94A3B8' : GREEN }}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, type = 'button', disabled = false, className = '' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 ${className}`}>
      {children}
    </button>
  )
}

export function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return <button aria-label={label} title={label} onClick={onClick} className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">{children}</button>
}

export function Modal({ title, sub, children, footer, onClose, maxWidth = 'max-w-2xl' }: { title: string; sub?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fechar modal" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] cursor-default" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200`}>
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{title}</h2>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose}>{Icons.close({ width: 18, height: 18 })}</IconButton>
        </div>
        <div className="overflow-y-auto max-h-[68vh]">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">{footer}</div>}
      </div>
    </div>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="animate-toast fixed right-5 bottom-5 z-[100] max-w-sm flex items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-300">{Icons.check({ width: 14, height: 14, strokeWidth: 2.4 })}</span>
      <span className="flex-1 leading-5">{message}</span>
      <button aria-label="Fechar aviso" onClick={onClose} className="text-slate-400 hover:text-white">×</button>
    </div>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">{Icons.info()}</div>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{text}</p>
    </div>
  )
}
