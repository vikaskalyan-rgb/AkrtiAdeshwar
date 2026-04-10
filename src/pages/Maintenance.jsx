import { useState, useEffect, useMemo } from 'react'
import { StatusBadge, Modal } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import {
  CheckCircle2, Search, Info, Mail, Copy, Check,
  AlertTriangle, CreditCard
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const UPI_ID     = 'ppr.05219.21092023.00196023@cnrb'
const PAYEE_NAME = 'Akrti Aadeshwar Owners Association'
const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

const PAY_STEP = { CHOOSE: 'choose', CONFIRM: 'confirm' }

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}
function fmtTile(n) {
  if (!n) return '₹4,200'
  return `₹${n.toLocaleString('en-IN')}`
}
function getLast6Months() {
  const months = []
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', year: 'numeric' }),
    })
  }
  return months
}
const MONTHS = getLast6Months()

// ── Copy UPI button ───────────────────────────────────────
function CopyUPI({ upiId }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center transition-all"
      style={{
        background: copied ? '#ecfdf5' : 'var(--indigo-lt)',
        border: `1.5px solid ${copied ? 'var(--emerald)' : 'var(--indigo)'}`,
        color: copied ? 'var(--emerald)' : 'var(--indigo)',
      }}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span className="text-[13px] font-bold">{copied ? 'Copied!' : 'Copy UPI ID'}</span>
    </button>
  )
}

const statusStyle = {
  PAID:    { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', label: 'Paid' },
  PARTIAL: { bg: '#fef9c3', color: '#78350f', border: '#fde68a', label: 'Partial' },
  UNPAID:  { bg: '#ffe4e6', color: '#9f1239', border: '#fca5a5', label: 'Unpaid' },
}

export default function Maintenance() {
  const { user } = useAuth()

  const [selectedMonth, setSelectedMonth]     = useState(MONTHS[0])
  const [payments,      setPayments]          = useState([])
  const [summary,       setSummary]           = useState({})
  const [loading,       setLoading]           = useState(true)
  const [search,        setSearch]            = useState('')
  const [filterStatus,  setFilterStatus]      = useState('all')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [view,          setView]              = useState('wing')
  const [sendingReminders, setSendingReminders] = useState(false)
  const [markingPaid,   setMarkingPaid]       = useState(false)
  const [payStep,       setPayStep]           = useState(PAY_STEP.CHOOSE)
  const [payMode,       setPayMode]           = useState('UPI')
  const [payRef,        setPayRef]            = useState('')
  const [paidAmount,    setPaidAmount]        = useState('')
  const [amountErr,     setAmountErr]         = useState('')
  const [paySuccess,    setPaySuccess]        = useState(false)
  const [reminderResult, setReminderResult]   = useState(null)
  const [waivinig,      setWaiving]           = useState(false)

  useEffect(() => { fetchPayments() }, [selectedMonth])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        api.get(`/api/maintenance?month=${selectedMonth.month}&year=${selectedMonth.year}`),
        api.get(`/api/maintenance/summary?month=${selectedMonth.month}&year=${selectedMonth.year}`),
      ])
      setPayments(pRes.data)
      setSummary(sRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSendReminders = async () => {
    setSendingReminders(true)
    setReminderResult(null)
    try {
      const res = await api.post(`/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}`)
      setReminderResult({ message: res.data.message, success: true })
      setTimeout(() => setReminderResult(null), 5000)
    } catch { alert('Failed to send reminders') }
    finally { setSendingReminders(false) }
  }

  const openOwnFlatPay = (payment) => {
    setSelectedPayment(payment)
    setPayStep(PAY_STEP.CHOOSE)
    setPayRef('')
    setPayMode('UPI')
    const remaining = payment.status === 'PARTIAL'
      ? (payment.amount || MONTHLY_AMOUNT) - (payment.paidAmount || 0)
      : (payment.amount || MONTHLY_AMOUNT)
    setPaidAmount(String(remaining))
    setAmountErr('')
    setPaySuccess(false)
  }

  const closeModal = () => {
    setSelectedPayment(null)
    setPayStep(PAY_STEP.CHOOSE)
    setPaySuccess(false)
    setPayRef('')
    setPayMode('UPI')
    setPaidAmount('')
    setAmountErr('')
  }

  const handleMarkOwnFlat = async () => {
    if (!selectedPayment) return
    const val = parseInt(paidAmount)
    if (!paidAmount || isNaN(val) || val <= 0) {
      setAmountErr('Please enter the amount you paid')
      return
    }
    setMarkingPaid(true)
    try {
      await api.post(
        `/api/maintenance/flat/${user.flatNo}/pay?month=${selectedPayment.month}&year=${selectedPayment.year}`,
        { paymentMode: payMode.toUpperCase().replace(' ', '_'), transactionRef: payRef, paidAmount: val }
      )
      await fetchPayments()
      setPaySuccess(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment')
    } finally { setMarkingPaid(false) }
  }

  const handleWaiveBalance = async (payment) => {
    if (!confirm(`Waive balance of ₹${payment.getBalance ? payment.getBalance() : ((payment.amount||4200)-(payment.paidAmount||0))} for Flat ${payment.flatNo}? This marks it as fully PAID.`)) return
    setWaiving(true)
    try {
      await api.post(`/api/maintenance/flat/${payment.flatNo}/waive?month=${payment.month}&year=${payment.year}`)
      await fetchPayments()
      closeModal()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to waive balance')
    } finally { setWaiving(false) }
  }

  const handleUndoPay = async (payment) => {
    if (!confirm(`Undo payment for Flat ${payment.flatNo} — ${selectedMonth.label}?`)) return
    try {
      await api.post(`/api/maintenance/flat/${payment.flatNo}/unpay?month=${payment.month}&year=${payment.year}`)
      await fetchPayments()
      closeModal()
    } catch (err) { alert(err.response?.data?.message || 'Failed to undo') }
  }

  const handleSendSingleReminder = async (payment) => {
    try {
      const res = await api.post(
        `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}&flatNo=${payment.flatNo}`
      )
      setReminderResult({
        message: (res.data.sent ?? 0) > 0
          ? `✓ Reminder emailed to flat ${payment.flatNo}`
          : `⚠ No email registered for flat ${payment.flatNo}`,
        success: (res.data.sent ?? 0) > 0,
      })
      setSelectedPayment(null)
      setTimeout(() => setReminderResult(null), 5000)
    } catch { alert('Failed to send reminder') }
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

  const defaulters     = payments.filter(p => p.status !== 'PAID')
  const MONTHLY_AMOUNT = summary.monthlyAmount || 4200
  const pct = summary.total
    ? Math.round((summary.collected || 0) / (summary.total * MONTHLY_AMOUNT) * 100)
    : 0

  const isAdminFlat = (flatNo) => flatNo === user?.flatNo

  const wingPaymentMap = useMemo(() => {
    const map = {}
    payments.forEach(p => { map[p.flatNo] = p })
    return map
  }, [payments])

  const flatMatchesFilter = (flatNo) => {
    const p  = wingPaymentMap[flatNo]
    const st = p?.status || 'UNPAID'
    const matchSearch = search === '' ||
      flatNo.toLowerCase().includes(search.toLowerCase()) ||
      p?.payerName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || st.toLowerCase() === filterStatus
    return matchSearch && matchStatus
  }

  // Own flat pay form
  const due = selectedPayment
    ? selectedPayment.status === 'PARTIAL'
      ? (selectedPayment.amount || MONTHLY_AMOUNT) - (selectedPayment.paidAmount || 0)
      : (selectedPayment.amount || MONTHLY_AMOUNT)
    : MONTHLY_AMOUNT
  const enteredAmount = parseInt(paidAmount) || 0
  const isPartial     = enteredAmount > 0 && enteredAmount < due
  const isOver        = enteredAmount > due

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Maintenance" subtitle="Monthly payment tracking"
        actions={
          <div className="flex items-center gap-2">
            {user?.flatNo && (() => {
              const myPay = payments.find(p => p.flatNo === user.flatNo)
              return myPay?.status !== 'PAID' ? (
                <button onClick={() => openOwnFlatPay(myPay)}
                  className="btn-primary text-[11px] px-3 py-1.5">
                  {myPay?.status === 'PARTIAL' ? `Pay Balance Flat ${user.flatNo}` : `Pay Flat ${user.flatNo}`}
                </button>
              ) : null
            })()}
            <button onClick={handleSendReminders} disabled={sendingReminders} className="btn-primary">
              <Mail size={13} />
              {sendingReminders ? 'Sending...' : `Remind (${defaulters.length})`}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {reminderResult && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: reminderResult.success ? '#ecfdf5' : '#fffbeb',
              border: `1px solid ${reminderResult.success ? '#6ee7b7' : '#fde68a'}`,
            }}>
            <span className="text-[12px] font-medium"
              style={{ color: reminderResult.success ? '#065f46' : '#78350f' }}>
              {reminderResult.message}
            </span>
            <button onClick={() => setReminderResult(null)} className="text-[16px] font-bold"
              style={{ color: reminderResult.success ? '#065f46' : '#78350f' }}>×</button>
          </div>
        )}

        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--indigo)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--indigo)' }}>
            Admin view is read-only. Residents mark their own payments. Admins can pay their own flat above.
          </p>
        </div>

        {/* Month tabs */}
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
            { label: 'Collected', value: fmt(summary.collected || 0), color: '#059669', bg: '#ecfdf5', sub: `${summary.paid || 0} paid` },
            { label: 'Pending',   value: fmt(summary.pending   || 0), color: '#e11d48', bg: '#fff1f2', sub: `${(summary.unpaid||0) + (summary.partial||0)} pending` },
            { label: 'Partial',   value: summary.partial || 0,        color: '#d97706', bg: '#fffbeb', sub: 'short paid' },
            { label: 'Rate',      value: `${pct}%`,                   color: '#5b52f0', bg: '#eeeeff', sub: 'collection' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
                style={{ background: s.bg, color: s.color }}>{s.value}</div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat or name..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'white', border: '1px solid var(--border)' }}>
            {[
              { v: 'all',     l: 'All' },
              { v: 'paid',    l: '✓ Paid' },
              { v: 'partial', l: '⚠ Partial' },
              { v: 'unpaid',  l: '✗ Unpaid' },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: filterStatus === v
                    ? v === 'paid' ? 'var(--emerald)' : v === 'unpaid' ? 'var(--rose)' : v === 'partial' ? '#d97706' : 'var(--indigo)'
                    : 'transparent',
                  color: filterStatus === v ? 'white' : 'var(--ink-3)',
                }}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'white', border: '1px solid var(--border)' }}>
            {[{ v: 'wing', l: 'Wing' }, { v: 'table', l: 'Table' }].map(({ v, l }) => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: view === v ? 'var(--indigo)' : 'transparent', color: view === v ? 'white' : 'var(--ink-3)' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>

        ) : view === 'wing' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'North Wing', units: ['A','B','C','D','E','F'], color: 'var(--sky)',    lightBg: '#f0f9ff', border: '#bae6fd' },
              { name: 'South Wing', units: ['G','H','J','K'],         color: 'var(--indigo)', lightBg: '#eeeeff', border: 'var(--indigo-md)' },
            ].map(wing => {
              const wingPaid    = payments.filter(p => wing.units.includes(p.flatNo?.slice(-1)) && p.status === 'PAID').length
              const wingPartial = payments.filter(p => wing.units.includes(p.flatNo?.slice(-1)) && p.status === 'PARTIAL').length
              const wingUnpaid  = payments.filter(p => wing.units.includes(p.flatNo?.slice(-1)) && p.status === 'UNPAID').length
              const hasVisible  = wing.units.some(unit => [1,2,3,4].some(floor => flatMatchesFilter(`${floor}${unit}`)))
              return (
                <div key={wing.name} className="card overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between"
                    style={{ background: wing.lightBg, borderBottom: `1px solid ${wing.border}` }}>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: wing.color }}>{wing.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Units: {wing.units.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold flex-wrap justify-end">
                      <span style={{ color: 'var(--emerald)' }}>✓ {wingPaid}</span>
                      {wingPartial > 0 && <span style={{ color: '#d97706' }}>⚠ {wingPartial}</span>}
                      <span style={{ color: 'var(--rose)' }}>✗ {wingUnpaid}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {!hasVisible ? (
                      <div className="py-6 text-center text-[12px]" style={{ color: 'var(--ink-4)' }}>No flats match filter</div>
                    ) : (
                      [1,2,3,4].map(floor => {
                        const floorFlats = wing.units.map(unit => `${floor}${unit}`).filter(f => flatMatchesFilter(f))
                        if (floorFlats.length === 0) return null
                        return (
                          <div key={floor} className="mb-4">
                            <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
                              style={{ color: 'var(--ink-4)' }}>Floor {floor}</div>
                            <div className="flex gap-2 flex-wrap">
                              {floorFlats.map(flatNo => {
                                const pay = wingPaymentMap[flatNo]
                                const st  = pay?.status || 'UNPAID'
                                const ss  = statusStyle[st] || statusStyle.UNPAID
                                const isMe = isAdminFlat(flatNo)
                                return (
                                  <div key={flatNo}
                                    onClick={() => pay && setSelectedPayment(pay)}
                                    className="rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                    style={{
                                      background: ss.bg,
                                      border: isMe ? '2px solid var(--indigo)' : `1px solid ${ss.border}`,
                                      width: '64px', height: '64px',
                                    }}>
                                    <span className="text-[11px] font-bold font-mono" style={{ color: ss.color }}>{flatNo}</span>
                                    <span className="text-[8px] font-semibold mt-0.5" style={{ color: ss.color }}>
                                      {st === 'PAID' ? '✓ Paid' : st === 'PARTIAL' ? '⚠ Part' : '✗ Due'}
                                    </span>
                                    <span className="text-[8px] mt-0.5" style={{ color: ss.color, opacity: 0.8 }}>
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
          <div className="card overflow-hidden">
            <div className="hidden md:grid text-[10px] font-bold uppercase tracking-wide px-5 py-3"
              style={{ gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px', background: 'var(--surface-3)', color: 'var(--ink-3)', borderBottom: '1px solid var(--border)' }}>
              <span>Flat</span><span>Type</span><span>Payer</span><span>Wing</span><span>Due</span><span>Paid</span><span>Status</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 400px)' }}>
              {filteredPayments.map(p => {
                const ss = statusStyle[p.status] || statusStyle.UNPAID
                return (
                  <div key={p.id} onClick={() => setSelectedPayment(p)}
                    className="cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)', background: p.status === 'PARTIAL' ? '#fffbeb' : isAdminFlat(p.flatNo) ? 'var(--indigo-lt)' : undefined }}>
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: ss.bg, color: ss.color }}>{p.flatNo}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{p.payerName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                          {p.status === 'PARTIAL'
                            ? `Paid ₹${(p.paidAmount||0).toLocaleString()} · Bal ₹${((p.amount||MONTHLY_AMOUNT)-(p.paidAmount||0)).toLocaleString()}`
                            : p.ownerType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-bold" style={{ color: ss.color }}>
                          ₹{(p.amount||MONTHLY_AMOUNT).toLocaleString()}
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                      </div>
                    </div>
                    <div className="hidden md:grid items-center px-5 py-3"
                      style={{ gridTemplateColumns: '70px 100px 1fr 90px 100px 100px 90px' }}>
                      <span className="text-[12px] font-bold font-mono" style={{ color: 'var(--indigo)' }}>{p.flatNo}</span>
                      <span><span className="badge text-[9px]" style={
                        p.ownerType === 'RENTED' ? { background:'#fef9c3', color:'#78350f' } :
                        p.ownerType === 'VACANT' ? { background:'#ffe4e6', color:'#9f1239' } :
                                                   { background:'#eeeeff', color:'var(--indigo)' }
                      }>{p.ownerType}</span></span>
                      <div className="min-w-0 pr-3">
                        <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>{p.payerName}</div>
                        {p.status === 'PARTIAL' && (
                          <div className="text-[10px]" style={{ color: '#d97706' }}>
                            Paid ₹{(p.paidAmount||0).toLocaleString()} · Bal ₹{((p.amount||MONTHLY_AMOUNT)-(p.paidAmount||0)).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                        {['A','B','C','D','E','F'].includes(p.flatNo?.slice(-1)) ? 'North' : 'South'}
                      </span>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>
                        ₹{(p.amount||MONTHLY_AMOUNT).toLocaleString()}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                        {p.paidAmount ? `₹${p.paidAmount.toLocaleString()}` : '—'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </div>
                  </div>
                )
              })}
              {filteredPayments.length === 0 && (
                <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No records found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <Modal open={!!selectedPayment} onClose={closeModal}
        title={`Flat ${selectedPayment?.flatNo} — ${selectedMonth.label}`}>
        {selectedPayment && (() => {
          const isOwn = isAdminFlat(selectedPayment.flatNo)
          const ss    = statusStyle[selectedPayment.status] || statusStyle.UNPAID
          const balance = (selectedPayment.amount || MONTHLY_AMOUNT) - (selectedPayment.paidAmount || 0)

          return (
            <div className="space-y-3">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Flat',         selectedPayment.flatNo],
                  ['Status',       <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>],
                  ['Payer',        selectedPayment.payerName],
                  ['Amount Due',   `₹${(selectedPayment.amount||MONTHLY_AMOUNT).toLocaleString()}`],
                  ['Paid Amount',  selectedPayment.paidAmount ? `₹${selectedPayment.paidAmount.toLocaleString()}` : '—'],
                  ['Balance',      selectedPayment.status === 'PARTIAL' ? `₹${balance.toLocaleString()}` : '—'],
                  ['Paid On',      selectedPayment.paidOn || '—'],
                  ['Mode',         selectedPayment.paymentMode || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl p-3"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{k}</div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* PARTIAL — admin can waive balance */}
              {selectedPayment.status === 'PARTIAL' && (
                <div className="rounded-xl p-3 space-y-2"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: '#d97706' }} />
                    <span className="text-[12px] font-semibold" style={{ color: '#78350f' }}>
                      Partial payment — ₹{balance.toLocaleString()} balance remaining
                    </span>
                  </div>
                  <button onClick={() => handleWaiveBalance(selectedPayment)} disabled={waivinig}
                    className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2"
                    style={{ background: 'var(--emerald)', color: 'white' }}>
                    <CheckCircle2 size={14} />
                    {waivinig ? 'Processing...' : `Waive ₹${balance.toLocaleString()} Balance → Mark as Fully Paid`}
                  </button>
                </div>
              )}

              {/* Admin own flat — pay */}
              {selectedPayment.status !== 'PAID' && isOwn && (
                <>
                  <div className="rounded-xl p-3 text-center"
                    style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
                    <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                      {selectedPayment.status === 'PARTIAL' ? 'Balance Due' : 'Amount Due'}
                    </div>
                    <div className="text-[28px] font-bold" style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>
                      ₹{due.toLocaleString()}
                    </div>
                  </div>

                  {paySuccess ? (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <CheckCircle2 size={36} style={{ color:'var(--emerald)' }} />
                      <p className="text-[14px] font-bold" style={{ color:'var(--emerald)' }}>Recorded!</p>
                      <button onClick={closeModal} className="btn-primary px-6">Done</button>
                    </div>
                  ) : payStep === PAY_STEP.CHOOSE ? (
                    <div className="space-y-3">
                      {/* UPI section */}
                      <div className="rounded-xl p-3 space-y-2" style={{ background:'var(--surface-3)', border:'1px solid var(--border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Pay via UPI</div>
                        <div className="rounded-lg p-2.5" style={{ background:'white', border:'1px solid var(--border)' }}>
                          <div className="text-[10px]" style={{ color:'var(--ink-4)' }}>UPI ID</div>
                          <div className="text-[12px] font-bold break-all" style={{ color:'var(--ink)' }}>{UPI_ID}</div>
                        </div>
                        <CopyUPI upiId={UPI_ID} />
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                          style={{ background:'#f0f9ff', border:'1px solid #bae6fd' }}>
                          <Info size={11} style={{ color:'#0284c7', flexShrink:0 }} />
                          <span className="text-[10px]" style={{ color:'#0369a1' }}>
                            Open GPay → New Payment → Paste UPI ID → Pay ₹{due.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setPayStep(PAY_STEP.CONFIRM)} className="btn-primary w-full justify-center">
                        <CheckCircle2 size={14} /> I've Paid — Record
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[12px] font-semibold text-center" style={{ color:'var(--ink-2)' }}>
                        How much did you pay?
                      </p>
                      <div>
                        <input className="input text-[16px] font-bold text-center w-full"
                          type="number" placeholder={`e.g. ${due}`}
                          value={paidAmount}
                          onChange={e => { setPaidAmount(e.target.value); setAmountErr('') }} />
                        {amountErr && <p className="text-[11px] mt-1" style={{ color:'var(--rose)' }}>{amountErr}</p>}
                        {enteredAmount > 0 && (
                          <div className="mt-2 px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2"
                            style={{
                              background: isPartial ? '#fffbeb' : '#ecfdf5',
                              border: `1px solid ${isPartial ? '#fde68a' : '#6ee7b7'}`,
                              color: isPartial ? '#92400e' : '#065f46',
                            }}>
                            {isPartial
                              ? <><AlertTriangle size={12}/> Partial — ₹{(due-enteredAmount).toLocaleString()} balance tracked</>
                              : <><CheckCircle2 size={12}/> {isOver ? `Overpaid by ₹${(enteredAmount-due).toLocaleString()}` : 'Exact amount!'}</>
                            }
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_MODES.map(m => (
                          <button key={m} onClick={() => setPayMode(m)}
                            className="py-2 rounded-xl text-[12px] font-semibold transition-all"
                            style={payMode === m
                              ? { background:'var(--indigo)', color:'white', border:'1px solid var(--indigo)' }
                              : { background:'var(--surface-3)', color:'var(--ink-2)', border:'1px solid var(--border)' }}>
                            {m}
                          </button>
                        ))}
                      </div>
                      <input className="input" placeholder="Reference (optional)"
                        value={payRef} onChange={e => setPayRef(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={handleMarkOwnFlat} disabled={markingPaid} className="btn-primary flex-1 justify-center">
                          <CheckCircle2 size={14} />
                          {markingPaid ? 'Recording...' : isPartial ? 'Record Partial' : 'Confirm Payment'}
                        </button>
                        <button onClick={() => setPayStep(PAY_STEP.CHOOSE)} className="btn-ghost">Back</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Other flats — reminder + undo */}
              {selectedPayment.status === 'UNPAID' && !isOwn && (
                <>
                  <div className="rounded-xl p-3 flex items-center gap-2"
                    style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <Info size={14} style={{ color: 'var(--amber)' }} />
                    <span className="text-[12px]" style={{ color: '#78350f' }}>
                      Only the resident can mark this paid from their portal.
                    </span>
                  </div>
                  <button onClick={() => handleSendSingleReminder(selectedPayment)}
                    className="btn-primary w-full justify-center">
                    <Mail size={13} /> Send Reminder to Flat {selectedPayment.flatNo}
                  </button>
                </>
              )}

              {/* Paid — undo */}
              {selectedPayment.status === 'PAID' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--emerald)' }} />
                    <span className="text-[12px] font-medium" style={{ color: '#065f46' }}>
                      Paid ₹{(selectedPayment.paidAmount||selectedPayment.amount||MONTHLY_AMOUNT).toLocaleString()} on {selectedPayment.paidOn}
                    </span>
                  </div>
                  <button onClick={() => handleUndoPay(selectedPayment)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}>
                    ↩ Undo — Mark as Unpaid
                  </button>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}