import { useState, useEffect, useMemo } from 'react'
import { StatusBadge, Modal } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import { CheckCircle2, Search, Info, Mail } from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

// Full format for modals and tables
function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

// Compact format for wing tiles — show exact amount, no K rounding
function fmtTile(n) {
  if (!n) return '₹4,200'
  return `₹${n.toLocaleString('en-IN')}`
}
function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
    })
  }
  return months
}

const MONTHS = getLast6Months()

export default function Maintenance() {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth]       = useState(MONTHS[0])
  const [payments, setPayments]                 = useState([])
  const [summary, setSummary]                   = useState({})
  const [loading, setLoading]                   = useState(true)
  const [search, setSearch]                     = useState('')
  const [filterStatus, setFilterStatus]         = useState('all')
  const [selectedPayment, setSelectedPayment]   = useState(null)
  const [view, setView]                         = useState('wing')
  const [sendingReminders, setSendingReminders] = useState(false)
  const [markingPaid, setMarkingPaid]           = useState(false)
  const [reminderResult, setReminderResult]     = useState(null)

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
    setReminderResult(null)
    try {
      const res = await api.post(
        `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}`
      )
      setReminderResult({ message: res.data.message, success: true })
      setTimeout(() => setReminderResult(null), 5000)
    } catch (err) {
      alert('Failed to send reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  const handleMarkOwnFlat = async () => {
    if (!user?.flatNo) return
    setMarkingPaid(true)
    try {
      await api.post(
        `/api/maintenance/flat/${user.flatNo}/pay?month=${selectedMonth.month}&year=${selectedMonth.year}`,
        { paymentMode: 'UPI', transactionRef: '' }
      )
      await fetchPayments()
      setSelectedPayment(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment')
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleSendSingleReminder = async (payment) => {
    try {
      const res = await api.post(
        `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}&flatNo=${payment.flatNo}`
      )
      const sent = res.data.sent ?? 0
      setReminderResult({
        message: sent > 0
          ? `✓ Reminder emailed to flat ${payment.flatNo}`
          : `⚠ No email registered for flat ${payment.flatNo} — update in Flat Management`,
        success: sent > 0,
      })
      setSelectedPayment(null)
      setTimeout(() => setReminderResult(null), 5000)
    } catch {
      alert('Failed to send reminder')
    }
  }

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        const matchSearch = search === '' ||
          p.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
          p.payerName?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = filterStatus === 'all' || p.status?.toLowerCase() === filterStatus
        return matchSearch && matchStatus
      })
      .sort((a, b) => a.flatNo?.localeCompare(b.flatNo))
  }, [payments, search, filterStatus])

  const defaulters     = payments.filter(p => p.status === 'UNPAID')
  const MONTHLY_AMOUNT = summary.monthlyAmount || 4200
  const pct = summary.total
    ? Math.round((summary.collected || 0) / (summary.total * MONTHLY_AMOUNT) * 100)
    : 0

  const statusStyle = {
    PAID:   { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
    UNPAID: { bg: '#ffe4e6', color: '#9f1239', border: '#fca5a5' },
  }

  const isAdminFlat = (flatNo) => flatNo === user?.flatNo

  const wingPaymentMap = useMemo(() => {
    const map = {}
    payments.forEach(p => { map[p.flatNo] = p })
    return map
  }, [payments])

  const flatMatchesFilter = (flatNo) => {
    const p = wingPaymentMap[flatNo]
    const st = p?.status || 'UNPAID'
    const matchSearch = search === '' ||
      flatNo.toLowerCase().includes(search.toLowerCase()) ||
      p?.payerName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || st.toLowerCase() === filterStatus
    return matchSearch && matchStatus
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar
        title="Maintenance"
        subtitle="Monthly payment tracking"
        actions={
          <div className="flex items-center gap-2">
            {user?.flatNo && (() => {
              const myPay = payments.find(p => p.flatNo === user.flatNo)
              return myPay?.status === 'UNPAID' ? (
                <button onClick={() => setSelectedPayment(myPay)}
                  className="btn-primary text-[11px] px-3 py-1.5">
                  Pay Flat {user.flatNo}
                </button>
              ) : null
            })()}
            <button onClick={handleSendReminders} disabled={sendingReminders}
              className="btn-primary">
              <Mail size={13} />
              {sendingReminders ? 'Sending...' : `Email Remind (${defaulters.length})`}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Reminder result banner */}
        {reminderResult && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: reminderResult.success ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${reminderResult.success ? '#6ee7b7' : '#fde68a'}`,
            }}>
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: reminderResult.success ? 'var(--emerald)' : 'var(--amber)', flexShrink: 0 }} />
              <span className="text-[12px] font-medium"
                style={{ color: reminderResult.success ? '#065f46' : '#78350f' }}>
                {reminderResult.message}
              </span>
            </div>
            <button onClick={() => setReminderResult(null)}
              className="text-[16px] leading-none font-bold"
              style={{ color: reminderResult.success ? '#065f46' : '#78350f' }}>×</button>
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--indigo)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--indigo)' }}>
            Admin view is read-only. Residents mark their own payments from the Resident Portal.
            Admins can mark their own flat payment by clicking on it.
          </p>
        </div>

        {/* Month Tabs — last 6 months, dynamic */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MONTHS.map(m => {
            const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
            return (
              <button key={m.label} onClick={() => setSelectedMonth(m)}
                className="px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
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

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: 'Collected', value: fmt(summary.collected || 0), color: '#059669', bg: '#ecfdf5', sub: `${summary.paid || 0} flats` },
            { label: 'Pending',   value: fmt(summary.pending   || 0), color: '#e11d48', bg: '#fff1f2', sub: `${summary.unpaid || 0} flats` },
            { label: 'Rate',      value: `${pct}%`,                   color: '#5b52f0', bg: '#eeeeff', sub: 'collection rate' },
            { label: 'Total',     value: summary.total || 0,          color: '#0284c7', bg: '#f0f9ff', sub: 'billed flats' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                style={{ background: s.bg, color: s.color }}>
                {s.value}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: 'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9"
              placeholder="Search flat or name..."
              value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Status filter buttons */}
          <div className="flex gap-1 rounded-xl p-1"
            style={{ background: 'white', border: '1px solid var(--border)' }}>
            {[
              { v: 'all',    l: 'All' },
              { v: 'paid',   l: '✓ Paid' },
              { v: 'unpaid', l: '✗ Unpaid' },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: filterStatus === v
                    ? v === 'paid'   ? 'var(--emerald)'
                    : v === 'unpaid' ? 'var(--rose)'
                    :                  'var(--indigo)'
                    : 'transparent',
                  color: filterStatus === v ? 'white' : 'var(--ink-3)',
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 rounded-xl p-1"
            style={{ background: 'white', border: '1px solid var(--border)' }}>
            {[{ v: 'wing', l: 'Wing' }, { v: 'table', l: 'Table' }].map(({ v, l }) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: view === v ? 'var(--indigo)' : 'transparent',
                  color:      view === v ? 'white' : 'var(--ink-3)',
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>Loading payments...</div>

        ) : view === 'wing' ? (
          /* ── Wing View with search ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'North Wing', units: ['A','B','C','D','E','F'], color: 'var(--sky)',    lightBg: '#f0f9ff', border: '#bae6fd' },
              { name: 'South Wing', units: ['G','H','J','K'],         color: 'var(--indigo)', lightBg: '#eeeeff', border: 'var(--indigo-md)' },
            ].map(wing => {
              const wingPaid   = payments.filter(p => wing.units.includes(p.flatNo?.slice(-1)) && p.status === 'PAID').length
              const wingUnpaid = payments.filter(p => wing.units.includes(p.flatNo?.slice(-1)) && p.status === 'UNPAID').length
              const hasVisible = wing.units.some(unit =>
                [1,2,3,4].some(floor => flatMatchesFilter(`${floor}${unit}`))
              )

              return (
                <div key={wing.name} className="card overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ background: wing.lightBg, borderBottom: `1px solid ${wing.border}` }}>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: wing.color }}>
                        {wing.name}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        Units: {wing.units.join(', ')} · Floors 1–4
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold">
                      <span style={{ color: 'var(--emerald)' }}>✓ {wingPaid} paid</span>
                      <span style={{ color: 'var(--rose)' }}>✗ {wingUnpaid} unpaid</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {!hasVisible ? (
                      <div className="py-6 text-center text-[12px]"
                        style={{ color: 'var(--ink-4)' }}>
                        No flats match your search/filter
                      </div>
                    ) : (
                      [1,2,3,4].map(floor => {
                        const floorFlats = wing.units
                          .map(unit => `${floor}${unit}`)
                          .filter(flatNo => flatMatchesFilter(flatNo))
                        if (floorFlats.length === 0) return null
                        return (
                          <div key={floor} className="mb-4">
                            <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
                              style={{ color: 'var(--ink-4)' }}>Floor {floor}</div>
                            <div className="flex gap-2 flex-wrap">
                              {floorFlats.map(flatNo => {
                                const pay  = wingPaymentMap[flatNo]
                                const st   = pay?.status || 'UNPAID'
                                const ss   = statusStyle[st] || statusStyle.UNPAID
                                const isMe = isAdminFlat(flatNo)
                                return (
                                  <div key={flatNo}
                                    onClick={() => pay && setSelectedPayment(pay)}
                                    className="rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                    style={{
                                      background:    ss.bg,
                                      border:        isMe ? '2px solid var(--indigo)' : `1px solid ${ss.border}`,
                                      outline:       isMe ? '2px solid var(--indigo-md)' : 'none',
                                      outlineOffset: '2px',
                                      width:  '64px',
                                      height: '64px',
                                    }}>
                                    <span className="text-[11px] font-bold font-mono"
                                      style={{ color: ss.color }}>{flatNo}</span>
                                    <span className="text-[9px] font-semibold mt-0.5"
                                      style={{ color: ss.color }}>
                                      {st === 'PAID' ? '✓ Paid' : '✗ Due'}
                                    </span>
                                   <span className="text-[8px] mt-0.5"
  style={{ color: ss.color, opacity: 0.8 }}>
  {fmtTile(pay?.amount || MONTHLY_AMOUNT)}
</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        ) : (
          /* ── Table View ── */
          <div className="card overflow-hidden">
            <div className="hidden md:grid text-[10px] font-bold uppercase tracking-wide px-5 py-3"
              style={{
                gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px',
                background: 'var(--surface-3)', color: 'var(--ink-3)',
                borderBottom: '1px solid var(--border)'
              }}>
              <span>Flat</span><span>Type</span><span>Payer</span>
              <span>Wing</span><span>Amount</span><span>Paid On</span><span>Status</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 400px)' }}>
              {filteredPayments.map(p => (
                <div key={p.id} onClick={() => setSelectedPayment(p)}
                  className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isAdminFlat(p.flatNo) ? 'var(--indigo-lt)' : undefined,
                  }}>
                  {/* Mobile */}
                  <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={p.status === 'PAID'
                        ? { background: '#d1fae5', color: '#065f46' }
                        : { background: '#ffe4e6', color: '#9f1239' }}>
                      {p.flatNo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                        {p.payerName}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                        {p.ownerType} · {['A','B','C','D','E','F'].includes(p.flatNo?.slice(-1)) ? 'North' : 'South'} Wing
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-bold"
                        style={{ color: p.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }}>
                        {p.status === 'PAID' ? fmt(p.amount) : fmt(p.amount || MONTHLY_AMOUNT)}
                      </div>
                      <StatusBadge status={p.status?.toLowerCase()} />
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid items-center px-5 py-3"
                    style={{ gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px' }}>
                    <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--indigo)' }}>
                      {p.flatNo}
                      {isAdminFlat(p.flatNo) && (
                        <span className="ml-1 text-[9px]" style={{ color: 'var(--indigo)' }}>← You</span>
                      )}
                    </span>
                    <span>
                      <span className="badge text-[9px]" style={
                        p.ownerType === 'RENTED' ? { background:'#fef9c3', color:'#78350f' } :
                        p.ownerType === 'VACANT' ? { background:'#ffe4e6', color:'#9f1239' } :
                                                   { background:'#eeeeff', color:'var(--indigo)' }
                      }>{p.ownerType}</span>
                    </span>
                    <div className="min-w-0 pr-3">
                      <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                        {p.payerName}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                        {p.ownerType === 'RENTED' ? 'Tenant pays' :
                         p.ownerType === 'VACANT' ? 'Owner pays (vacant)' : 'Owner-occupied'}
                      </div>
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {['A','B','C','D','E','F'].includes(p.flatNo?.slice(-1)) ? 'North' : 'South'}
                    </span>
                    <span className="text-[12px] font-semibold"
                      style={{ color: p.status === 'UNPAID' ? 'var(--rose)' : 'var(--ink-2)' }}>
                      {p.status === 'UNPAID' ? '—' : fmt(p.amount)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {p.paidOn || '—'}
                    </span>
                    <StatusBadge status={p.status?.toLowerCase()} />
                  </div>
                </div>
              ))}
              {filteredPayments.length === 0 && (
                <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>
                  No records found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)}
        title={`Flat ${selectedPayment?.flatNo} — ${selectedMonth.label}`}>
        {selectedPayment && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Flat',         selectedPayment.flatNo],
                ['Type',         selectedPayment.ownerType],
                ['Payer',        selectedPayment.payerName],
                ['Payer Role',   selectedPayment.payerRole],
                ['Owner',        selectedPayment.ownerName],
                ['Owner Phone',  selectedPayment.ownerPhone || '—'],
                ['Status',       <StatusBadge status={selectedPayment.status?.toLowerCase()} />],
                ['Amount Due',   fmt(selectedPayment.amount || MONTHLY_AMOUNT)],
                ['Paid On',      selectedPayment.paidOn || '—'],
                ['Payment Mode', selectedPayment.paymentMode || '—'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                    style={{ color: 'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>

            {selectedPayment.status === 'UNPAID' && (
              isAdminFlat(selectedPayment.flatNo) ? (
                <button onClick={handleMarkOwnFlat} disabled={markingPaid}
                  className="btn-primary w-full justify-center">
                  <CheckCircle2 size={14} />
                  {markingPaid ? 'Marking...' : `Mark Flat ${selectedPayment.flatNo} as Paid`}
                </button>
              ) : (
                <>
                  <div className="rounded-xl p-3 flex items-center gap-2"
                    style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <Info size={14} style={{ color: 'var(--amber)' }} />
                    <span className="text-[12px]" style={{ color: '#78350f' }}>
                      Only the resident/owner can mark this paid from the Resident Portal.
                    </span>
                  </div>
                  <button onClick={() => handleSendSingleReminder(selectedPayment)}
                    className="btn-primary w-full justify-center">
                    <Mail size={13} />
                    Send Email Reminder to Flat {selectedPayment.flatNo}
                  </button>
                </>
              )
            )}

            {selectedPayment.status === 'PAID' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <CheckCircle2 size={14} style={{ color: 'var(--emerald)' }} />
                <span className="text-[12px] font-medium" style={{ color: '#065f46' }}>
                  Paid on {selectedPayment.paidOn} via {selectedPayment.paymentMode}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}