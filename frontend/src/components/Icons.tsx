import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = { width: 20, height: 20, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Icons = {
  dashboard: (p: P = {}) => <svg {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/></svg>,
  campaign: (p: P = {}) => <svg {...base} {...p}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  question: (p: P = {}) => <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M9.2 9a3 3 0 1 1 4.75 2.44c-1.16.83-1.95 1.3-1.95 2.56M12 17h.01"/></svg>,
  chart: (p: P = {}) => <svg {...base} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/></svg>,
  report: (p: P = {}) => <svg {...base} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>,
  edit: (p: P = {}) => <svg {...base} {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/></svg>,
  check: (p: P = {}) => <svg {...base} {...p}><path d="m5 12 4 4L19 6"/></svg>,
  logout: (p: P = {}) => <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  calendar: (p: P = {}) => <svg {...base} {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  clock: (p: P = {}) => <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  lock: (p: P = {}) => <svg {...base} {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
  eye: (p: P = {}) => <svg {...base} {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: (p: P = {}) => <svg {...base} {...p}><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10 10 0 0 1 12 4c7 0 11 8 11 8a16 16 0 0 1-2.1 3.1M6.1 6.1A17 17 0 0 0 1 12s4 8 11 8a9.5 9.5 0 0 0 4.1-.9"/></svg>,
  user: (p: P = {}) => <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>,
  student: (p: P = {}) => <svg {...base} {...p}><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v4c2 2 8 2 10 0v-4M21 9v5"/></svg>,
  tool: (p: P = {}) => <svg {...base} {...p}><path d="M14.7 6.3a4.5 4.5 0 0 0-5.8 5.8L3.5 17.5a2.1 2.1 0 0 0 3 3l5.4-5.4a4.5 4.5 0 0 0 5.8-5.8l-2.5 2.5-3-3 2.5-2.5Z"/></svg>,
  shield: (p: P = {}) => <svg {...base} {...p}><path d="M12 3 5 6v5c0 4.7 2.9 8.3 7 10 4.1-1.7 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>,
  menu: (p: P = {}) => <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  close: (p: P = {}) => <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>,
  search: (p: P = {}) => <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>,
  download: (p: P = {}) => <svg {...base} {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>,
  plus: (p: P = {}) => <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>,
  info: (p: P = {}) => <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>,
  arrow: (p: P = {}) => <svg {...base} {...p}><path d="M5 12h14M14 7l5 5-5 5"/></svg>,
}
