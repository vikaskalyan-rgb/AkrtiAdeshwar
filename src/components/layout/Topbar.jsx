import { Calendar } from 'lucide-react'

export default function Topbar({ title, subtitle, actions }) {
  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="flex items-center justify-between px-4 md:px-6 bg-white flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', minHeight: '56px' }}>
      <div className="min-w-0 mr-3">
        <h1 className="text-[15px] md:text-[17px] font-bold truncate"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && (
          <p className="text-[10px] md:text-[11px] mt-0.5 truncate hidden sm:block"
            style={{ color: 'var(--ink-3)' }}>{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {actions}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium"
          style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
          <Calendar size={12} />
          {todayIST}
        </div>
      </div>
    </div>
  )
}