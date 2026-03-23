import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { Package, PlusCircle, CheckCircle2, Search, Clock } from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const COURIERS = ['Amazon', 'Flipkart', 'Meesho', 'Swiggy Instamart', 'Zepto',
                  'Blinkit', 'DTDC', 'BlueDart', 'Delhivery', 'India Post', 'Other']

const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
      {label}{required && <span style={{ color: 'var(--rose)' }}> *</span>}
    </label>
    {children}
  </div>
)

const LogForm = ({ form, setForm, errors, saving, onSave, onCancel }) => (
  <div className="space-y-4">
    <Field label="Flat Number" required>
      <input className="input" placeholder="e.g. 3A, 2H, 4B"
        value={form.flatNo}
        onChange={e => setForm(f => ({ ...f, flatNo: e.target.value.toUpperCase() }))} />
      {errors?.flatNo && <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.flatNo}</p>}
    </Field>

    <Field label="Courier / Platform">
      <select className="select w-full"
        value={form.courierName}
        onChange={e => setForm(f => ({ ...f, courierName: e.target.value }))}>
        <option value="">Select courier...</option>
        {COURIERS.map(c => <option key={c}>{c}</option>)}
      </select>
    </Field>

    <Field label="Description (optional)">
      <input className="input" placeholder='e.g. "Box", "Envelope", "Grocery bag"'
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
    </Field>

    <div className="flex gap-2">
      <button onClick={onSave} disabled={saving} className="btn-primary flex-1 justify-center">
        <Package size={14} />
        {saving ? 'Logging...' : 'Log Parcel'}
      </button>
      <button onClick={onCancel} className="btn-ghost">Cancel</button>
    </div>
  </div>
)

export default function DeliveryTracker() {
  const { user }       = useAuth()
  const isSupervisor   = user?.identifier === 'SUP' || user?.role === 'supervisor'
  const isAdmin        = user?.role === 'admin'
  const canLog         = isSupervisor || isAdmin

  const [deliveries, setDeliveries] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('PENDING')
  const [search,     setSearch]     = useState('')
  const [showLog,    setShowLog]    = useState(false)
  const [form,       setForm]       = useState({ flatNo:'', courierName:'', description:'' })
  const [errors,     setErrors]     = useState({})
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { fetchDeliveries() }, [])

  const fetchDeliveries = async () => {
    setLoading(true)
    try {
      // Residents see only their flat; admins/sup see all
      const url = (!isAdmin && !isSupervisor && user?.flatNo)
        ? `/api/deliveries/flat/${user.flatNo}`
        : '/api/deliveries'
      const res = await api.get(url)
      setDeliveries(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = deliveries.filter(d => {
    const matchFilter = filter === 'ALL' || d.status === filter
    const matchSearch = search === '' ||
      d.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
      d.courierName?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const pendingCount   = deliveries.filter(d => d.status === 'PENDING').length
  const myPending      = deliveries.filter(d =>
    d.flatNo === user?.flatNo && d.status === 'PENDING').length

  const validate = () => {
    const e = {}
    if (!form.flatNo.trim()) e.flatNo = 'Flat number is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/deliveries', {
        ...form,
        loggedBy: user?.identifier,
      })
      await fetchDeliveries()
      setShowLog(false)
      setForm({ flatNo: '', courierName: '', description: '' })
    } catch { alert('Failed to log') }
    finally { setSaving(false) }
  }

  const handleCollect = async (id) => {
    try {
      await api.patch(`/api/deliveries/${id}/collect`)
      await fetchDeliveries()
    } catch { alert('Failed to update') }
  }

  const formatTime = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleString('en-IN', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const timeSince = (str) => {
    if (!str) return ''
    const diff = Date.now() - new Date(str).getTime()
    const hrs  = Math.floor(diff / 3600000)
    const mins = Math.floor(diff / 60000)
    if (hrs > 24) return `${Math.floor(hrs/24)}d ago`
    if (hrs > 0)  return `${hrs}h ago`
    return `${mins}m ago`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Deliveries" subtitle="Parcel and courier tracking"
        actions={canLog && (
          <button onClick={() => { setForm({ flatNo:'', courierName:'', description:'' }); setErrors({}); setShowLog(true) }}
            className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Log Parcel</span>
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* My parcel alert */}
        {myPending > 0 && (
          <div className="card p-4 flex items-center gap-3"
            style={{ background: '#fffbeb', border: '2px solid #fde68a' }}>
            <span className="text-[28px]">📦</span>
            <div>
              <div className="text-[14px] font-bold" style={{ color: '#78350f' }}>
                You have {myPending} parcel{myPending > 1 ? 's' : ''} waiting!
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: '#92400e' }}>
                Collect from the security desk
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Waiting',   value: deliveries.filter(d=>d.status==='PENDING').length,   color:'#d97706', bg:'#fffbeb' },
            { label: 'Collected', value: deliveries.filter(d=>d.status==='COLLECTED').length, color:'#059669', bg:'#ecfdf5' },
            { label: 'Total',     value: deliveries.length,                                   color:'var(--indigo)', bg:'var(--indigo-lt)' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                style={{ color: 'var(--ink-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="space-y-2">
          {(isAdmin || isSupervisor) && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-4)' }} />
              <input className="input pl-9 w-full" placeholder="Search by flat, courier..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
          <div className="flex gap-1.5">
            {[
              { v: 'PENDING',   l: '⏳ Waiting' },
              { v: 'COLLECTED', l: '✅ Collected' },
              { v: 'ALL',       l: 'All' },
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
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>Loading...</div>

        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Package size={36} className="mx-auto mb-3"
              style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--ink-2)' }}>
              {filter === 'PENDING' ? 'No parcels waiting' : 'No deliveries found'}
            </p>
          </div>

        ) : (
          <div className="card overflow-hidden">
            {filtered.map((d, i) => (
              <div key={d.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{
                    background: d.status === 'PENDING' ? '#fffbeb' : '#ecfdf5',
                  }}>
                  {d.status === 'PENDING' ? '📦' : '✅'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: 'var(--indigo)' }}>
                      Flat {d.flatNo}
                    </span>
                    {d.courierName && (
                      <span className="badge text-[9px]"
                        style={{ background: '#f0f9ff', color: '#0284c7' }}>
                        {d.courierName}
                      </span>
                    )}
                    {d.status === 'PENDING' && (
                      <span className="flex items-center gap-1 text-[10px]"
                        style={{ color: '#d97706' }}>
                        <Clock size={10} /> {timeSince(d.loggedAt)}
                      </span>
                    )}
                  </div>
                  {d.description && (
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {d.description}
                    </div>
                  )}
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>
                    {d.status === 'COLLECTED'
                      ? `Collected ${formatTime(d.collectedAt)}`
                      : `Arrived ${formatTime(d.loggedAt)}`
                    }
                  </div>
                </div>

                {/* Collect button */}
                {d.status === 'PENDING' &&
                 (d.flatNo === user?.flatNo || isAdmin || isSupervisor) && (
                  <button onClick={() => handleCollect(d.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all hover:scale-105"
                    style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
                    <CheckCircle2 size={13} />
                    Collected
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log Incoming Parcel">
        <LogForm form={form} setForm={setForm} errors={errors}
          saving={saving} onSave={handleSave} onCancel={() => setShowLog(false)} />
      </Modal>
    </div>
  )
}