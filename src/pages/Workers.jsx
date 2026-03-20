import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, Phone, Mail, MapPin, Edit2,
  Shield, Wrench, UserCheck, Zap, Droplets, Users, Search
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'SECURITY',    label: 'Security Guard', icon: Shield,    color: '#0284c7', bg: '#f0f9ff' },
  { value: 'SUPERVISOR',  label: 'Supervisor',     icon: UserCheck,  color: '#5b52f0', bg: '#eeeeff' },
  { value: 'MAID',        label: 'Maid / Cleaning',icon: Users,      color: '#059669', bg: '#ecfdf5' },
  { value: 'ELECTRICIAN', label: 'Electrician',    icon: Zap,        color: '#d97706', bg: '#fffbeb' },
  { value: 'PLUMBER',     label: 'Plumber',        icon: Droplets,   color: '#7c3aed', bg: '#f3f0ff' },
  { value: 'OTHER',       label: 'Other',          icon: Wrench,     color: '#8888aa', bg: '#f7f7fb' },
]

const SHIFTS = [
  { value: 'DAY',   label: 'Day Shift   (6AM – 6PM)' },
  { value: 'NIGHT', label: 'Night Shift (6PM – 6AM)' },
  { value: 'BOTH',  label: 'Both Shifts' },
]

const ID_PROOFS = ['Aadhaar Card', 'Voter ID', 'Driving License', 'Passport', 'PAN Card']

const EMPTY_FORM = {
  name: '', role: 'SECURITY', phone: '', email: '',
  address: '', shift: 'DAY', idProofType: '',
  idProofNumber: '', joiningDate: '', monthlySalary: '', notes: '',
}

// Outside component to prevent re-mount
const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
      {label}{required && <span style={{ color: 'var(--rose)' }}> *</span>}
    </label>
    {children}
  </div>
)

function getRoleInfo(roleValue) {
  return ROLES.find(r => r.value === roleValue) || ROLES[5]
}

export default function Workers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [workers,  setWorkers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [editing,  setEditing]  = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  useEffect(() => { fetchWorkers() }, [])

  const fetchWorkers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/workers')
      setWorkers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = workers.filter(w => {
    const matchSearch = search === '' ||
      w.name?.toLowerCase().includes(search.toLowerCase()) ||
      w.phone?.includes(search) ||
      w.role?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || w.role === filter
    return matchSearch && matchFilter
  })

  // Group by role for display
  const grouped = ROLES.map(r => ({
    ...r,
    workers: filtered.filter(w => w.role === r.value)
  })).filter(g => g.workers.length > 0)

  const openAdd = () => {
    setErrors({})
    setForm(EMPTY_FORM)
    setShowAdd(true)
  }

  const openEdit = (worker) => {
    setErrors({})
    setForm({
      name:          worker.name || '',
      role:          worker.role || 'SECURITY',
      phone:         worker.phone || '',
      email:         worker.email || '',
      address:       worker.address || '',
      shift:         worker.shift || 'DAY',
      idProofType:   worker.idProofType || '',
      idProofNumber: worker.idProofNumber || '',
      joiningDate:   worker.joiningDate || '',
      monthlySalary: worker.monthlySalary || '',
      notes:         worker.notes || '',
    })
    setEditing(worker)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone?.trim()) e.phone = 'Phone is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        monthlySalary: form.monthlySalary ? parseInt(form.monthlySalary) : null,
        shift: form.role === 'SECURITY' ? form.shift : null,
      }
      if (editing) {
        await api.put(`/api/workers/${editing.id}`, payload)
      } else {
        await api.post('/api/workers', payload)
      }
      await fetchWorkers()
      setEditing(null)
      setShowAdd(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Remove ${name} from the workers list?`)) return
    try {
      await api.delete(`/api/workers/${id}`)
      await fetchWorkers()
      setEditing(null)
    } catch {
      alert('Failed to remove worker')
    }
  }

  const WorkerForm = () => (
    <div className="space-y-4">

      {/* Role */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
          style={{ color: 'var(--ink-2)' }}>Role / Designation</label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button key={r.value}
              onClick={() => setForm(f => ({ ...f, role: r.value }))}
              className="py-2 rounded-xl text-[11px] font-semibold transition-all"
              style={form.role === r.value
                ? { background: r.color, color: 'white', border: `1px solid ${r.color}` }
                : { background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>
              {r.label.split('/')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Full Name" required>
            <input className="input" placeholder="e.g. Rajesh Kumar"
              value={form.name}
              onChange={e => {
                setForm(f => ({ ...f, name: e.target.value }))
                setErrors(er => ({ ...er, name: undefined }))
              }} />
            {errors.name && <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.name}</p>}
          </Field>
        </div>
        <Field label="Phone Number" required>
          <input className="input" placeholder="10-digit mobile" maxLength={10}
            value={form.phone}
            onChange={e => {
              setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))
              setErrors(er => ({ ...er, phone: undefined }))
            }} />
          {errors.phone && <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.phone}</p>}
        </Field>
        <Field label="Email (optional)">
          <input className="input" placeholder="email@example.com" type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </Field>
      </div>

      {/* Shift — only for Security */}
      {form.role === 'SECURITY' && (
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
            style={{ color: 'var(--ink-2)' }}>Shift Timing</label>
          <div className="grid grid-cols-3 gap-2">
            {SHIFTS.map(s => (
              <button key={s.value}
                onClick={() => setForm(f => ({ ...f, shift: s.value }))}
                className="py-2 rounded-xl text-[11px] font-semibold transition-all"
                style={form.shift === s.value
                  ? { background: '#0284c7', color: 'white', border: '1px solid #0284c7' }
                  : { background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>
                {s.value === 'DAY' ? '☀ Day' : s.value === 'NIGHT' ? '🌙 Night' : '↕ Both'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Address */}
      <Field label="Home Address (optional)">
        <textarea className="input resize-none h-16"
          placeholder="Street, Area, City..."
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
      </Field>

      {/* ID Proof + Joining + Salary */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="ID Proof Type">
          <select className="select w-full"
            value={form.idProofType}
            onChange={e => setForm(f => ({ ...f, idProofType: e.target.value }))}>
            <option value="">Select...</option>
            {ID_PROOFS.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="ID Proof Number">
          <input className="input" placeholder="XXXX XXXX XXXX"
            value={form.idProofNumber}
            onChange={e => setForm(f => ({ ...f, idProofNumber: e.target.value }))} />
        </Field>
        <Field label="Joining Date">
          <input className="input" type="date"
            value={form.joiningDate}
            onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} />
        </Field>
        <Field label="Monthly Salary (₹)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]"
              style={{ color: 'var(--ink-3)' }}>₹</span>
            <input className="input pl-7" placeholder="0" type="number"
              value={form.monthlySalary}
              onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} />
          </div>
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes (optional)">
        <textarea className="input resize-none h-16"
          placeholder="Any additional information..."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </Field>

      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex-1 justify-center">
          {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Worker'}
        </button>
        {editing && (
          <button
            onClick={() => handleDeactivate(editing.id, editing.name)}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: 'var(--rose-lt)', color: 'var(--rose)', border: '1px solid #fca5a5' }}>
            Remove
          </button>
        )}
        <button onClick={() => { setEditing(null); setShowAdd(false) }}
          className="btn-ghost">Cancel</button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Workers" subtitle="Society staff and service personnel"
        actions={isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <PlusCircle size={14} /><span className="hidden sm:inline"> Add Worker</span>
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ROLES.map(r => {
            const count = workers.filter(w => w.role === r.value).length
            const Icon  = r.icon
            return (
              <button key={r.value}
                onClick={() => setFilter(f => f === r.value ? 'ALL' : r.value)}
                className="card p-3 flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                style={{ outline: filter === r.value ? `2px solid ${r.color}` : 'none' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: r.bg }}>
                  <Icon size={15} style={{ color: r.color }} />
                </div>
                <div className="text-[18px] font-bold" style={{ color: r.color }}>{count}</div>
                <div className="text-[9px] font-semibold text-center leading-tight"
                  style={{ color: 'var(--ink-3)' }}>
                  {r.label.split('/')[0].trim()}
                </div>
              </button>
            )
          })}
        </div>

        {/* Search + filter reset */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search by name, phone or role..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="btn-ghost text-[11px]">
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : workers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              No workers added yet
            </p>
            {isAdmin && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
                Click "Add Worker" to add security guards, maids and other staff
              </p>
            )}
          </div>
        ) : grouped.length === 0 ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>No workers match your search</div>
        ) : (
          grouped.map(group => {
            const Icon = group.icon
            return (
              <div key={group.value} className="card overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-2.5 px-4 py-3"
                  style={{ background: group.bg, borderBottom: '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: group.color }}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <span className="badge text-[10px]"
                    style={{ background: group.color + '22', color: group.color }}>
                    {group.workers.length}
                  </span>
                </div>

                {/* Workers in this group */}
                {group.workers.map(w => (
                  <div key={w.id}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                      style={{ background: group.color }}>
                      {w.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                          {w.name}
                        </span>
                        {w.shift && (
                          <span className="badge text-[9px]"
                            style={{ background: '#f0f9ff', color: '#0284c7' }}>
                            {w.shift === 'DAY' ? '☀ Day' : w.shift === 'NIGHT' ? '🌙 Night' : '↕ Both'}
                          </span>
                        )}
                        {w.joiningDate && (
                          <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>
                            Since {new Date(w.joiningDate).toLocaleDateString('en-IN',
                              { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {w.phone && (
                          <a href={`tel:${w.phone}`}
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: 'var(--indigo)' }}>
                            <Phone size={11} /> {w.phone}
                          </a>
                        )}
                        {w.email && (
                          <span className="flex items-center gap-1 text-[11px]"
                            style={{ color: 'var(--ink-3)' }}>
                            <Mail size={11} /> {w.email}
                          </span>
                        )}
                        {w.address && (
                          <span className="flex items-center gap-1 text-[11px]"
                            style={{ color: 'var(--ink-3)' }}>
                            <MapPin size={11} /> {w.address}
                          </span>
                        )}
                      </div>

                      {w.notes && (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--ink-4)' }}>
                          {w.notes}
                        </p>
                      )}
                    </div>

                    {/* Edit button — admin only */}
                    {isAdmin && (
                      <button onClick={() => openEdit(w)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}
        title="Add New Worker" width="max-w-lg">
        <WorkerForm />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}
        title={`Edit — ${editing?.name}`} width="max-w-lg">
        <WorkerForm />
      </Modal>
    </div>
  )
}