import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { Search, Edit2, CheckCircle2, Building2, Info } from 'lucide-react'
import api from '../api/config'

const OWNER_TYPES = [
  { value: 'OWNER_OCCUPIED', label: 'Owner Occupied' },
  { value: 'RENTED',         label: 'Rented' },
  { value: 'VACANT',         label: 'Vacant' },
]

const EMPTY_FORM = {
  ownerType:     'OWNER_OCCUPIED',
  ownerName:     '',
  ownerPhone:    '',
  ownerEmail:    '',
  residentName:  '',
  residentPhone: '',
  residentEmail: '',
  parkingSlot:   '',
}

// ── Field component outside to prevent re-mount on keystroke ──
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 flex items-center gap-1"
      style={{ color: 'var(--ink-2)' }}>
      {label}
      {required && <span style={{ color: 'var(--rose)' }}>*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>
        {error}
      </p>
    )}
  </div>
)

export default function FlatManagement() {
  const [flats,   setFlats]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [errors,  setErrors]  = useState({})

  useEffect(() => { fetchFlats() }, [])

  const fetchFlats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/flats')
      setFlats(res.data.filter(f => f.floor > 0))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = flats.filter(f => {
    const matchSearch = search === '' ||
      f.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      f.residentName?.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerPhone?.includes(search) ||
      f.residentPhone?.includes(search)
    const matchFilter =
      filter === 'all' ||
      (filter === 'vacant'   && f.ownerType === 'VACANT') ||
      (filter === 'rented'   && f.ownerType === 'RENTED') ||
      (filter === 'occupied' && f.ownerType === 'OWNER_OCCUPIED') ||
      (filter === 'unknown'  && (f.ownerName === 'Unknown' || !f.ownerPhone))
    return matchSearch && matchFilter
  }).sort((a, b) => a.flatNo.localeCompare(b.flatNo))

  const stats = {
    total:    flats.length,
    unknown:  flats.filter(f => f.ownerName === 'Unknown' || !f.ownerPhone).length,
    vacant:   flats.filter(f => f.ownerType === 'VACANT').length,
    occupied: flats.filter(f => f.ownerType !== 'VACANT').length,
  }

  const openEdit = (flat) => {
    setErrors({})
    setForm({
      ownerType:     flat.ownerType || 'VACANT',
      ownerName:     flat.ownerName === 'Unknown' ? '' : (flat.ownerName || ''),
      ownerPhone:    flat.ownerPhone || '',
      ownerEmail:    flat.ownerEmail || '',
      residentName:  flat.residentName || '',
      residentPhone: flat.residentPhone || '',
      residentEmail: flat.residentEmail || '',
      parkingSlot:   flat.parkingSlot || '',
    })
    setEditing(flat)
  }

  const validate = () => {
    const e = {}
    if (form.ownerType !== 'VACANT') {
      if (!form.ownerName.trim())
        e.ownerName = 'Owner name is required'
      if (!form.ownerEmail.trim())
        e.ownerEmail = 'Email is required for password reset'
      else if (!/\S+@\S+\.\S+/.test(form.ownerEmail))
        e.ownerEmail = 'Enter a valid email'
    }
    if (form.ownerType === 'RENTED') {
      if (!form.residentName.trim())
        e.residentName = 'Tenant name is required'
      if (!form.residentEmail.trim())
        e.residentEmail = 'Tenant email is required for password reset'
      else if (!/\S+@\S+\.\S+/.test(form.residentEmail))
        e.residentEmail = 'Enter a valid email'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.put(`/api/flats/${editing.flatNo}`, {
        ...form,
        ownerName:  form.ownerType === 'VACANT' ? 'Unknown' : form.ownerName,
        ownerPhone: form.ownerPhone || null,
      })
      await fetchFlats()
      setSavedId(editing.flatNo)
      setTimeout(() => setSavedId(null), 2000)
      setEditing(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const getTypeStyle = (type) => {
    if (type === 'OWNER_OCCUPIED') return { bg:'#eeeeff', color:'var(--indigo)', label:'Owner' }
    if (type === 'RENTED')         return { bg:'#fffbeb', color:'var(--amber)',  label:'Rented' }
    return                                { bg:'#f0f9ff', color:'var(--sky)',    label:'Vacant' }
  }

  const isUnknown = (f) => f.ownerName === 'Unknown' || !f.ownerPhone

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Flat Management" subtitle="Update resident and owner details" />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background:'var(--indigo-lt)', border:'1px solid var(--indigo-md)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color:'var(--indigo)' }} />
          <p className="text-[11px] leading-relaxed" style={{ color:'var(--indigo)' }}>
            Email is mandatory — residents use it to reset their password.
            After saving, a login account is automatically created with default password
            <strong> flatNo@123</strong> (e.g. <strong>2H@123</strong>).
            Tenants use <strong>flatNo_tenant</strong> (e.g. <strong>4B_tenant</strong>).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label:'Total Flats', value:stats.total,    color:'var(--indigo)', onClick: () => setFilter('all') },
            { label:'Info Pending',value:stats.unknown,  color:'var(--rose)',   onClick: () => setFilter('unknown') },
            { label:'Occupied',    value:stats.occupied, color:'var(--emerald)',onClick: () => setFilter('occupied') },
            { label:'Vacant',      value:stats.vacant,   color:'var(--ink-3)',  onClick: () => setFilter('vacant') },
          ].map(s => (
            <div key={s.label} onClick={s.onClick}
              className="card p-3 cursor-pointer hover:scale-105 transition-transform">
              <div className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color:'var(--ink-3)' }}>{s.label}</div>
              <div className="text-[28px] font-bold mt-0.5"
                style={{ color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold" style={{ color:'var(--ink-2)' }}>
              Data Completion
            </span>
            <span className="text-[12px] font-bold" style={{ color:'var(--emerald)' }}>
              {flats.length > 0
                ? Math.round(((flats.length - stats.unknown) / flats.length) * 100)
                : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--surface-3)' }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${flats.length > 0
                  ? ((flats.length - stats.unknown) / flats.length) * 100
                  : 0}%`,
                background: 'var(--emerald)'
              }} />
          </div>
          <p className="text-[11px] mt-2" style={{ color:'var(--ink-3)' }}>
            {stats.unknown} flats still need owner/resident information
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color:'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat, name or phone..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 rounded-xl p-1 flex-shrink-0"
            style={{ background:'white', border:'1px solid var(--border)' }}>
            {[
              ['all','All'],['unknown','Pending'],
              ['occupied','Occupied'],['rented','Rented'],['vacant','Vacant'],
            ].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: filter===v ? 'var(--indigo)' : 'transparent',
                  color:      filter===v ? 'white' : 'var(--ink-3)'
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Flat list */}
        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color:'var(--ink-4)' }}>Loading...</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden md:grid text-[10px] font-bold uppercase tracking-wide px-5 py-3"
              style={{
                gridTemplateColumns:'80px 100px 1fr 1fr 140px 44px',
                background:'var(--surface-3)', color:'var(--ink-3)',
                borderBottom:'1px solid var(--border)'
              }}>
              <span>Flat</span><span>Type</span><span>Owner</span>
              <span>Resident / Tenant</span><span>Parking</span><span></span>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight:'calc(100dvh - 420px)' }}>
              {filtered.map(f => {
                const ts        = getTypeStyle(f.ownerType)
                const unknown   = isUnknown(f)
                const justSaved = savedId === f.flatNo
                return (
                  <div key={f.flatNo}
                    className="hover:bg-[var(--surface-2)] transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: justSaved ? '#ecfdf5' : unknown ? '#fffbf0' : undefined
                    }}>

                    {/* Mobile */}
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold font-mono flex-shrink-0"
                        style={{ background:ts.bg, color:ts.color }}>
                        {f.flatNo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold"
                            style={{ color:'var(--ink)' }}>
                            {unknown ? '—' : (f.ownerName || f.residentName)}
                          </span>
                          {unknown && (
                            <span className="badge text-[9px]"
                              style={{ background:'#ffe4e6', color:'#9f1239' }}>
                              Info needed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                          {f.ownerPhone || 'No phone'} · {ts.label}
                        </div>
                      </div>
                      <button onClick={() => openEdit(f)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background:'var(--indigo-lt)', color:'var(--indigo)' }}>
                        {justSaved
                          ? <CheckCircle2 size={16} style={{ color:'var(--emerald)' }} />
                          : <Edit2 size={15} />}
                      </button>
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:grid items-center px-5 py-3"
                      style={{ gridTemplateColumns:'80px 100px 1fr 1fr 140px 44px' }}>
                      <span className="text-[13px] font-bold font-mono"
                        style={{ color:ts.color }}>{f.flatNo}</span>
                      <span>
                        <span className="badge text-[9px]"
                          style={{ background:ts.bg, color:ts.color }}>{ts.label}</span>
                      </span>
                      <div className="min-w-0 pr-3">
                        {unknown
                          ? <span className="badge text-[9px]"
                              style={{ background:'#ffe4e6', color:'#9f1239' }}>
                              Info needed
                            </span>
                          : <>
                            <div className="text-[12px] font-medium truncate"
                              style={{ color:'var(--ink)' }}>{f.ownerName}</div>
                            <div className="text-[10px]"
                              style={{ color: f.ownerEmail ? 'var(--emerald)' : 'var(--rose)' }}>
                              {f.ownerEmail || '⚠ No email'}
                            </div>
                          </>
                        }
                      </div>
                      <div className="min-w-0 pr-3">
                        {f.ownerType === 'RENTED'
                          ? <>
                            <div className="text-[12px] font-medium truncate"
                              style={{ color:'var(--ink)' }}>
                              {f.residentName || '—'}
                            </div>
                            <div className="text-[10px]"
                              style={{ color: f.residentEmail ? 'var(--emerald)' : 'var(--rose)' }}>
                              {f.residentEmail || '⚠ No email'}
                            </div>
                          </>
                          : <span className="text-[11px]" style={{ color:'var(--ink-4)' }}>
                            {f.ownerType === 'VACANT' ? 'Vacant' : 'Same as owner'}
                          </span>
                        }
                      </div>
                      <span className="text-[11px]"
                        style={{ color:'var(--ink-3)' }}>{f.parkingSlot || '—'}</span>
                      <button onClick={() => openEdit(f)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: justSaved ? '#ecfdf5' : 'var(--indigo-lt)',
                          color:      justSaved ? 'var(--emerald)' : 'var(--indigo)'
                        }}>
                        {justSaved ? <CheckCircle2 size={15} /> : <Edit2 size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="py-12 text-center" style={{ color:'var(--ink-4)' }}>
                  <Building2 size={28} className="mx-auto mb-2" strokeWidth={1} />
                  <p className="text-[13px]">No flats found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={`Edit Flat ${editing?.flatNo} — ${editing?.wing} Wing · Floor ${editing?.floor}`}
        width="max-w-lg">
        {editing && (
          <div className="space-y-4">

            {/* Flat type */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
                style={{ color:'var(--ink-2)' }}>Flat Type</label>
              <div className="grid grid-cols-3 gap-2">
                {OWNER_TYPES.map(t => (
                  <button key={t.value}
                    onClick={() => { setForm(f => ({ ...f, ownerType: t.value })); setErrors({}) }}
                    className="py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                    style={form.ownerType === t.value
                      ? { background:'var(--indigo)', color:'white', border:'1px solid var(--indigo)' }
                      : { background:'var(--surface-3)', color:'var(--ink-2)', border:'1px solid var(--border)' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner info */}
            {form.ownerType !== 'VACANT' && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--indigo)' }}>Owner Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name" required error={errors.ownerName}>
                    <input className="input"
                      placeholder="Owner name"
                      value={form.ownerName}
                      onChange={e => {
                        setForm(f => ({ ...f, ownerName: e.target.value }))
                        setErrors(er => ({ ...er, ownerName: undefined }))
                      }} />
                  </Field>
                  <Field label="Phone">
                    <input className="input" placeholder="10-digit mobile" maxLength={10}
                      value={form.ownerPhone}
                      onChange={e => setForm(f => ({
                        ...f, ownerPhone: e.target.value.replace(/\D/g, '')
                      }))} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Email" required error={errors.ownerEmail}>
                      <input className="input" placeholder="owner@email.com" type="email"
                        value={form.ownerEmail}
                        onChange={e => {
                          setForm(f => ({ ...f, ownerEmail: e.target.value }))
                          setErrors(er => ({ ...er, ownerEmail: undefined }))
                        }} />
                    </Field>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ background:'var(--indigo-lt)' }}>
                  <Info size={11} style={{ color:'var(--indigo)', flexShrink:0 }} />
                  <span className="text-[10px]" style={{ color:'var(--indigo)' }}>
                    Login ID: <strong>{editing.flatNo}</strong> · Default password: <strong>{editing.flatNo}@123</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Tenant info */}
            {form.ownerType === 'RENTED' && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--amber)' }}>Tenant Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name" required error={errors.residentName}>
                    <input className="input"
                      placeholder="Tenant name"
                      value={form.residentName}
                      onChange={e => {
                        setForm(f => ({ ...f, residentName: e.target.value }))
                        setErrors(er => ({ ...er, residentName: undefined }))
                      }} />
                  </Field>
                  <Field label="Phone">
                    <input className="input" placeholder="10-digit mobile" maxLength={10}
                      value={form.residentPhone}
                      onChange={e => setForm(f => ({
                        ...f, residentPhone: e.target.value.replace(/\D/g, '')
                      }))} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Email" required error={errors.residentEmail}>
                      <input className="input" placeholder="tenant@email.com" type="email"
                        value={form.residentEmail}
                        onChange={e => {
                          setForm(f => ({ ...f, residentEmail: e.target.value }))
                          setErrors(er => ({ ...er, residentEmail: undefined }))
                        }} />
                    </Field>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                  <Info size={11} style={{ color:'var(--amber)', flexShrink:0 }} />
                  <span className="text-[10px]" style={{ color:'#78350f' }}>
                    Login ID: <strong>{editing.flatNo}_tenant</strong> · Default password: <strong>{editing.flatNo}_tenant@123</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Vacant */}
            {form.ownerType === 'VACANT' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background:'#f0f9ff', border:'1px solid #bae6fd' }}>
                <Info size={13} style={{ color:'var(--sky)' }} />
                <span className="text-[12px]" style={{ color:'#0369a1' }}>
                  Vacant flats do not get a login account until owner details are added.
                </span>
              </div>
            )}

            {/* Parking */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                style={{ color:'var(--ink-2)' }}>
                Parking Slot <span style={{ color:'var(--ink-4)', fontWeight:400 }}>(optional)</span>
              </label>
              <input className="input" placeholder="e.g. P12"
                value={form.parkingSlot}
                onChange={e => setForm(f => ({ ...f, parkingSlot: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 justify-center">
                <CheckCircle2 size={14} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}