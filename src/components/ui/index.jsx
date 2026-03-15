import clsx from 'clsx'
import { X } from 'lucide-react'

export function KpiCard({ label, value, sub, pill, pillType = 'green', accentColor }) {
  const pillColors = {
    green:  'badge-paid',
    red:    'badge-unpaid',
    amber:  'badge-partial',
    purple: 'badge-notice',
  }
  return (
    <div className="card relative overflow-hidden p-4">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />
      <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>{label}</div>
      <div className="font-bold leading-none mb-1" style={{ color: accentColor, letterSpacing: '-0.03em', fontSize: 'clamp(20px, 4vw, 28px)' }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{sub}</div>
      {pill && <span className={clsx('inline-block mt-2 badge', pillColors[pillType])}>{pill}</span>}
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    paid:          { label: 'Paid',        cls: 'badge-paid' },
    unpaid:        { label: 'Unpaid',      cls: 'badge-unpaid' },
    partial:       { label: 'Partial',     cls: 'badge-partial' },
    vacant:        { label: 'Vacant',      cls: 'badge-vacant' },
    open:          { label: 'Open',        cls: 'badge-open' },
    'in-progress': { label: 'In Progress', cls: 'badge-in-progress' },
    resolved:      { label: 'Resolved',    cls: 'badge-resolved' },
    notice:        { label: 'Notice',      cls: 'badge-notice' },
    event:         { label: 'Event',       cls: 'badge-event' },
    urgent:        { label: 'Urgent',      cls: 'badge-urgent' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'badge' }
  return <span className={clsx('badge', cls)}>{label}</span>
}

// Bottom sheet on mobile, centered modal on desktop
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(26,26,46,0.4)', backdropFilter: 'blur(4px)' }} />
      <div
        className={clsx('relative bg-white w-full md:w-auto rounded-t-3xl md:rounded-2xl animate-in md:mx-4', width)}
        style={{ boxShadow: '0 -8px 40px rgba(26,26,46,0.15)', maxHeight: '92dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-2)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5 pb-8 md:pb-5">{children}</div>
      </div>
    </div>
  )
}

export function WhatsAppIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export function WhatsAppButton({ onClick, label = 'Send Reminder', small = false }) {
  return (
    <button onClick={onClick} className={clsx('btn-whatsapp', small ? 'px-2 py-1.5' : 'px-3 py-2')}>
      <WhatsAppIcon size={small ? 11 : 13} />
      {!small && <span>{label}</span>}
    </button>
  )
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--ink-4)' }}>
      <Icon size={32} strokeWidth={1} className="mb-3" />
      <p className="text-[13px]">{message}</p>
    </div>
  )
}