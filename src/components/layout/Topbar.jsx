import { Bell, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function Topbar({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 bg-white flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', minHeight: '56px' }}>
      <div className="min-w-0 mr-3">
        <h1 className="text-[15px] md:text-[17px] font-bold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p className="text-[10px] md:text-[11px] mt-0.5 truncate hidden sm:block" style={{ color: 'var(--ink-3)' }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {actions}
        <div className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium"
          style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
          <Calendar size={12} />
          {format(new Date(), 'dd MMM yyyy')}
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-xl transition-all"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--ink-3)' }}>
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--rose)' }}></span>
        </button>
      </div>
    </div>
  )
}