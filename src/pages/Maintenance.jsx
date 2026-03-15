import { useState, useMemo } from 'react'
import { months, flats, payments, getMonthSummary, MONTHLY_MAINTENANCE } from '../data/mockData'
import { StatusBadge, Modal, WhatsAppIcon } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import clsx from 'clsx'
import { CheckCircle2, XCircle, Search, Info } from 'lucide-react'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

export default function Maintenance() {
  const [selectedMonth, setSelectedMonth] = useState(months[5])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [view, setView] = useState('table')

  const summary = getMonthSummary(selectedMonth.month, selectedMonth.year)

  const monthPayments = useMemo(() => {
    return payments
      .filter(p => p.month === selectedMonth.month && p.year === selectedMonth.year)
      .map(p => ({ ...p, flat: flats.find(f => f.flatNo === p.flatNo) }))
      .filter(p => {
        const matchSearch = search === '' || p.flatNo.toLowerCase().includes(search.toLowerCase()) || p.payerName?.toLowerCase().includes(search.toLowerCase())
        return matchSearch && (filterStatus === 'all' || p.status === filterStatus)
      })
      .sort((a, b) => a.flatNo.localeCompare(b.flatNo))
  }, [selectedMonth, search, filterStatus])

  const defaulters = monthPayments.filter(p => p.status === 'unpaid')

  const statusStyle = {
    paid:   { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    unpaid: { bg: '#ffe4e6', color: '#9f1239', border: '#fca5a5' },
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar
        title="Maintenance"
        subtitle="Monthly payment tracking"
        actions={
          <button onClick={() => alert(`Reminders sent to ${defaulters.length} defaulters!`)} className="btn-whatsapp">
            <WhatsAppIcon size={13} />
            <span className="hidden sm:inline">Remind ({defaulters.length})</span>
            <span className="sm:hidden">{defaulters.length}</span>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--indigo)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--indigo)' }}>
            Admin view is read-only. Residents mark their own payments from the Resident Portal.
          </p>
        </div>

        {/* Month Tabs — horizontal scroll on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[...months].reverse().map(m => {
            const s = getMonthSummary(m.month, m.year)
            const pct = Math.round(s.collected / (s.total * MONTHLY_MAINTENANCE) * 100)
            const isActive = m.label === selectedMonth.label
            return (
              <button key={m.label} onClick={() => setSelectedMonth(m)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
                style={{
                  background: isActive ? 'var(--indigo)' : 'white',
                  color: isActive ? 'white' : 'var(--ink-2)',
                  border: `1px solid ${isActive ? 'var(--indigo)' : 'var(--border)'}`,
                  boxShadow: isActive ? '0 2px 6px rgba(91,82,240,0.25)' : 'none',
                }}>
                {m.label}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : pct >= 85 ? '#d1fae5' : pct >= 70 ? '#fef9c3' : '#ffe4e6',
                    color: isActive ? 'white' : pct >= 85 ? '#065f46' : pct >= 70 ? '#78350f' : '#9f1239',
                  }}>
                  {pct}%
                </span>
              </button>
            )
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: 'Collected', value: fmt(summary.collected), color: '#059669', bg: '#ecfdf5', sub: `${summary.paid} flats` },
            { label: 'Pending',   value: fmt(summary.pending),   color: '#e11d48', bg: '#fff1f2', sub: `${summary.unpaid} flats` },
            { label: 'Rate',      value: `${Math.round(summary.collected/(summary.total*MONTHLY_MAINTENANCE)*100)}%`, color: '#5b52f0', bg: '#eeeeff', sub: 'collection' },
            { label: 'Total',     value: summary.total,          color: '#0284c7', bg: '#f0f9ff', sub: 'billed flats' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold" style={{ background: s.bg, color: s.color }}>
                {s.value}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select flex-shrink-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <div className="hidden md:flex gap-1 rounded-xl p-1" style={{ background: 'white', border: '1px solid var(--border)' }}>
            {['table','wing'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize"
                style={{ background: view === v ? 'var(--indigo)' : 'transparent', color: view === v ? 'white' : 'var(--ink-3)' }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: card list | Desktop: table */}
        <div className="card overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid text-[10px] font-bold uppercase tracking-wide px-5 py-3"
            style={{ gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px', background: 'var(--surface-3)', color: 'var(--ink-3)', borderBottom: '1px solid var(--border)' }}>
            <span>Flat</span><span>Type</span><span>Payer</span><span>Wing</span><span>Amount</span><span>Paid On</span><span>Status</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 400px)' }}>
            {monthPayments.map(p => (
              <div key={p.id} onClick={() => setSelectedPayment(p)}
                className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>
                {/* Mobile card */}
                <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={p.status === 'paid' ? { background: '#d1fae5', color: '#065f46' } : { background: '#ffe4e6', color: '#9f1239' }}>
                    {p.flatNo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{p.payerName}</div>
                    <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{p.ownerType} · {p.flat?.wing} Wing</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold" style={{ color: p.status === 'paid' ? 'var(--emerald)' : 'var(--rose)' }}>
                      {p.status === 'paid' ? fmt(p.amount) : fmt(MONTHLY_MAINTENANCE)}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
                {/* Desktop row */}
                <div className="hidden md:grid items-center px-5 py-3"
                  style={{ gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px' }}>
                  <span className="text-[12px] font-bold font-mono" style={{ color: p.flat?.wing === 'North' ? 'var(--sky)' : 'var(--indigo)' }}>{p.flatNo}</span>
                  <span><span className="badge text-[9px]" style={p.ownerType === 'Rented' ? { background:'#fef9c3', color:'#78350f' } : p.ownerType === 'Vacant' ? { background:'#ffe4e6', color:'#9f1239' } : { background:'#eeeeff', color:'var(--indigo)' }}>{p.ownerType}</span></span>
                  <div className="min-w-0 pr-3">
                    <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>{p.payerName}</div>
                    <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{p.ownerType === 'Rented' ? 'Tenant pays' : p.ownerType === 'Vacant' ? 'Owner pays' : 'Owner-occupied'}</div>
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{p.flat?.wing}</span>
                  <span className="text-[12px] font-semibold" style={{ color: p.status === 'unpaid' ? 'var(--rose)' : 'var(--ink-2)' }}>{p.status === 'unpaid' ? '—' : fmt(p.amount)}</span>
                  <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{p.paidOn || '—'}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {monthPayments.length === 0 && <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No records found</div>}
          </div>
        </div>
      </div>

      <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)} title={`Flat ${selectedPayment?.flatNo} — ${selectedMonth.label}`}>
        {selectedPayment && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Flat', selectedPayment.flatNo],
                ['Type', selectedPayment.ownerType],
                ['Payer', selectedPayment.payerName],
                ['Role', selectedPayment.payerRole === 'tenant' ? 'Tenant' : 'Owner'],
                ['Owner', selectedPayment.ownerName],
                ['Status', <StatusBadge status={selectedPayment.status} />],
                ['Amount Due', fmt(MONTHLY_MAINTENANCE)],
                ['Paid On', selectedPayment.paidOn || '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
            {selectedPayment.status === 'unpaid' && (
              <>
                <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <Info size={14} style={{ color: 'var(--amber)' }} />
                  <span className="text-[12px]" style={{ color: '#78350f' }}>Only the resident/owner can mark this paid from the Resident Portal.</span>
                </div>
                <button onClick={() => alert(`Reminder sent to ${selectedPayment.payerName}!`)} className="btn-whatsapp w-full justify-center">
                  <WhatsAppIcon size={13} /> Send WhatsApp Reminder
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}