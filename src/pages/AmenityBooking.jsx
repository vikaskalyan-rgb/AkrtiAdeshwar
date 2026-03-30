import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, CheckCircle2, XCircle, Clock,
  CalendarDays, Building2, ChevronLeft, ChevronRight,
  Mail, Smartphone, ExternalLink, Info
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

// ── Constants ─────────────────────────────────────────────
const AMENITIES = [
  { value: 'COMMUNITY_HALL', label: 'Community Hall', icon: Building2, color: '#5b52f0', bg: '#eeeeff' },
]

const TIME_SLOTS = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM',
]

const STATUS_STYLE = {
  PENDING:          { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending Approval' },
  APPROVED:         { color: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc', label: 'Approved — Pay ₹2,000' },
  PAYMENT_PENDING:  { color: '#0284c7', bg: '#f0f9ff', border: '#7dd3fc', label: 'Pay ₹2,000 to Confirm' },
  CONFIRMED:        { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', label: 'Confirmed ✓' },
  REJECTED:         { color: '#e11d48', bg: '#fff1f2', border: '#fca5a5', label: 'Rejected' },
}

const HALL_BOOKING_FEE = 2000
const UPI_ID           = 'ppr.05219.21092023.00196023@cnrb'
const PAYEE_NAME       = 'Akrti Aadeshwar Owners Association'

function buildUpiUrl(flatNo, purpose) {
  const note = `Hall Booking ${purpose} Flat ${flatNo}`
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${HALL_BOOKING_FEE}&cu=INR&tn=${encodeURIComponent(note)}`
}

// ── Field — outside to prevent re-mount ──────────────────
const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
      {label}{required && <span style={{ color: 'var(--rose)' }}> *</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] mt-1" style={{ color: 'var(--ink-4)' }}>{hint}</p>}
  </div>
)

// ── BookingForm — outside to prevent re-mount ─────────────
const BookingForm = ({ form, setForm, errors, saving, takenDates, onSave, onCancel }) => {
  const today   = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const isTaken = form.bookingDate && takenDates.includes(form.bookingDate)

  return (
    <div className="space-y-4">

      {/* Amenity */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
          style={{ color: 'var(--ink-2)' }}>Amenity</label>
        {AMENITIES.map(a => {
          const Icon = a.icon
          return (
            <div key={a.value} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: a.bg, border: `2px solid ${a.color}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: a.color }}>
                <Icon size={16} className="text-white" />
              </div>
              <div>
                <span className="text-[13px] font-bold" style={{ color: a.color }}>
                  {a.label}
                </span>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                  Booking fee: ₹2,000 (payable after approval)
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Date */}
      <Field label="Booking Date" required>
        <input className="input" type="date" min={today}
          value={form.bookingDate}
          onChange={e => setForm(f => ({ ...f, bookingDate: e.target.value }))} />
        {errors?.bookingDate && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.bookingDate}</p>
        )}
        {isTaken && (
          <p className="text-[10px] mt-1 font-semibold" style={{ color: 'var(--rose)' }}>
            ⚠ Community Hall is already booked on this date
          </p>
        )}
      </Field>

      {/* Time */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Time" required>
          <select className="select w-full" value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}>
            <option value="">From...</option>
            {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
          </select>
          {errors?.startTime && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.startTime}</p>
          )}
        </Field>
        <Field label="End Time">
          <select className="select w-full" value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}>
            <option value="">To...</option>
            {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      {/* Purpose */}
      <Field label="Purpose / Event Name" required>
        <input className="input"
          placeholder='e.g. "Birthday Party", "Family Function", "Meeting"'
          value={form.purpose}
          onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
        {errors?.purpose && (
          <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.purpose}</p>
        )}
      </Field>

      {/* Info */}
      <div className="rounded-xl p-3 space-y-2"
        style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
        <div className="flex items-center gap-2">
          <Mail size={12} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
          <p className="text-[11px]" style={{ color: 'var(--indigo)' }}>
            Request will be emailed to all committee admins for approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
          <p className="text-[11px]" style={{ color: 'var(--indigo)' }}>
            Once approved, pay <strong>₹2,000</strong> via UPI to confirm the booking.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || isTaken}
          className="btn-primary flex-1 justify-center">
          {saving ? 'Submitting...' : '📨 Request & Notify Admins'}
        </button>
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </div>
  )
}

// ── Pay Modal — shown to resident after approval ──────────
const PayBookingModal = ({ booking, onPaid, onCancel }) => {
  const { user }   = useAuth()
  const [step, setStep]       = useState('choose') // choose | apps | confirm
  const [payRef, setPayRef]   = useState('')
  const [paying, setPaying]   = useState(false)
  const [success, setSuccess] = useState(false)

  const upiUrl  = buildUpiUrl(user?.flatNo, booking?.purpose)

  const UPI_APPS = [
    { name: 'Google Pay',  emoji: '🔵', color: '#4285F4', bg: '#EAF2FF',
      url: upiUrl.replace('upi://', 'gpay://upi/') },
    { name: 'PhonePe',     emoji: '🟣', color: '#5f259f', bg: '#F3ECFF',
      url: `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${HALL_BOOKING_FEE}&cu=INR` },
    { name: 'Paytm',       emoji: '🔷', color: '#00BAF2', bg: '#E6F9FF',
      url: `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${HALL_BOOKING_FEE}&cu=INR` },
    { name: 'BHIM / Other',emoji: '📱', color: '#FF6B35', bg: '#FFF0EB',
      url: upiUrl },
  ]

  const handleUpiClick = (url) => {
    window.location.href = url
    setTimeout(() => setStep('confirm'), 2000)
  }

  const handleConfirmPaid = async () => {
    setPaying(true)
    try {
      await api.patch(`/api/amenity-bookings/${booking.id}/confirm-payment`, {
        transactionRef: payRef,
      })
      setSuccess(true)
      setTimeout(() => { onPaid() }, 2000)
    } catch {
      alert('Failed to confirm payment. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (success) return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="text-[56px]">🎉</div>
      <div className="text-[18px] font-bold" style={{ color: '#059669' }}>
        Booking Confirmed!
      </div>
      <div className="text-[13px] text-center" style={{ color: 'var(--ink-3)' }}>
        Community Hall is booked for <strong>{booking.purpose}</strong>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">

      {/* Amount banner */}
      <div className="rounded-xl p-4 text-center"
        style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
        <div className="text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
          Hall Booking Fee
        </div>
        <div className="text-[36px] font-bold" style={{ color: 'var(--indigo)', letterSpacing: '-0.03em' }}>
          ₹2,000
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
          {booking.purpose} · {booking.bookingDate}
        </div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--ink-4)' }}>
          Payee: {PAYEE_NAME}
        </div>
      </div>

      {/* Step: Choose */}
      {step === 'choose' && (
        <div className="space-y-3">
          <p className="text-[12px] text-center font-medium" style={{ color: 'var(--ink-3)' }}>
            Pay ₹2,000 to confirm your hall booking
          </p>
          <button onClick={() => setStep('apps')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-105"
            style={{ background: 'var(--indigo-lt)', border: '2px solid var(--indigo)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--indigo)' }}>
              <Smartphone size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-[13px] font-bold" style={{ color: 'var(--indigo)' }}>
                Pay via UPI
              </div>
              <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                GPay · PhonePe · Paytm · BHIM
              </div>
            </div>
          </button>

          {/* Bank details */}
          <div className="rounded-xl p-3"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
            <div className="text-[9px] font-bold uppercase tracking-wide mb-2"
              style={{ color: 'var(--ink-3)' }}>Bank Transfer Details</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ['Account No', '5219101005304'],
                ['IFSC', 'CNRB0005219'],
                ['Bank', 'Canara Bank'],
                ['UPI ID', UPI_ID],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px]" style={{ color: 'var(--ink-4)' }}>{k}</div>
                  <div className="text-[10px] font-semibold" style={{ color: 'var(--ink-2)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setStep('confirm')}
            className="w-full text-center text-[11px] font-medium py-2"
            style={{ color: 'var(--indigo)' }}>
            Already paid via bank transfer? Confirm here →
          </button>
        </div>
      )}

      {/* Step: UPI Apps */}
      {step === 'apps' && (
        <div className="space-y-3">
          <p className="text-[12px] text-center font-medium" style={{ color: 'var(--ink-3)' }}>
            Choose your UPI app — ₹2,000 will be pre-filled
          </p>
          <div className="grid grid-cols-2 gap-2">
            {UPI_APPS.map(app => (
              <button key={app.name} onClick={() => handleUpiClick(app.url)}
                className="flex items-center gap-2 p-3 rounded-xl transition-all hover:scale-105"
                style={{ background: app.bg, border: `1.5px solid ${app.color}33` }}>
                <span className="text-[24px]">{app.emoji}</span>
                <div className="text-left flex-1">
                  <div className="text-[12px] font-bold" style={{ color: app.color }}>
                    {app.name}
                  </div>
                </div>
                <ExternalLink size={11} style={{ color: app.color, flexShrink: 0 }} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <Info size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span className="text-[10px]" style={{ color: '#78350f' }}>
              After paying, come back and tap "I've Paid" below.
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('confirm')}
              className="btn-primary flex-1 justify-center">
              <CheckCircle2 size={13} /> I've Paid — Confirm
            </button>
            <button onClick={() => setStep('choose')} className="btn-ghost">Back</button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <p className="text-[13px] font-bold text-center" style={{ color: 'var(--ink)' }}>
            Confirm your payment of ₹2,000
          </p>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
              style={{ color: 'var(--ink-2)' }}>
              UPI Transaction ID <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>(optional but recommended)</span>
            </label>
            <input className="input" placeholder="e.g. 406812345678"
              value={payRef}
              onChange={e => setPayRef(e.target.value)} />
            <p className="text-[10px] mt-1" style={{ color: 'var(--ink-3)' }}>
              Find it in your UPI app under transaction history
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleConfirmPaid} disabled={paying}
              className="btn-primary flex-1 justify-center">
              <CheckCircle2 size={14} />
              {paying ? 'Confirming...' : 'Yes, I Paid ₹2,000 ✓'}
            </button>
            <button onClick={() => setStep('apps')} className="btn-ghost">Back</button>
          </div>
        </div>
      )}

      <button onClick={onCancel}
        className="w-full text-center text-[11px]" style={{ color: 'var(--ink-4)' }}>
        Cancel
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────
export default function AmenityBooking() {
  const { user }  = useAuth()
  const isAdmin   = user?.role === 'admin'

  const [bookings,     setBookings]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('ALL')
  const [showBook,     setShowBook]     = useState(false)
  const [actionModal,  setActionModal]  = useState(null)
  const [payModal,     setPayModal]     = useState(null) // booking to pay for
  const [adminNote,    setAdminNote]    = useState('')
  const [acting,       setActing]       = useState(false)
  const [resultBanner, setResultBanner] = useState(null)
  const [form,         setForm]         = useState({
    amenity: 'COMMUNITY_HALL', bookingDate: '',
    startTime: '', endTime: '', purpose: '',
  })
  const [errors,       setErrors]       = useState({})
  const [saving,       setSaving]       = useState(false)

  const now   = new Date()
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const [calYear,  setCalYear]  = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const url = (!isAdmin && user?.flatNo)
        ? `/api/amenity-bookings/flat/${user.flatNo}`
        : '/api/amenity-bookings'
      const res = await api.get(url)
      setBookings(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const takenDates = bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'APPROVED')
    .map(b => b.bookingDate)

  const filtered = bookings.filter(b =>
    filter === 'ALL' || b.status === filter
  )

  const validate = () => {
    const e = {}
    if (!form.bookingDate)     e.bookingDate = 'Please select a date'
    if (!form.startTime)       e.startTime   = 'Select start time'
    if (!form.purpose?.trim()) e.purpose     = 'Please enter the purpose'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/amenity-bookings', {
        ...form,
        flatNo:   user?.flatNo,
        bookedBy: user?.name || user?.identifier,
      })
      await fetchBookings()
      setShowBook(false)
      setForm({ amenity: 'COMMUNITY_HALL', bookingDate: '', startTime: '', endTime: '', purpose: '' })
      setResultBanner({
        text: '✓ Request submitted! All admins have been notified by email.',
        success: true,
      })
      setTimeout(() => setResultBanner(null), 6000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit booking')
    } finally { setSaving(false) }
  }

  const handleAction = async () => {
    if (!actionModal) return
    setActing(true)
    try {
      const endpoint = actionModal.action === 'approve' ? 'approve' : 'reject'
      await api.patch(
        `/api/amenity-bookings/${actionModal.booking.id}/${endpoint}`,
        { adminNote }
      )
      await fetchBookings()
      setActionModal(null)
      setAdminNote('')
      setResultBanner({
        text: actionModal.action === 'approve'
          ? '✓ Approved! Resident notified to pay ₹2,000 to confirm booking.'
          : '✓ Booking rejected — resident notified by email.',
        success: actionModal.action === 'approve',
      })
      setTimeout(() => setResultBanner(null), 5000)
    } catch { alert('Failed to update') }
    finally { setActing(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking request?')) return
    try {
      await api.delete(`/api/amenity-bookings/${id}`)
      await fetchBookings()
    } catch { alert('Failed to cancel') }
  }

  const formatDate = (str) => {
    if (!str) return ''
    return new Date(str + 'T12:00:00').toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const formatCreated = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric', month: 'short'
    })
  }

  // ── Calendar ──────────────────────────────────────────────
  const calDays = () => {
    const first    = new Date(calYear, calMonth, 1).getDay()
    const total    = new Date(calYear, calMonth + 1, 0).getDate()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    const days     = []
    for (let i = 0; i < first; i++) days.push(null)
    for (let d = 1; d <= total; d++) {
      const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const booking = bookings.find(b =>
        b.bookingDate === dateStr && b.status !== 'REJECTED')
      days.push({ day: d, dateStr, booking, isToday: dateStr === todayStr })
    }
    return days
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Amenity Booking" subtitle="Community Hall reservation"
        actions={
          <button onClick={() => { setErrors({}); setShowBook(true) }} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Book Now</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Result banner */}
        {resultBanner && (
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: resultBanner.success ? '#ecfdf5' : '#fff1f2',
              border: `1px solid ${resultBanner.success ? '#6ee7b7' : '#fca5a5'}`,
            }}>
            <div className="flex items-center gap-2">
              <Mail size={14} style={{
                color: resultBanner.success ? 'var(--emerald)' : 'var(--rose)',
                flexShrink: 0,
              }} />
              <span className="text-[12px] font-medium"
                style={{ color: resultBanner.success ? '#065f46' : '#9f1239' }}>
                {resultBanner.text}
              </span>
            </div>
            <button onClick={() => setResultBanner(null)}
              className="text-[16px] leading-none font-bold"
              style={{ color: resultBanner.success ? '#065f46' : '#9f1239' }}>×</button>
          </div>
        )}

        {/* Calendar */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) }
              else setCalMonth(m => m-1)
            }} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </span>
            <button onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) }
              else setCalMonth(m => m+1)
            }} className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold py-1"
                style={{ color: 'var(--ink-4)' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calDays().map((d, i) => (
              <div key={i}
                className="aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium relative"
                style={!d ? {} : d.booking
                  ? {
                      background: d.booking.status === 'CONFIRMED' ? '#ecfdf5'
                                : d.booking.status === 'APPROVED'  ? '#f0f9ff' : '#fffbeb',
                      color:      d.booking.status === 'CONFIRMED' ? '#059669'
                                : d.booking.status === 'APPROVED'  ? '#0284c7' : '#d97706',
                      fontWeight: 700,
                    }
                  : d.isToday
                  ? { background: 'var(--indigo)', color: 'white', fontWeight: 700 }
                  : { color: 'var(--ink-2)' }
                }>
                {d ? d.day : ''}
                {d?.booking && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px]">●</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-3 justify-center flex-wrap">
            {[
              { color: '#059669', bg: '#ecfdf5', l: 'Confirmed' },
              { color: '#0284c7', bg: '#f0f9ff', l: 'Pay Pending' },
              { color: '#d97706', bg: '#fffbeb', l: 'Pending' },
              { color: 'white',   bg: 'var(--indigo)', l: 'Today' },
            ].map(({ color, bg, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: bg, border: `1px solid ${color}` }} />
                <span className="text-[9px]" style={{ color: 'var(--ink-3)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { v: 'ALL',       l: 'All' },
            { v: 'PENDING',   l: '⏳ Pending' },
            { v: 'APPROVED',  l: '💳 Pay Now' },
            { v: 'CONFIRMED', l: '✅ Confirmed' },
            { v: 'REJECTED',  l: '❌ Rejected' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setFilter(v)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === v ? 'var(--indigo)' : 'white',
                color:      filter === v ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${filter === v ? 'var(--indigo)' : 'var(--border)'}`,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>Loading...</div>

        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays size={36} className="mx-auto mb-3"
              style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--ink-2)' }}>
              No bookings yet
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
              Book the Community Hall for your next event
            </p>
          </div>

        ) : (
          <div className="space-y-2">
            {filtered.map(b => {
              const ss    = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING
              const isOwn = b.flatNo === user?.flatNo
              const needsPayment = isOwn && b.status === 'APPROVED'

              return (
                <div key={b.id} className="card p-4"
                  style={{
                    border: `1.5px solid ${ss.border}`,
                    background: needsPayment ? '#f0f9ff' : 'white',
                  }}>

                  {/* Pay now banner */}
                  {needsPayment && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                      style={{ background: '#0284c7', }}>
                      <span className="text-[14px]">💳</span>
                      <span className="text-[12px] font-bold text-white flex-1">
                        Approved! Pay ₹2,000 to confirm your booking
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
                        {b.purpose}
                      </span>
                      <span className="badge text-[9px] font-bold"
                        style={{ background: ss.bg, color: ss.color }}>
                        {ss.label}
                      </span>
                    </div>
                    <div className="text-[12px] mt-1 font-semibold" style={{ color: 'var(--indigo)' }}>
                      📅 {formatDate(b.bookingDate)}
                    </div>
                    {(b.startTime || b.endTime) && (
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        🕐 {b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}
                      </div>
                    )}
                    <div className="text-[10px] mt-1" style={{ color: 'var(--ink-4)' }}>
                      Flat {b.flatNo} · Requested {formatCreated(b.createdAt)}
                    </div>
                    {b.adminNote && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-[11px]"
                        style={{ background: ss.bg, color: ss.color }}>
                        Admin note: {b.adminNote}
                      </div>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <div className="mt-2 flex items-center gap-1.5"
                        style={{ color: '#059669' }}>
                        <CheckCircle2 size={13} />
                        <span className="text-[11px] font-semibold">
                          Payment received · Booking confirmed
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {/* Resident: Pay ₹2000 after approval */}
                    {needsPayment && (
                      <button onClick={() => setPayModal(b)}
                        className="btn-primary flex-1 justify-center"
                        style={{ background: '#0284c7' }}>
                        <Smartphone size={13} /> Pay ₹2,000 to Confirm
                      </button>
                    )}

                    {/* Admin: approve/reject */}
                    {isAdmin && b.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setActionModal({ booking: b, action: 'approve' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                          style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          onClick={() => setActionModal({ booking: b, action: 'reject' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                          style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}>
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}

                    {/* Resident: cancel pending */}
                    {isOwn && b.status === 'PENDING' && (
                      <button onClick={() => handleCancel(b.id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Book Modal */}
      <Modal open={showBook} onClose={() => setShowBook(false)}
        title="Book Community Hall" width="max-w-md">
        <BookingForm
          form={form} setForm={setForm} errors={errors}
          saving={saving} takenDates={takenDates}
          onSave={handleSave} onCancel={() => setShowBook(false)}
        />
      </Modal>

      {/* Pay ₹2000 Modal */}
      <Modal open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Pay Hall Booking Fee" width="max-w-sm">
        {payModal && (
          <PayBookingModal
            booking={payModal}
            onPaid={() => { setPayModal(null); fetchBookings(); setResultBanner({ text: '🎉 Booking confirmed! Community Hall is yours.', success: true }) }}
            onCancel={() => setPayModal(null)}
          />
        )}
      </Modal>

      {/* Admin Approve/Reject Modal */}
      <Modal open={!!actionModal}
        onClose={() => { setActionModal(null); setAdminNote('') }}
        title={actionModal?.action === 'approve' ? '✅ Approve Booking' : '❌ Reject Booking'}
        width="max-w-sm">
        {actionModal && (
          <div className="space-y-4">
            <div className="rounded-xl p-3"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                {actionModal.booking.purpose}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--ink-3)' }}>
                {formatDate(actionModal.booking.bookingDate)} · Flat {actionModal.booking.flatNo}
              </div>
            </div>

            {actionModal.action === 'approve' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: '#f0f9ff', border: '1px solid #7dd3fc' }}>
                <span className="text-[13px]">💳</span>
                <span className="text-[11px]" style={{ color: '#0369a1' }}>
                  After approval, resident will be asked to pay <strong>₹2,000</strong> to confirm the booking.
                </span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold block mb-1.5"
                style={{ color: 'var(--ink-2)' }}>
                Note to resident (optional)
              </label>
              <textarea className="input resize-none h-16"
                placeholder={actionModal.action === 'approve'
                  ? 'e.g. Approved. Please pay ₹2,000 and clean up after the event.'
                  : 'e.g. Hall is already reserved for society meeting.'}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)} />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Mail size={12} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span className="text-[11px]" style={{ color: '#0369a1' }}>
                Resident will be notified by email after you confirm.
              </span>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAction} disabled={acting}
                className="btn-primary flex-1 justify-center"
                style={actionModal.action === 'reject' ? { background: 'var(--rose)' } : {}}>
                {acting ? 'Updating...'
                  : actionModal.action === 'approve'
                  ? '✅ Approve & Notify'
                  : '❌ Reject & Notify'}
              </button>
              <button onClick={() => { setActionModal(null); setAdminNote('') }}
                className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}