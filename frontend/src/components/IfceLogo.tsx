import logo from '../assets/ifce-ceara.png'

export default function IfceLogo({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <img
      src={logo}
      alt="Instituto Federal do Ceará"
      className={`${compact ? 'object-contain object-top' : 'object-contain'} ${className}`}
      draggable={false}
    />
  )
}
