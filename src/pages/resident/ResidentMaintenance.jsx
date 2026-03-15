import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { months, payments, MONTHLY_MAINTENANCE } from '../../data/mockData'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge, Modal } from '../../components/ui'
import { CheckCircle2, CreditCard, Info } from 'lucide-react'

function fmt(n) {
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const PAYMENT_MODES = ['UPI', 'Cash', 'Bank Transfer', 'Cheque']

export default function ResidentMaintenance() {
  const { user } = useAuth()
  const [localPayments, setLocalPayments] = useState(payments)
  const [showPay, setShowPay] = useState(null)
  const [payMode, setPayMode] = useState('UPI')
  const [payRef, setPayRef] = useState('')
  const [success, setSuccess] = useState(null)

  const myPayments = useMemo(() =>
    months.map(m => localPayments.find(p => p.flatNo===user?.flatNo && p.month===m.month && p.year===m.year))
      .filter(Boolean).reverse()
  , [localPayments, user])

  const totalPaid    = myPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0)
  const totalPending = myPayments.filter(p=>p.status==='unpaid').length * MONTHLY_MAINTENANCE
  const currentMonthPay = myPayments[0]

  const handleMarkPaid = () => {
    if (!showPay) return
    setLocalPayments(prev => prev.map(p =>
      p.id===showPay.id ? {...p, status:'paid', amount:MONTHLY_MAINTENANCE, paidOn:new Date().toISOString().split('T')[0], paymentMode:payMode, markedByResident:true} : p
    ))
    setSuccess(showPay); setShowPay(null); setPayRef(''); setPayMode('UPI')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="My Maintenance" subtitle={`Flat ${user?.flatNo} · ₹${MONTHLY_MAINTENANCE.toLocaleString()}/month`} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Current month card */}
        {currentMonthPay && (
          <div className="card p-4 md:p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: currentMonthPay.status==='paid' ? 'var(--emerald)' : 'var(--rose)' }} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>
                  {currentMonthPay.monthLabel}
                </div>
                <div className="text-[28px] md:text-[32px] font-bold" style={{
                  color: currentMonthPay.status==='paid' ? 'var(--emerald)' : 'var(--rose)',
                  letterSpacing: '-0.03em'
                }}>
                  {currentMonthPay.status==='paid' ? '✓ Paid' : `₹${MONTHLY_MAINTENANCE.toLocaleString()} Due`}
                </div>
                <div className="text-[12px] mt-1" style={{ color:'var(--ink-3)' }}>
                  {currentMonthPay.status==='paid'
                    ? `Paid on ${currentMonthPay.paidOn} via ${currentMonthPay.paymentMode}`
                    : 'Please pay and mark here'}
                </div>
              </div>
              {currentMonthPay.status==='unpaid'
                ? <button onClick={() => setShowPay(currentMonthPay)} className="btn-primary px-5 py-3 text-[14px]">
                    <CreditCard size={16}/> Mark Paid
                  </button>
                : <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:'#ecfdf5' }}>
                    <CheckCircle2 size={28} style={{ color:'var(--emerald)' }} />
                  </div>
              }
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="card p-3 md:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Paid</div>
            <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--emerald)', letterSpacing:'-0.02em' }}>{fmt(totalPaid)}</div>
            <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{myPayments.filter(p=>p.status==='paid').length} months</div>
          </div>
          <div className="card p-3 md:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Pending</div>
            <div className="text-[20px] font-bold mt-0.5" style={{ color:totalPending>0?'var(--rose)':'var(--emerald)', letterSpacing:'-0.02em' }}>
              {totalPending>0 ? fmt(totalPending) : 'Clear ✓'}
            </div>
            <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{myPayments.filter(p=>p.status==='unpaid').length} due</div>
          </div>
          <div className="card p-3 md:p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Monthly</div>
            <div className="text-[20px] font-bold mt-0.5" style={{ color:'var(--indigo)', letterSpacing:'-0.02em' }}>{fmt(MONTHLY_MAINTENANCE)}</div>
            <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>fixed amount</div>
          </div>
        </div>

        {/* Payment history */}
        <div className="card overflow-hidden">
          <div className="card-header"><span className="card-title">Payment History</span></div>
          {myPayments.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>{p.monthLabel}</div>
                <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                  {p.status==='paid' ? `${p.paidOn} · ${p.paymentMode}` : 'Not paid yet'}
                </div>
              </div>
              <div className="text-right mr-3">
                <div className="text-[13px] font-bold" style={{ color:p.status==='paid'?'var(--emerald)':'var(--rose)' }}>
                  {p.status==='paid' ? fmt(p.amount) : fmt(MONTHLY_MAINTENANCE)}
                </div>
              </div>
              {p.status==='unpaid'
                ? <button onClick={() => setShowPay(p)} className="text-[11px] px-3 py-1.5 rounded-xl font-semibold flex-shrink-0" style={{ background:'#ffe4e6', color:'#9f1239' }}>Pay</button>
                : <StatusBadge status="paid" />
              }
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
          <Info size={14} style={{ color:'var(--indigo)' }} className="flex-shrink-0 mt-0.5" />
          <p className="text-[12px]" style={{ color:'var(--indigo)' }}>
            After paying via UPI/Cash, click <strong>Mark Paid</strong> to update the admin dashboard.
          </p>
        </div>
      </div>

      <Modal open={!!showPay} onClose={() => { setShowPay(null); setPayRef('') }} title={`Pay — ${showPay?.monthLabel}`}>
        {showPay && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-center" style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
              <div className="text-[12px] font-medium" style={{ color:'var(--ink-3)' }}>Amount</div>
              <div className="text-[32px] font-bold mt-0.5" style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>₹{MONTHLY_MAINTENANCE.toLocaleString()}</div>
              <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>{showPay.monthLabel} · Flat {user?.flatNo}</div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color:'var(--ink-2)' }}>Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map(m => (
                  <button key={m} onClick={() => setPayMode(m)}
                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                    style={payMode===m ? { background:'var(--indigo)', color:'white', border:'1px solid var(--indigo)' } : { background:'var(--surface-3)', color:'var(--ink-2)', border:'1px solid var(--border)' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Reference <span style={{ color:'var(--ink-4)' }}>(optional)</span></label>
              <input className="input" placeholder="UPI ID, receipt no., etc." value={payRef} onChange={e=>setPayRef(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleMarkPaid} className="btn-primary flex-1 justify-center"><CheckCircle2 size={14}/> Confirm Payment</button>
              <button onClick={() => { setShowPay(null); setPayRef('') }} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!success} onClose={() => setSuccess(null)} title="Payment Recorded!">
        {success && (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background:'#ecfdf5' }}>
              <CheckCircle2 size={36} style={{ color:'var(--emerald)' }} />
            </div>
            <h3 className="text-[18px] font-bold" style={{ color:'var(--ink)' }}>Payment Recorded!</h3>
            <p className="text-[13px]" style={{ color:'var(--ink-3)' }}>
              ₹{MONTHLY_MAINTENANCE.toLocaleString()} for <strong>{success.monthLabel}</strong> has been recorded. Admin dashboard updated.
            </p>
            <button onClick={() => setSuccess(null)} className="btn-primary px-8 py-2.5 mx-auto">Done</button>
          </div>
        )}
      </Modal>
    </div>
  )
}