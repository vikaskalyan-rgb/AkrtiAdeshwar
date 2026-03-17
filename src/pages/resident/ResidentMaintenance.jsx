import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge, Modal } from '../../components/ui'
import { CheckCircle2, CreditCard, Info } from 'lucide-react'
import api from '../../api/config'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

export default function ResidentMaintenance() {
  const { user } = useAuth()
  const now = new Date()

  const [payments, setPayments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showPay, setShowPay]       = useState(null)
  const [payMode, setPayMode]       = useState('UPI')
  const [payRef, setPayRef]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(null)

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
  const MONTHLY_AMOUNT  = 4200

  const totalPaid    = payments.filter(p => p.status === 'PAID').reduce((s,p) => s + (p.amount||0), 0)
  const totalPending = payments.filter(p => p.status === 'UNPAID').length * MONTHLY_AMOUNT

  const getMonthLabel = (month, year) => {
    return new Date(year, month-1).toLocaleString('default', { month:'short', year:'numeric' })
  }

  const handleMarkPaid = async () => {
    if (!showPay) return
    setSubmitting(true)
    try {
      await api.post(
        `/api/maintenance/flat/${user.flatNo}/pay?month=${showPay.month}&year=${showPay.year}`,
        {
          paymentMode: payMode.toUpperCase().replace(' ','_'),
          transactionRef: payRef,
        }
      )
      await fetchPayments()
      setSuccess(showPay)
      setShowPay(null)
      setPayRef('')
      setPayMode('UPI')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark payment')
    } finally {
      setSubmitting(false)
    }
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
                  style={{ background: currentMonthPay.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }} />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>
                      {getMonthLabel(currentMonthPay.month, currentMonthPay.year)}
                    </div>
                    <div className="text-[28px] md:text-[32px] font-bold" style={{
                      color: currentMonthPay.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)',
                      letterSpacing:'-0.03em'
                    }}>
                      {currentMonthPay.status === 'PAID' ? '✓ Paid' : `₹${MONTHLY_AMOUNT.toLocaleString()} Due`}
                    </div>
                    <div className="text-[12px] mt-1" style={{ color:'var(--ink-3)' }}>
                      {currentMonthPay.status === 'PAID'
                        ? `Paid on ${currentMonthPay.paidOn} via ${currentMonthPay.paymentMode}`
                        : 'Please pay and mark here'}
                    </div>
                  </div>
                  {currentMonthPay.status === 'UNPAID'
                    ? <button onClick={() => setShowPay(currentMonthPay)} className="btn-primary px-5 py-3 text-[14px]">
                        <CreditCard size={16}/> Mark Paid
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
              <div className="card p-5 flex items-center gap-3" style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
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
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Paid</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--emerald)', letterSpacing:'-0.02em' }}>
                  {fmt(totalPaid)}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                  {payments.filter(p=>p.status==='PAID').length} months
                </div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Pending</div>
                <div className="text-[20px] font-bold mt-0.5"
                  style={{ color: totalPending > 0 ? 'var(--rose)' : 'var(--emerald)', letterSpacing:'-0.02em' }}>
                  {totalPending > 0 ? fmt(totalPending) : 'Clear ✓'}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                  {payments.filter(p=>p.status==='UNPAID').length} due
                </div>
              </div>
              <div className="card p-3 md:p-4">
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Monthly</div>
                <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--indigo)', letterSpacing:'-0.02em' }}>
                  {fmt(MONTHLY_AMOUNT)}
                </div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>fixed amount</div>
              </div>
            </div>

            {/* Payment history */}
            <div className="card overflow-hidden">
              <div className="card-header"><span className="card-title">Payment History</span></div>
              {payments.length === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No payment records yet</div>
              ) : payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>
                      {getMonthLabel(p.month, p.year)}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                      {p.status === 'PAID'
                        ? `${p.paidOn} · ${p.paymentMode}`
                        : 'Not paid yet'}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    <div className="text-[13px] font-bold"
                      style={{ color: p.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }}>
                      {p.status === 'PAID' ? fmt(p.amount) : fmt(MONTHLY_AMOUNT)}
                    </div>
                  </div>
                  {p.status === 'UNPAID'
                    ? <button onClick={() => setShowPay(p)}
                        className="text-[11px] px-3 py-1.5 rounded-xl font-semibold flex-shrink-0"
                        style={{ background:'#ffe4e6', color:'#9f1239' }}>Pay</button>
                    : <StatusBadge status="paid" />
                  }
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
              style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
              <Info size={14} style={{ color:'var(--indigo)' }} className="flex-shrink-0 mt-0.5" />
              <p className="text-[12px]" style={{ color:'var(--indigo)' }}>
                After paying via UPI/Cash, click <strong>Mark Paid</strong> to update the admin dashboard.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Pay Modal */}
      <Modal open={!!showPay} onClose={() => { setShowPay(null); setPayRef('') }}
        title={`Pay — ${showPay ? getMonthLabel(showPay.month, showPay.year) : ''}`}>
        {showPay && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-center"
              style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
              <div className="text-[12px] font-medium" style={{ color:'var(--ink-3)' }}>Amount</div>
              <div className="text-[32px] font-bold mt-0.5"
                style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>
                ₹{MONTHLY_AMOUNT.toLocaleString()}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                {getMonthLabel(showPay.month, showPay.year)} · Flat {user?.flatNo}
              </div>
            </div>

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
                Reference <span style={{ color:'var(--ink-4)' }}>(optional)</span>
              </label>
              <input className="input" placeholder="UPI ID, receipt no., etc."
                value={payRef} onChange={e => setPayRef(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button onClick={handleMarkPaid} disabled={submitting}
                className="btn-primary flex-1 justify-center">
                <CheckCircle2 size={14}/>
                {submitting ? 'Recording...' : 'Confirm Payment'}
              </button>
              <button onClick={() => { setShowPay(null); setPayRef('') }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal open={!!success} onClose={() => setSuccess(null)} title="Payment Recorded!">
        {success && (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background:'#ecfdf5' }}>
              <CheckCircle2 size={36} style={{ color:'var(--emerald)' }} />
            </div>
            <h3 className="text-[18px] font-bold" style={{ color:'var(--ink)' }}>Payment Recorded!</h3>
            <p className="text-[13px]" style={{ color:'var(--ink-3)' }}>
              ₹{MONTHLY_AMOUNT.toLocaleString()} for{' '}
              <strong>{getMonthLabel(success.month, success.year)}</strong>{' '}
              has been recorded. Admin dashboard updated.
            </p>
            <button onClick={() => setSuccess(null)} className="btn-primary px-8 py-2.5 mx-auto">Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}