import { useState, useEffect, useMemo } from 'react'
import { StatusBadge, Modal, WhatsAppIcon } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import { Search, Info, CheckCircle2,CreditCard } from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const MONTHS = [
  { month:10, year:2024, label:'Oct 2024' },
  { month:11, year:2024, label:'Nov 2024' },
  { month:12, year:2024, label:'Dec 2024' },
  { month:1,  year:2025, label:'Jan 2025' },
  { month:2,  year:2025, label:'Feb 2025' },
  { month:3,  year:2025, label:'Mar 2025' },
  { month:3,  year:2026, label:'Mar 2026' },
]

const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

export default function Maintenance() {
  const { user } = useAuth()
  const now = new Date()

  const [selectedMonth, setSelectedMonth] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    label: 'Mar 2026'
  })
  const [payments, setPayments]         = useState([])
  const [summary, setSummary]           = useState({})
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [view, setView]                 = useState('table')
  const [sendingReminders, setSendingReminders] = useState(false)

  // Admin pay own flat
  const [adminPayMode, setAdminPayMode]         = useState('UPI')
  const [adminPayRef, setAdminPayRef]           = useState('')
  const [adminPaySubmitting, setAdminPaySubmitting] = useState(false)
  const [adminPaySuccess, setAdminPaySuccess]   = useState(false)

  useEffect(() => { fetchPayments() }, [selectedMonth])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get(`/api/maintenance?month=${selectedMonth.month}&year=${selectedMonth.year}`),
        api.get(`/api/maintenance/summary?month=${selectedMonth.month}&year=${selectedMonth.year}`),
      ])
      setPayments(paymentsRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error('Error fetching maintenance:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminders = async () => {
    setSendingReminders(true)
    try {
      const res = await api.post(
        `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}`)
      alert(res.data.message)
    } catch (err) {
      alert('Failed to send reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  const handleAdminMarkPaid = async () => {
    if (!selectedPayment) return
    setAdminPaySubmitting(true)
    try {
      await api.post(
        `/api/maintenance/flat/${selectedPayment.flatNo}/pay?month=${selectedPayment.month}&year=${selectedPayment.year}`,
        {
          paymentMode:    adminPayMode.toUpperCase().replace(' ', '_'),
          transactionRef: adminPayRef,
        }
      )
      await fetchPayments()
      setAdminPaySuccess(true)
      setTimeout(() => {
        setAdminPaySuccess(false)
        setSelectedPayment(null)
        setAdminPayRef('')
        setAdminPayMode('UPI')
      }, 2000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment')
    } finally {
      setAdminPaySubmitting(false)
    }
  }

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        const matchSearch = search === '' ||
          p.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
          p.payerName?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'all' ||
          p.status?.toLowerCase() === filterStatus
        return matchSearch && matchStatus
      })
      .sort((a, b) => a.flatNo?.localeCompare(b.flatNo))
  }, [payments, search, filterStatus])

  const defaulters    = payments.filter(p => p.status === 'UNPAID')
  const MONTHLY_AMOUNT = summary.monthlyAmount || 4200
  const pct = summary.total
    ? Math.round((summary.collected || 0) / (summary.total * MONTHLY_AMOUNT) * 100)
    : 0

  const statusStyle = {
    PAID:   { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    UNPAID: { bg: '#ffe4e6', color: '#9f1239', border: '#fca5a5' },
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar
  title="Maintenance"
  subtitle="Monthly payment tracking"
  actions={
    <div className="flex items-center gap-2">
      {/* Mark My Payment — only for admins who have a flat */}
      {user?.flatNo && (() => {
        const myPay = payments.find(p => p.flatNo === user.flatNo)
        if (!myPay) return null
        if (myPay.status === 'PAID') return (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background:'#ecfdf5', color:'var(--emerald)', border:'1px solid #6ee7b7' }}>
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">Flat {user.flatNo} Paid ✓</span>
          </div>
        )
        return (
          <button
            onClick={() => setSelectedPayment(myPay)}
            className="btn-primary">
            <CreditCard size={13} />
            <span className="hidden sm:inline">Pay Flat {user.flatNo}</span>
            <span className="sm:hidden">Pay Mine</span>
          </button>
        )
      })()}

      {/* Send reminders */}
      <button onClick={handleSendReminders} disabled={sendingReminders}
        className="btn-whatsapp">
        <WhatsAppIcon size={13} />
        <span className="hidden sm:inline">
          {sendingReminders ? 'Sending...' : `Remind (${defaulters.length})`}
        </span>
        <span className="sm:hidden">{defaulters.length}</span>
      </button>
    </div>
  }
/>
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--indigo)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--indigo)' }}>
            Admin view is read-only. Residents mark their own payments from the Resident Portal.
            {user?.flatNo && ' Admins can mark their own flat payment by clicking on it.'}
          </p>
        </div>

        {/* Month Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[...MONTHS].reverse().map(m => {
            const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
            return (
              <button key={m.label} onClick={() => setSelectedMonth(m)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
                style={{
                  background: isActive ? 'var(--indigo)' : 'white',
                  color:      isActive ? 'white' : 'var(--ink-2)',
                  border:     `1px solid ${isActive ? 'var(--indigo)' : 'var(--border)'}`,
                  boxShadow:  isActive ? '0 2px 6px rgba(91,82,240,0.25)' : 'none',
                }}>
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label:'Collected', value:fmt(summary.collected||0), color:'#059669', bg:'#ecfdf5', sub:`${summary.paid||0} flats` },
            { label:'Pending',   value:fmt(summary.pending||0),   color:'#e11d48', bg:'#fff1f2', sub:`${summary.unpaid||0} flats` },
            { label:'Rate',      value:`${pct}%`,                 color:'#5b52f0', bg:'#eeeeff', sub:'collection rate' },
            { label:'Total',     value:summary.total||0,          color:'#0284c7', bg:'#f0f9ff', sub:'billed flats' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                style={{ background:s.bg, color:s.color }}>
                {s.value}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color:'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat or payer..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select flex-shrink-0" value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <div className="hidden md:flex gap-1 rounded-xl p-1"
            style={{ background:'white', border:'1px solid var(--border)' }}>
            {['table','wing'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize"
                style={{
                  background: view===v ? 'var(--indigo)' : 'transparent',
                  color:      view===v ? 'white' : 'var(--ink-3)'
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>
            Loading payments...
          </div>
        ) : view === 'table' ? (
          <div className="card overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid text-[10px] font-bold uppercase tracking-wide px-5 py-3"
              style={{
                gridTemplateColumns: '70px 110px 1fr 90px 100px 100px 90px',
                background:'var(--surface-3)', color:'var(--ink-3)',
                borderBottom:'1px solid var(--border)'
              }}>
              <span>Flat</span>
              <span>Type</span>
              <span>Payer</span>
              <span>Wing</span>
              <span>Amount</span>
              <span>Paid On</span>
              <span>Status</span>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight:'calc(100dvh - 400px)' }}>
              {filteredPayments.map(p => {
                const isMyFlat = user?.flatNo === p.flatNo
                return (
                  <div key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isMyFlat ? '#f5f3ff' : undefined
                    }}>

                    {/* Mobile */}
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={p.status==='PAID'
                          ? {background:'#d1fae5',color:'#065f46'}
                          : {background:'#ffe4e6',color:'#9f1239'}}>
                        {p.flatNo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>
                            {p.payerName}
                          </div>
                          {isMyFlat && (
                            <span className="badge text-[9px]"
                              style={{ background:'var(--indigo-lt)', color:'var(--indigo)' }}>
                              My Flat
                            </span>
                          )}
                        </div>
                        <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                          {p.ownerType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-bold"
                          style={{ color:p.status==='PAID'?'var(--emerald)':'var(--rose)' }}>
                          {p.status==='PAID' ? fmt(p.amount) : fmt(MONTHLY_AMOUNT)}
                        </div>
                        <StatusBadge status={p.status?.toLowerCase()} />
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:grid items-center px-5 py-3"
                      style={{ gridTemplateColumns:'70px 110px 1fr 90px 100px 100px 90px' }}>
                      <span className="text-[12px] font-bold font-mono"
                        style={{ color:'var(--indigo)' }}>
                        {p.flatNo}
                        {isMyFlat && (
                          <span className="ml-1 text-[8px] font-bold px-1 py-0.5 rounded"
                            style={{ background:'var(--indigo-lt)', color:'var(--indigo)' }}>
                            ME
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="badge text-[9px]"
                          style={
                            p.ownerType==='RENTED'
                              ? {background:'#fef9c3',color:'#78350f'}
                              : p.ownerType==='VACANT'
                              ? {background:'#ffe4e6',color:'#9f1239'}
                              : {background:'#eeeeff',color:'var(--indigo)'}
                          }>
                          {p.ownerType}
                        </span>
                      </span>
                      <div className="min-w-0 pr-3">
                        <div className="text-[12px] font-medium truncate"
                          style={{ color:'var(--ink)' }}>{p.payerName}</div>
                        <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                          {p.ownerType==='RENTED'
                            ? 'Tenant pays'
                            : p.ownerType==='VACANT'
                            ? 'Owner pays (vacant)'
                            : 'Owner-occupied'}
                        </div>
                      </div>
                      <span className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                        {['A','B','C','D','E','F'].includes(p.flatNo?.slice(-1)) ? 'North' : 'South'}
                      </span>
                      <span className="text-[12px] font-semibold"
                        style={{ color:p.status==='UNPAID'?'var(--rose)':'var(--ink-2)' }}>
                        {p.status==='UNPAID' ? '—' : fmt(p.amount)}
                      </span>
                      <span className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                        {p.paidOn || '—'}
                      </span>
                      <StatusBadge status={p.status?.toLowerCase()} />
                    </div>
                  </div>
                )
              })}
              {filteredPayments.length === 0 && (
                <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>
                  No records found
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Wing view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name:'South Wing', units:['A','B','C','D','E','F'], color:'var(--sky)' },
              { name:'North Wing', units:['G','H','J','K'],         color:'var(--indigo)' },
            ].map(wing => (
              <div key={wing.name} className="card">
                <div className="card-header">
                  <span className="card-title" style={{ color:wing.color }}>{wing.name}</span>
                </div>
                <div className="p-4">
                  {[1,2,3,4].map(floor => (
                    <div key={floor} className="mb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
                        style={{ color:'var(--ink-4)' }}>Floor {floor}</div>
                      <div className="flex gap-2 flex-wrap">
                        {wing.units.map(unit => {
                          const flatNo = `${floor}${unit}`
                          const pay    = payments.find(p => p.flatNo === flatNo)
                          const st     = pay?.status || 'UNPAID'
                          const ss     = statusStyle[st] || statusStyle.UNPAID
                          const isMe   = user?.flatNo === flatNo
                          return (
                            <div key={flatNo}
                              onClick={() => pay && setSelectedPayment(pay)}
                              className="w-16 h-16 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                              style={{
                                background: isMe ? 'var(--indigo-lt)' : ss.bg,
                                border: `2px solid ${isMe ? 'var(--indigo)' : ss.border}`
                              }}>
                              <span className="text-[11px] font-bold font-mono"
                                style={{ color: isMe ? 'var(--indigo)' : ss.color }}>
                                {flatNo}
                              </span>
                              <StatusBadge status={st.toLowerCase()} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <Modal open={!!selectedPayment} onClose={() => {
        setSelectedPayment(null)
        setAdminPayMode('UPI')
        setAdminPayRef('')
        setAdminPaySuccess(false)
      }} title={`Flat ${selectedPayment?.flatNo} — ${selectedMonth.label}`}>
        {selectedPayment && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Flat',         selectedPayment.flatNo],
                ['Type',         selectedPayment.ownerType],
                ['Payer',        selectedPayment.payerName],
                ['Payer Role',   selectedPayment.payerRole],
                ['Owner',        selectedPayment.ownerName],
                ['Owner Phone',  selectedPayment.ownerPhone],
                ['Status',       <StatusBadge status={selectedPayment.status?.toLowerCase()} />],
                ['Amount Due',   fmt(MONTHLY_AMOUNT)],
                ['Paid On',      selectedPayment.paidOn || '—'],
                ['Payment Mode', selectedPayment.paymentMode || '—'],
              ].map(([k,v]) => (
                <div key={k} className="rounded-xl p-3"
                  style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                    style={{ color:'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            {selectedPayment.status === 'UNPAID' && (
              <>
                {/* Admin paying THEIR OWN flat */}
                {user?.flatNo === selectedPayment.flatNo ? (
                  <div className="space-y-3">
                    <div className="rounded-xl p-3 flex items-center gap-2"
                      style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
                      <Info size={14} style={{ color:'var(--indigo)' }} />
                      <span className="text-[12px]" style={{ color:'var(--indigo)' }}>
                        This is your flat. You can mark it paid directly.
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
                        style={{ color:'var(--ink-2)' }}>Payment Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_MODES.map(m => (
                          <button key={m} onClick={() => setAdminPayMode(m)}
                            className="py-2 rounded-xl text-[12px] font-semibold transition-all"
                            style={adminPayMode === m
                              ? { background:'var(--indigo)', color:'white', border:'1px solid var(--indigo)' }
                              : { background:'var(--surface-3)', color:'var(--ink-2)', border:'1px solid var(--border)' }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                        style={{ color:'var(--ink-2)' }}>
                        Reference <span style={{ color:'var(--ink-4)' }}>(optional)</span>
                      </label>
                      <input className="input" placeholder="UPI ID, receipt no., etc."
                        value={adminPayRef} onChange={e => setAdminPayRef(e.target.value)} />
                    </div>

                    {adminPaySuccess ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ background:'#ecfdf5', border:'1px solid #6ee7b7' }}>
                        <CheckCircle2 size={16} style={{ color:'var(--emerald)' }} />
                        <span className="text-[13px] font-semibold" style={{ color:'var(--emerald)' }}>
                          Payment Recorded! ✓
                        </span>
                      </div>
                    ) : (
                      <button onClick={handleAdminMarkPaid} disabled={adminPaySubmitting}
                        className="btn-primary w-full justify-center">
                        <CheckCircle2 size={14} />
                        {adminPaySubmitting ? 'Recording...' : 'Mark My Payment Paid'}
                      </button>
                    )}
                  </div>
                ) : (
                  /* Other flat — read only + WhatsApp reminder */
                  <>
                    <div className="rounded-xl p-3 flex items-center gap-2"
                      style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                      <Info size={14} style={{ color:'var(--amber)' }} />
                      <span className="text-[12px]" style={{ color:'#78350f' }}>
                        Only the resident/owner can mark this paid from the Resident Portal.
                      </span>
                    </div>
                    <button
                      onClick={() => alert(`Reminder sent to ${selectedPayment.payerName}!`)}
                      className="btn-whatsapp w-full justify-center">
                      <WhatsAppIcon size={13} /> Send WhatsApp Reminder
                    </button>
                  </>
                )}
              </>
            )}

            {selectedPayment.status === 'PAID' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background:'#ecfdf5', border:'1px solid #6ee7b7' }}>
                <CheckCircle2 size={14} style={{ color:'var(--emerald)' }} />
                <span className="text-[12px] font-medium" style={{ color:'#065f46' }}>
                  Paid on {selectedPayment.paidOn} via {selectedPayment.paymentMode}
                  {selectedPayment.transactionRef && ` · Ref: ${selectedPayment.transactionRef}`}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}