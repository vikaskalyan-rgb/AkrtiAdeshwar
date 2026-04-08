import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge, Modal } from '../../components/ui'
import { CheckCircle2, CreditCard, Info, Smartphone, ExternalLink } from 'lucide-react'
import api from '../../api/config'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

// ── UPI config ────────────────────────────────────────────
const UPI_ID      = 'ppr.05219.21092023.00196023@cnrb'
const PAYEE_NAME  = 'Akrti Aadeshwar Owners Association'

// Fixed — no amount, treated as P2P, no merchant restrictions
function buildUpiUrl(amount, flatNo, monthLabel) {
  const note = `Maintenance ${monthLabel} Flat ${flatNo}`
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&cu=INR&tn=${encodeURIComponent(note)}`
}
const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

const STEP = {
  CHOOSE:   'choose',
  UPI_APPS: 'upi_apps',
  UPI_CONF: 'upi_conf',
  MANUAL:   'manual',
}

export default function ResidentMaintenance() {
  const { user } = useAuth()
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

  const [payments,   setPayments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showPay,    setShowPay]    = useState(null)
  const [step,       setStep]       = useState(STEP.CHOOSE)
  const [payMode,    setPayMode]    = useState('UPI')
  const [payRef,     setPayRef]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(null)

  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  useEffect(() => { if (user?.flatNo) fetchPayments() }, [user])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/maintenance/flat/${user.flatNo}`)
      setPayments(res.data)
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentMonthPay = payments.find(p => p.month === currentMonth && p.year === currentYear)
  const MONTHLY_AMOUNT  = currentMonthPay?.amount || 4200

  const totalPaid    = payments.filter(p => p.status === 'PAID').reduce((s,p) => s + (p.amount||0), 0)
  const totalPending = payments.filter(p => p.status === 'UNPAID').reduce((s,p) => s + (p.amount||4200), 0)

  const getMonthLabel = (month, year) =>
    new Date(year, month-1).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month:'short', year:'numeric' })

  const openPayModal = (payment) => {
    setShowPay(payment)
    setStep(STEP.CHOOSE)
    setPayRef('')
    setPayMode('UPI')
  }

  const closePayModal = () => {
    setShowPay(null)
    setStep(STEP.CHOOSE)
    setPayRef('')
    setPayMode('UPI')
  }

  const handleUpiAppClick = (appUrl) => {
    window.location.href = appUrl
    setTimeout(() => setStep(STEP.UPI_CONF), 2000)
  }

  const handleMarkPaid = async (mode, ref) => {
    if (!showPay) return
    setSubmitting(true)
    try {
      await api.post(
        `/api/maintenance/flat/${user.flatNo}/pay?month=${showPay.month}&year=${showPay.year}`,
        {
          paymentMode:    mode.toUpperCase().replace(' ', '_'),
          transactionRef: ref,
        }
      )
      await fetchPayments()
      setSuccess(showPay)
      closePayModal()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUndoPay = async (payment) => {
    if (!confirm(`Undo payment for ${getMonthLabel(payment.month, payment.year)}? This will mark it as unpaid.`)) return
    try {
      await api.post(`/api/maintenance/flat/${user.flatNo}/unpay?month=${payment.month}&year=${payment.year}`)
      await fetchPayments()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to undo payment')
    }
  }

  const amount     = showPay?.amount || MONTHLY_AMOUNT
  const monthLabel = showPay ? getMonthLabel(showPay.month, showPay.year) : ''

  // ── All UPI apps use standard upi:// scheme (same as QR code) ──
  const upiUrl = showPay ? buildUpiUrl(amount, user?.flatNo, monthLabel) : ''
  const upiApps = [
    { name: 'Google Pay',   color: '#4285F4', bg: '#EAF2FF', emoji: '🔵', url: upiUrl },
    { name: 'PhonePe',      color: '#5f259f', bg: '#F3ECFF', emoji: '🟣', url: upiUrl },
    { name: 'Paytm',        color: '#00BAF2', bg: '#E6F9FF', emoji: '🔷', url: upiUrl },
    { name: 'BHIM / Other', color: '#FF6B35', bg: '#FFF0EB', emoji: '📱', url: upiUrl },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar
        title="My Maintenance"
        subtitle={`Flat ${user?.flatNo} · ₹${MONTHLY_AMOUNT.toLocaleString()}/month`}
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>Loading...</div>
        ) : (
          <>
            {/* Current month card */}
            {currentMonthPay && (
              <div className="card p-4 md:p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: currentMonthPay.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }} />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-1"
                      style={{ color:'var(--ink-3)' }}>
                      {getMonthLabel(currentMonthPay.month, currentMonthPay.year)}
                    </div>
                    <div className="text-[28px] md:text-[32px] font-bold" style={{
                      color: currentMonthPay.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)',
                      letterSpacing:'-0.03em'
                    }}>
                      {currentMonthPay.status === 'PAID'
                        ? '✓ Paid'
                        : `₹${(currentMonthPay.amount||MONTHLY_AMOUNT).toLocaleString()} Due`}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color:'var(--ink-3)' }}>
                      {currentMonthPay.status === 'PAID'
                        ? `Paid on ${currentMonthPay.paidOn} via ${currentMonthPay.paymentMode}`
                        : 'Tap below to pay or record payment'}
                    </div>
                  </div>
                  {currentMonthPay.status === 'UNPAID'
                    ? <button onClick={() => openPayModal(currentMonthPay)}
                        className="btn-primary px-5 py-3 text-[14px]">
                        <CreditCard size={16}/> Pay Now
                      </button>
                    : <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background:'#ecfdf5' }}>
                        <CheckCircle2 size={28} style={{ color:'var(--emerald)' }} />
                      </div>
                  }
                </div>
              </div>
            )}

            {/* No record for current month */}
            {!currentMonthPay && (
              <div className="card p-5 flex items-center gap-3"
                style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                <Info size={18} style={{ color:'var(--amber)' }} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color:'#78350f' }}>
                    No payment record for {getMonthLabel(currentMonth, currentYear)}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color:'#92400e' }}>
                    Admin may not have generated dues yet for this month.
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--ink-3)' }}>Paid</div>
                <div className="text-[20px] font-bold mt-0.5"
                  style={{ color:'var(--emerald)', letterSpacing:'-0.02em' }}>
                  {fmt(totalPaid)}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                  {payments.filter(p=>p.status==='PAID').length} months
                </div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--ink-3)' }}>Pending</div>
                <div className="text-[20px] font-bold mt-0.5"
                  style={{ color: totalPending > 0 ? 'var(--rose)' : 'var(--emerald)',
                           letterSpacing:'-0.02em' }}>
                  {totalPending > 0 ? fmt(totalPending) : 'Clear ✓'}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                  {payments.filter(p=>p.status==='UNPAID').length} due
                </div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--ink-3)' }}>Monthly</div>
                <div className="text-[20px] font-bold mt-0.5"
                  style={{ color:'var(--indigo)', letterSpacing:'-0.02em' }}>
                  {fmt(MONTHLY_AMOUNT)}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>this month</div>
              </div>
            </div>

            {/* Payment history */}
            <div className="card overflow-hidden">
              <div className="card-header"><span className="card-title">Payment History</span></div>
              {payments.length === 0 ? (
                <div className="py-12 text-center text-[13px]"
                  style={{ color:'var(--ink-4)' }}>No payment records yet</div>
              ) : payments.map(p => (
                <div key={p.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>
                      {getMonthLabel(p.month, p.year)}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                      {p.status === 'PAID' ? `${p.paidOn} · ${p.paymentMode}` : 'Not paid yet'}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <div className="text-[13px] font-bold"
                      style={{ color: p.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }}>
                      ₹{(p.amount||MONTHLY_AMOUNT).toLocaleString()}
                    </div>
                  </div>
                  {p.status === 'UNPAID'
                    ? <button onClick={() => openPayModal(p)}
                        className="text-[11px] px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                        style={{ background:'#ffe4e6', color:'#9f1239' }}>Pay</button>
                    : <button onClick={() => handleUndoPay(p)}
                        className="text-[11px] px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                        style={{ background:'#fff1f2', color:'#e11d48', border: '1px solid #fca5a5' }}>
                        ↩ Undo
                      </button>
                  }
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pay Modal ── */}
      <Modal open={!!showPay} onClose={closePayModal} title={`Pay — ${monthLabel}`}>
        {showPay && (
          <>
            <div className="rounded-xl p-4 text-center mb-4"
              style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
              <div className="text-[11px] font-medium" style={{ color:'var(--ink-3)' }}>Amount Due</div>
              <div className="text-[34px] font-bold mt-0.5"
                style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>
                ₹{amount.toLocaleString()}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                {monthLabel} · Flat {user?.flatNo}
              </div>
              <div className="text-[10px] mt-1" style={{ color:'var(--ink-4)' }}>
                Payee: {PAYEE_NAME}
              </div>
            </div>

            {/* STEP 1: Choose */}
            {step === STEP.CHOOSE && (
              <div className="space-y-3">
                <p className="text-[12px] text-center font-medium" style={{ color:'var(--ink-3)' }}>
                  How would you like to pay?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setStep(STEP.UPI_APPS)}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all hover:scale-105"
                    style={{ background:'var(--indigo-lt)', border:'2px solid var(--indigo)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background:'var(--indigo)' }}>
                      <Smartphone size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold" style={{ color:'var(--indigo)' }}>
                        Pay via UPI
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                        GPay · PhonePe · Paytm
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setStep(STEP.MANUAL)}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all hover:scale-105"
                    style={{ background:'#ecfdf5', border:'2px solid var(--emerald)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background:'var(--emerald)' }}>
                      <CheckCircle2 size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold" style={{ color:'var(--emerald)' }}>
                        Already Paid
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                        Record cash / UPI done
                      </div>
                    </div>
                  </button>
                </div>
                <div className="rounded-xl p-3" style={{ background:'var(--surface-3)', border:'1px solid var(--border)' }}>
                  <div className="text-[9px] font-bold uppercase tracking-wide mb-2"
                    style={{ color:'var(--ink-3)' }}>Bank Transfer Details</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[
                      ['Account No', '5219101005304'],
                      ['IFSC', 'CNRB0005219'],
                      ['Bank', 'Canara Bank'],
                      ['UPI ID', UPI_ID],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[9px]" style={{ color:'var(--ink-4)' }}>{k}</div>
                        <div className="text-[10px] font-semibold" style={{ color:'var(--ink-2)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: UPI Apps */}
            {step === STEP.UPI_APPS && (
              <div className="space-y-3">
                <p className="text-[12px] text-center font-medium" style={{ color:'var(--ink-3)' }}>
                  Choose your UPI app — amount will be pre-filled
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {upiApps.map(app => (
                    <button key={app.name}
                      onClick={() => handleUpiAppClick(app.url)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:scale-105"
                      style={{ background: app.bg, border: `1.5px solid ${app.color}22` }}>
                      <span className="text-[28px] leading-none">{app.emoji}</span>
                      <div className="text-left">
                        <div className="text-[13px] font-bold" style={{ color: app.color }}>
                          {app.name}
                        </div>
                        <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                          Tap to open
                        </div>
                      </div>
                      <ExternalLink size={12} className="ml-auto flex-shrink-0"
                        style={{ color: app.color }} />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                  <Info size={13} style={{ color:'var(--amber)', flexShrink:0 }} />
                  <span className="text-[11px]" style={{ color:'#78350f' }}>
                    After paying, come back to this app and confirm your payment.
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(STEP.UPI_CONF)}
                    className="btn-primary flex-1 justify-center">
                    <CheckCircle2 size={14} /> I've Paid — Confirm
                  </button>
                  <button onClick={() => setStep(STEP.CHOOSE)} className="btn-ghost">Back</button>
                </div>
              </div>
            )}

            {/* STEP 3: UPI Confirmation */}
            {step === STEP.UPI_CONF && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background:'var(--indigo-lt)' }}>
                    <Smartphone size={32} style={{ color:'var(--indigo)' }} />
                  </div>
                  <p className="text-[14px] font-bold" style={{ color:'var(--ink)' }}>
                    Did your payment go through?
                  </p>
                  <p className="text-[12px] text-center" style={{ color:'var(--ink-3)' }}>
                    Check your UPI app for a success message before confirming.
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                    style={{ color:'var(--ink-2)' }}>
                    UPI Transaction ID <span style={{ color:'var(--ink-4)', fontWeight:400 }}>(optional but recommended)</span>
                  </label>
                  <input className="input" placeholder="e.g. 406812345678"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)} />
                  <p className="text-[10px] mt-1" style={{ color:'var(--ink-3)' }}>
                    Find it in your UPI app under transaction history
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleMarkPaid('UPI', payRef)} disabled={submitting}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                    style={{ background:'#ecfdf5', border:'2px solid var(--emerald)' }}>
                    <CheckCircle2 size={28} style={{ color:'var(--emerald)' }} />
                    <div className="text-[13px] font-bold" style={{ color:'var(--emerald)' }}>
                      {submitting ? 'Recording...' : 'Yes, Payment Done ✓'}
                    </div>
                  </button>
                  <button onClick={() => setStep(STEP.UPI_APPS)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                    style={{ background:'#fff1f2', border:'2px solid var(--rose)' }}>
                    <span className="text-[28px]">✗</span>
                    <div className="text-[13px] font-bold" style={{ color:'var(--rose)' }}>
                      No, Try Again
                    </div>
                  </button>
                </div>
                <button onClick={() => setStep(STEP.CHOOSE)}
                  className="w-full text-center text-[11px]" style={{ color:'var(--ink-4)' }}>
                  ← Back to payment options
                </button>
              </div>
            )}

            {/* STEP 4: Manual */}
            {step === STEP.MANUAL && (
              <div className="space-y-4">
                <p className="text-[12px] text-center font-medium" style={{ color:'var(--ink-3)' }}>
                  Select how you paid and confirm
                </p>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
                    style={{ color:'var(--ink-2)' }}>Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_MODES.map(m => (
                      <button key={m} onClick={() => setPayMode(m)}
                        className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                        style={payMode === m
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
                    Reference <span style={{ color:'var(--ink-4)', fontWeight:400 }}>(optional)</span>
                  </label>
                  <input className="input" placeholder="UPI transaction ID, receipt no. etc."
                    value={payRef} onChange={e => setPayRef(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleMarkPaid(payMode, payRef)} disabled={submitting}
                    className="btn-primary flex-1 justify-center">
                    <CheckCircle2 size={14}/>
                    {submitting ? 'Recording...' : 'Confirm Payment'}
                  </button>
                  <button onClick={() => setStep(STEP.CHOOSE)} className="btn-ghost">Back</button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Success Modal ── */}
      <Modal open={!!success} onClose={() => setSuccess(null)} title="Payment Recorded!">
        {success && (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background:'#ecfdf5' }}>
              <CheckCircle2 size={36} style={{ color:'var(--emerald)' }} />
            </div>
            <h3 className="text-[18px] font-bold" style={{ color:'var(--ink)' }}>
              Payment Recorded! 🎉
            </h3>
            <p className="text-[13px]" style={{ color:'var(--ink-3)' }}>
              ₹{(success.amount||MONTHLY_AMOUNT).toLocaleString()} for{' '}
              <strong>{getMonthLabel(success.month, success.year)}</strong>{' '}
              has been recorded. Admin dashboard updated.
            </p>
            <button onClick={() => setSuccess(null)}
              className="btn-primary px-8 py-2.5 mx-auto">Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}