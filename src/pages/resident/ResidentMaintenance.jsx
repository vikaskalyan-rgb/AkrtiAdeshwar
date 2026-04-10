import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge, Modal } from '../../components/ui'
import { CheckCircle2, CreditCard, Info, Copy, Check, AlertTriangle } from 'lucide-react'
import api from '../../api/config'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const UPI_ID     = 'ppr.05219.21092023.00196023@cnrb'
const PAYEE_NAME = 'Akrti Aadeshwar Owners Association'
const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

const STEP = {
  CHOOSE:  'choose',
  PAY:     'pay',
  CONFIRM: 'confirm',
}

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
      <span className="text-[13px] font-bold">
        {copied ? 'Copied!' : 'Copy UPI ID'}
      </span>
    </button>
  )
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
  const [paidAmount, setPaidAmount] = useState('')
  const [amountErr,  setAmountErr]  = useState('')
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
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const currentMonthPay = payments.find(p => p.month === currentMonth && p.year === currentYear)
  const MONTHLY_AMOUNT  = currentMonthPay?.amount || 4200

  const totalPaid    = payments.filter(p => p.status === 'PAID').reduce((s,p) => s + (p.paidAmount || p.amount || 0), 0)
  const totalPending = payments
    .filter(p => p.status !== 'PAID')
    .reduce((s,p) => {
      if (p.status === 'PARTIAL') return s + ((p.amount || 4200) - (p.paidAmount || 0))
      return s + (p.amount || 4200)
    }, 0)

  const getMonthLabel = (month, year) =>
    new Date(year, month-1).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month:'short', year:'numeric' })

  const openPayModal = (payment) => {
    setShowPay(payment)
    setStep(STEP.CHOOSE)
    setPayRef('')
    setPayMode('UPI')
    // Pre-fill with remaining balance for partial payments
    const remaining = payment.status === 'PARTIAL'
      ? (payment.amount || MONTHLY_AMOUNT) - (payment.paidAmount || 0)
      : (payment.amount || MONTHLY_AMOUNT)
    setPaidAmount(String(remaining))
    setAmountErr('')
  }

  const closePayModal = () => {
    setShowPay(null)
    setStep(STEP.CHOOSE)
    setPayRef('')
    setPayMode('UPI')
    setPaidAmount('')
    setAmountErr('')
  }

  const validateAmount = () => {
    const val = parseInt(paidAmount)
    const due = showPay?.amount || MONTHLY_AMOUNT
    if (!paidAmount || isNaN(val) || val <= 0) {
      setAmountErr('Please enter the amount you paid')
      return false
    }
    setAmountErr('')
    return true
  }

  const handleConfirmPay = async () => {
    if (!validateAmount()) return
    if (!showPay) return
    setSubmitting(true)
    try {
      await api.post(
        `/api/maintenance/flat/${user.flatNo}/pay?month=${showPay.month}&year=${showPay.year}`,
        {
          paymentMode:    payMode.toUpperCase().replace(' ', '_'),
          transactionRef: payRef,
          paidAmount:     parseInt(paidAmount),
        }
      )
      await fetchPayments()
      setSuccess({ ...showPay, paidAmount: parseInt(paidAmount) })
      closePayModal()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment')
    } finally { setSubmitting(false) }
  }

  const handleUndoPay = async (payment) => {
    if (!confirm(`Undo payment for ${getMonthLabel(payment.month, payment.year)}?`)) return
    try {
      await api.post(`/api/maintenance/flat/${user.flatNo}/unpay?month=${payment.month}&year=${payment.year}`)
      await fetchPayments()
    } catch (err) { alert(err.response?.data?.message || 'Failed to undo') }
  }

  const due = showPay
    ? showPay.status === 'PARTIAL'
      ? (showPay.amount || MONTHLY_AMOUNT) - (showPay.paidAmount || 0)
      : (showPay.amount || MONTHLY_AMOUNT)
    : MONTHLY_AMOUNT

  const enteredAmount = parseInt(paidAmount) || 0
  const isPartial     = enteredAmount > 0 && enteredAmount < due
  const isOver        = enteredAmount > due

  const statusStyle = (p) => {
    if (p.status === 'PAID')    return { color: 'var(--emerald)', bg: '#ecfdf5', border: '#6ee7b7', label: '✓ Paid' }
    if (p.status === 'PARTIAL') return { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: '⚠ Partial' }
    return { color: 'var(--rose)', bg: '#fff1f2', border: '#fca5a5', label: 'Unpaid' }
  }

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
                  style={{
                    background: currentMonthPay.status === 'PAID' ? 'var(--emerald)'
                              : currentMonthPay.status === 'PARTIAL' ? '#d97706'
                              : 'var(--rose)'
                  }} />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-1"
                      style={{ color:'var(--ink-3)' }}>
                      {getMonthLabel(currentMonthPay.month, currentMonthPay.year)}
                    </div>
                    {currentMonthPay.status === 'PAID' && (
                      <div className="text-[28px] font-bold" style={{ color:'var(--emerald)', letterSpacing:'-0.03em' }}>
                        ✓ Paid
                      </div>
                    )}
                    {currentMonthPay.status === 'PARTIAL' && (
                      <>
                        <div className="text-[28px] font-bold" style={{ color:'#d97706', letterSpacing:'-0.03em' }}>
                          ⚠ Partial
                        </div>
                        <div className="text-[12px] mt-1" style={{ color:'#92400e' }}>
                          Paid ₹{(currentMonthPay.paidAmount||0).toLocaleString()} · Balance ₹{((currentMonthPay.amount||MONTHLY_AMOUNT) - (currentMonthPay.paidAmount||0)).toLocaleString()} remaining
                        </div>
                      </>
                    )}
                    {currentMonthPay.status === 'UNPAID' && (
                      <>
                        <div className="text-[28px] font-bold" style={{ color:'var(--rose)', letterSpacing:'-0.03em' }}>
                          ₹{(currentMonthPay.amount||MONTHLY_AMOUNT).toLocaleString()} Due
                        </div>
                        <div className="text-[12px] mt-1" style={{ color:'var(--ink-3)' }}>
                          Tap below to record payment
                        </div>
                      </>
                    )}
                    {currentMonthPay.status === 'PAID' && (
                      <div className="text-[12px] mt-1" style={{ color:'var(--ink-3)' }}>
                        Paid ₹{(currentMonthPay.paidAmount || currentMonthPay.amount || MONTHLY_AMOUNT).toLocaleString()} on {currentMonthPay.paidOn}
                      </div>
                    )}
                  </div>
                  {currentMonthPay.status !== 'PAID'
                    ? <button onClick={() => openPayModal(currentMonthPay)}
                        className="btn-primary px-5 py-3 text-[14px]">
                        <CreditCard size={16}/>
                        {currentMonthPay.status === 'PARTIAL' ? 'Pay Balance' : 'Pay Now'}
                      </button>
                    : <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background:'#ecfdf5' }}>
                        <CheckCircle2 size={28} style={{ color:'var(--emerald)' }} />
                      </div>
                  }
                </div>
              </div>
            )}

            {!currentMonthPay && (
              <div className="card p-5 flex items-center gap-3"
                style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                <Info size={18} style={{ color:'var(--amber)' }} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color:'#78350f' }}>
                    No record for {getMonthLabel(currentMonth, currentYear)}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color:'#92400e' }}>
                    Admin may not have generated dues yet.
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Paid</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--emerald)', letterSpacing:'-0.02em' }}>{fmt(totalPaid)}</div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{payments.filter(p=>p.status==='PAID').length} months</div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Pending</div>
                <div className="text-[20px] font-bold mt-0.5"
                  style={{ color: totalPending > 0 ? 'var(--rose)' : 'var(--emerald)', letterSpacing:'-0.02em' }}>
                  {totalPending > 0 ? fmt(totalPending) : 'Clear ✓'}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                  {payments.filter(p=>p.status!=='PAID').length} pending
                </div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Monthly</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--indigo)', letterSpacing:'-0.02em' }}>{fmt(MONTHLY_AMOUNT)}</div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>this month</div>
              </div>
            </div>

            {/* Payment history */}
            <div className="card overflow-hidden">
              <div className="card-header"><span className="card-title">Payment History</span></div>
              {payments.length === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No records yet</div>
              ) : payments.map(p => {
                const ss = statusStyle(p)
                return (
                  <div key={p.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom:'1px solid var(--border)', background: p.status === 'PARTIAL' ? '#fffbeb' : 'white' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>
                        {getMonthLabel(p.month, p.year)}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                        {p.status === 'PAID'
                          ? `Paid ₹${(p.paidAmount||p.amount||MONTHLY_AMOUNT).toLocaleString()} · ${p.paymentMode}`
                          : p.status === 'PARTIAL'
                          ? `Paid ₹${(p.paidAmount||0).toLocaleString()} · Balance ₹${((p.amount||MONTHLY_AMOUNT)-(p.paidAmount||0)).toLocaleString()}`
                          : 'Not paid yet'}
                      </div>
                    </div>
                    <div className="text-right mr-2">
                      <div className="text-[13px] font-bold" style={{ color: ss.color }}>
                        ₹{(p.amount||MONTHLY_AMOUNT).toLocaleString()}
                      </div>
                      <div className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{ background: ss.bg, color: ss.color }}>
                        {ss.label}
                      </div>
                    </div>
                    {p.status === 'PAID'
                      ? <button onClick={() => handleUndoPay(p)}
                          className="text-[10px] px-2.5 py-1.5 rounded-xl font-semibold flex-shrink-0"
                          style={{ background:'#fff1f2', color:'#e11d48', border:'1px solid #fca5a5' }}>
                          ↩ Undo
                        </button>
                      : <button onClick={() => openPayModal(p)}
                          className="text-[11px] px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                          style={{ background: p.status === 'PARTIAL' ? '#fffbeb' : '#ffe4e6',
                                   color: p.status === 'PARTIAL' ? '#92400e' : '#9f1239',
                                   border: `1px solid ${p.status === 'PARTIAL' ? '#fde68a' : '#fca5a5'}` }}>
                          {p.status === 'PARTIAL' ? 'Pay Balance' : 'Pay'}
                        </button>
                    }
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Pay Modal ── */}
      <Modal open={!!showPay} onClose={closePayModal}
        title={showPay?.status === 'PARTIAL' ? `Pay Balance — ${getMonthLabel(showPay?.month, showPay?.year)}` : `Pay — ${showPay ? getMonthLabel(showPay.month, showPay.year) : ''}`}>
        {showPay && (
          <div className="space-y-4">
            {/* Amount due banner */}
            <div className="rounded-xl p-4 text-center"
              style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
              <div className="text-[11px] font-medium" style={{ color:'var(--ink-3)' }}>
                {showPay.status === 'PARTIAL' ? 'Balance Due' : 'Amount Due'}
              </div>
              <div className="text-[34px] font-bold mt-0.5"
                style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>
                ₹{due.toLocaleString()}
              </div>
              {showPay.status === 'PARTIAL' && (
                <div className="text-[11px] mt-1" style={{ color:'var(--ink-3)' }}>
                  Already paid ₹{(showPay.paidAmount||0).toLocaleString()} · Total ₹{(showPay.amount||MONTHLY_AMOUNT).toLocaleString()}
                </div>
              )}
              <div className="text-[10px] mt-1" style={{ color:'var(--ink-4)' }}>
                {getMonthLabel(showPay.month, showPay.year)} · Flat {user?.flatNo}
              </div>
            </div>

            {step === STEP.CHOOSE && (
              <>
                {/* UPI Payment section */}
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background:'var(--surface-3)', border:'1px solid var(--border)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-wide"
                    style={{ color:'var(--ink-3)' }}>Pay via UPI</div>

                  <div className="rounded-xl p-3"
                    style={{ background:'white', border:'1px solid var(--border)' }}>
                    <div className="text-[10px]" style={{ color:'var(--ink-4)' }}>UPI ID</div>
                    <div className="text-[13px] font-bold mt-0.5 break-all" style={{ color:'var(--ink)' }}>
                      {UPI_ID}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color:'var(--ink-3)' }}>
                      Payee: {PAYEE_NAME}
                    </div>
                  </div>

                  <CopyUPI upiId={UPI_ID} />

                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                    style={{ background:'#f0f9ff', border:'1px solid #bae6fd' }}>
                    <Info size={12} style={{ color:'#0284c7', flexShrink:0, marginTop:2 }} />
                    <span className="text-[11px]" style={{ color:'#0369a1' }}>
                      Open GPay / PhonePe → New Payment → Paste UPI ID → Pay ₹{due.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      ['Account', '5219101005304'],
                      ['IFSC', 'CNRB0005219'],
                      ['Bank', 'Canara Bank'],
                    ].map(([k,v]) => (
                      <div key={k} className="rounded-lg p-2" style={{ background:'white', border:'1px solid var(--border)' }}>
                        <div style={{ color:'var(--ink-4)' }}>{k}</div>
                        <div className="font-semibold" style={{ color:'var(--ink-2)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setStep(STEP.CONFIRM)}
                  className="btn-primary w-full justify-center">
                  <CheckCircle2 size={15} /> I've Paid — Record Payment
                </button>
              </>
            )}

            {step === STEP.CONFIRM && (
              <div className="space-y-4">
                <p className="text-[13px] font-semibold text-center" style={{ color:'var(--ink-2)' }}>
                  How much did you pay?
                </p>

                {/* Amount input */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                    style={{ color:'var(--ink-2)' }}>Amount Paid (₹) *</label>
                  <input
                    className="input text-[18px] font-bold text-center"
                    type="number"
                    placeholder={`e.g. ${due}`}
                    value={paidAmount}
                    onChange={e => { setPaidAmount(e.target.value); setAmountErr('') }}
                  />
                  {amountErr && (
                    <p className="text-[11px] mt-1" style={{ color:'var(--rose)' }}>{amountErr}</p>
                  )}

                  {/* Amount feedback */}
                  {enteredAmount > 0 && (
                    <div className="mt-2 px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2"
                      style={{
                        background: isOver ? '#ecfdf5' : isPartial ? '#fffbeb' : '#ecfdf5',
                        border: `1px solid ${isOver ? '#6ee7b7' : isPartial ? '#fde68a' : '#6ee7b7'}`,
                        color: isOver ? '#065f46' : isPartial ? '#92400e' : '#065f46',
                      }}>
                      {isPartial
                        ? <><AlertTriangle size={13} /> Partial payment — ₹{(due - enteredAmount).toLocaleString()} balance will be tracked</>
                        : isOver
                        ? <><CheckCircle2 size={13} /> Overpayment — ₹{(enteredAmount - due).toLocaleString()} extra noted</>
                        : <><CheckCircle2 size={13} /> Exact amount — will be marked as Paid!</>
                      }
                    </div>
                  )}
                </div>

                {/* Payment mode */}
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

                {/* Reference */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                    style={{ color:'var(--ink-2)' }}>
                    Reference <span style={{ color:'var(--ink-4)', fontWeight:400 }}>(optional)</span>
                  </label>
                  <input className="input" placeholder="UPI transaction ID, receipt no. etc."
                    value={payRef} onChange={e => setPayRef(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <button onClick={handleConfirmPay} disabled={submitting}
                    className="btn-primary flex-1 justify-center">
                    <CheckCircle2 size={14} />
                    {submitting ? 'Recording...' : isPartial ? 'Record Partial Payment' : 'Confirm Payment'}
                  </button>
                  <button onClick={() => setStep(STEP.CHOOSE)} className="btn-ghost">Back</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Success modal */}
      <Modal open={!!success} onClose={() => setSuccess(null)} title="Payment Recorded!">
        {success && (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: success.paidAmount < (success.amount || MONTHLY_AMOUNT) ? '#fffbeb' : '#ecfdf5' }}>
              {success.paidAmount < (success.amount || MONTHLY_AMOUNT)
                ? <AlertTriangle size={36} style={{ color:'#d97706' }} />
                : <CheckCircle2 size={36} style={{ color:'var(--emerald)' }} />
              }
            </div>
            <h3 className="text-[18px] font-bold" style={{ color:'var(--ink)' }}>
              {success.paidAmount < (success.amount || MONTHLY_AMOUNT) ? 'Partial Payment Recorded' : 'Payment Recorded! 🎉'}
            </h3>
            <p className="text-[13px]" style={{ color:'var(--ink-3)' }}>
              ₹{(success.paidAmount||0).toLocaleString()} recorded for{' '}
              <strong>{getMonthLabel(success.month, success.year)}</strong>.
              {success.paidAmount < (success.amount || MONTHLY_AMOUNT) && (
                <span style={{ color:'#d97706' }}>
                  {' '}Balance ₹{((success.amount||MONTHLY_AMOUNT) - success.paidAmount).toLocaleString()} remaining.
                </span>
              )}
            </p>
            <button onClick={() => setSuccess(null)} className="btn-primary px-8 py-2.5 mx-auto">Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}