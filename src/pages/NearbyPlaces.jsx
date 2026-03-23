import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  MapPin, Phone, PlusCircle, Edit2, ExternalLink,
  Cross, Landmark, ShoppingBag, Utensils, Train,
  GraduationCap, Heart, Building2, Fuel, Banknote,
  Dumbbell, TreePine, Baby, Search, Navigation
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

// ── Categories ────────────────────────────────────────────
const CATEGORIES = [
  { value: 'HOSPITAL',    label: 'Hospital',        icon: Cross,       color: '#e11d48', bg: '#fff1f2' },
  { value: 'CLINIC',      label: 'Clinic',          icon: Heart,       color: '#f43f5e', bg: '#fff1f2' },
  { value: 'SCHOOL',      label: 'School',          icon: GraduationCap, color: '#0284c7', bg: '#f0f9ff' },
  { value: 'TEMPLE',      label: 'Temple',          icon: Landmark,    color: '#d97706', bg: '#fffbeb' },
  { value: 'CHURCH',      label: 'Church',          icon: Landmark,    color: '#7c3aed', bg: '#f3f0ff' },
  { value: 'MOSQUE',      label: 'Mosque',          icon: Landmark,    color: '#059669', bg: '#ecfdf5' },
  { value: 'GROCERY',     label: 'Grocery / Mill',  icon: ShoppingBag, color: '#ea580c', bg: '#fff7ed' },
  { value: 'RESTAURANT',  label: 'Restaurant',      icon: Utensils,    color: '#ca8a04', bg: '#fefce8' },
  { value: 'BANK',        label: 'Bank / ATM',      icon: Banknote,    color: '#0891b2', bg: '#ecfeff' },
  { value: 'TRANSPORT',   label: 'Bus / Train',     icon: Train,       color: '#6366f1', bg: '#eef2ff' },
  { value: 'PETROL',      label: 'Petrol Bunk',     icon: Fuel,        color: '#dc2626', bg: '#fef2f2' },
  { value: 'GYM',         label: 'Gym / Park',      icon: Dumbbell,    color: '#16a34a', bg: '#f0fdf4' },
  { value: 'PARK',        label: 'Park / Garden',   icon: TreePine,    color: '#15803d', bg: '#f0fdf4' },
  { value: 'GOVT',        label: 'Govt. Office',    icon: Building2,   color: '#475569', bg: '#f8fafc' },
  { value: 'CHILDCARE',   label: 'Childcare',       icon: Baby,        color: '#db2777', bg: '#fdf2f8' },
  { value: 'OTHER',       label: 'Other',           icon: MapPin,      color: '#8888aa', bg: '#f7f7fb' },
]

const getCat = (value) =>
  CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1]

const EMPTY_FORM = {
  name: '', category: 'HOSPITAL', address: '',
  phone: '', mapsUrl: '', distance: '',
}

// ── Field component — OUTSIDE to prevent re-mount ────────
const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
      {label}{required && <span style={{ color: 'var(--rose)' }}> *</span>}
    </label>
    {children}
    {hint  && <p className="text-[10px] mt-1" style={{ color: 'var(--ink-4)' }}>{hint}</p>}
    {error && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{error}</p>}
  </div>
)

// ── Place Form — OUTSIDE to prevent re-mount ─────────────
const PlaceForm = ({
  form, setForm, errors, setErrors,
  saving, editing, onSave, onDelete, onCancel,
}) => (
  <div className="space-y-4">

    {/* Category picker */}
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wide block mb-2"
        style={{ color: 'var(--ink-2)' }}>Category</label>
      <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <button key={c.value}
              onClick={() => setForm(f => ({ ...f, category: c.value }))}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-semibold transition-all"
              style={form.category === c.value
                ? { background: c.color, color: 'white', border: `1px solid ${c.color}` }
                : { background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>
              <Icon size={14} />
              {c.label.split('/')[0].trim()}
            </button>
          )
        })}
      </div>
    </div>

    {/* Name */}
    <Field label="Place Name" required error={errors.name}>
      <input className="input" placeholder="e.g. Apollo Hospital, Saraswathi School"
        value={form.name}
        onChange={e => {
          setForm(f => ({ ...f, name: e.target.value }))
          setErrors(er => ({ ...er, name: undefined }))
        }} />
    </Field>

    {/* Address */}
    <Field label="Address (optional)">
      <textarea className="input resize-none h-14"
        placeholder="Street, Area..."
        value={form.address}
        onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
    </Field>

    {/* Phone + Distance */}
    <div className="grid grid-cols-2 gap-3">
      <Field label="Phone (optional)">
        <input className="input" placeholder="044-XXXXXXXX" maxLength={15}
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
      </Field>
      <Field label="Distance"
        hint="e.g. 0.5 km, 2 min walk">
        <input className="input" placeholder="e.g. 1.2 km"
          value={form.distance}
          onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
      </Field>
    </div>

    {/* Google Maps URL */}
    <Field label="Google Maps Link" required error={errors.mapsUrl}
      hint='Open Google Maps → Search place → Share → Copy Link'>
      <input className="input" placeholder="https://maps.google.com/..."
        value={form.mapsUrl}
        onChange={e => {
          setForm(f => ({ ...f, mapsUrl: e.target.value }))
          setErrors(er => ({ ...er, mapsUrl: undefined }))
        }} />
    </Field>

    <div className="flex gap-2 pt-1">
      <button onClick={onSave} disabled={saving}
        className="btn-primary flex-1 justify-center">
        {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Place'}
      </button>
      {editing && (
        <button onClick={() => onDelete(editing.id, editing.name)}
          className="px-3 py-2 rounded-xl text-[12px] font-semibold"
          style={{ background: '#fff1f2', color: 'var(--rose)', border: '1px solid #fca5a5' }}>
          Remove
        </button>
      )}
      <button onClick={onCancel} className="btn-ghost">Cancel</button>
    </div>
  </div>
)

// ── Main Component ────────────────────────────────────────
export default function NearbyPlaces() {
  const { user }  = useAuth()
  const isAdmin   = user?.role === 'admin'

  const [places,  setPlaces]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { fetchPlaces() }, [])

  const fetchPlaces = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/places')
      setPlaces(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = places.filter(p => {
    const matchSearch = search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || p.category === filter
    return matchSearch && matchFilter
  })

  // Group by category
  const grouped = CATEGORIES.map(c => ({
    ...c,
    places: filtered.filter(p => p.category === c.value),
  })).filter(g => g.places.length > 0)

  // Category counts for filter pills
  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: places.filter(p => p.category === c.value).length,
  })).filter(c => c.count > 0)

  const openAdd = () => {
    setErrors({})
    setForm(EMPTY_FORM)
    setShowAdd(true)
  }

  const openEdit = (place) => {
    setErrors({})
    setForm({
      name:     place.name     || '',
      category: place.category || 'HOSPITAL',
      address:  place.address  || '',
      phone:    place.phone    || '',
      mapsUrl:  place.mapsUrl  || '',
      distance: place.distance || '',
    })
    setEditing(place)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name   = 'Place name is required'
    if (!form.mapsUrl.trim()) e.mapsUrl = 'Google Maps link is required'
    else if (!form.mapsUrl.startsWith('http'))
      e.mapsUrl = 'Enter a valid URL starting with http'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, addedBy: user?.identifier }
      if (editing) {
        await api.put(`/api/places/${editing.id}`, payload)
      } else {
        await api.post('/api/places', payload)
      }
      await fetchPlaces()
      setShowAdd(false)
      setEditing(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the list?`)) return
    try {
      await api.delete(`/api/places/${id}`)
      await fetchPlaces()
      setEditing(null)
    } catch {
      alert('Failed to remove')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Nearby Places" subtitle="Important locations around Akriti Adeshwar"
        actions={isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Add Place</span>
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ink-4)' }} />
          <input className="input pl-9 w-full"
            placeholder="Search hospitals, schools, temples..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category filter pills */}
        {catCounts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setFilter('ALL')}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === 'ALL' ? 'var(--indigo)' : 'white',
                color:      filter === 'ALL' ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${filter === 'ALL' ? 'var(--indigo)' : 'var(--border)'}`,
              }}>
              All ({places.length})
            </button>
            {catCounts.map(c => {
              const Icon = c.icon
              return (
                <button key={c.value}
                  onClick={() => setFilter(v => v === c.value ? 'ALL' : c.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: filter === c.value ? c.color : 'white',
                    color:      filter === c.value ? 'white' : 'var(--ink-2)',
                    border:     `1px solid ${filter === c.value ? c.color : 'var(--border)'}`,
                  }}>
                  <Icon size={11} />
                  {c.label.split('/')[0].trim()} ({c.count})
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="card p-12 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>Loading...</div>

        ) : places.length === 0 ? (
          <div className="card p-12 text-center">
            <MapPin size={36} className="mx-auto mb-3"
              style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>
              No places added yet
            </p>
            {isAdmin && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
                Click "Add Place" to add nearby hospitals, schools, temples and more
              </p>
            )}
          </div>

        ) : grouped.length === 0 ? (
          <div className="card p-10 text-center text-[13px]"
            style={{ color: 'var(--ink-4)' }}>No places match your search</div>

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
                    {group.places.length}
                  </span>
                </div>

                {/* Places */}
                {group.places.map(p => (
                  <div key={p.id}
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>

                    {/* Color dot */}
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ background: group.color }} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                          {p.name}
                        </span>
                        {p.distance && (
                          <span className="badge text-[9px]"
                            style={{ background: group.bg, color: group.color }}>
                            📍 {p.distance}
                          </span>
                        )}
                      </div>
                      {p.address && (
                        <div className="flex items-center gap-1 mt-1"
                          style={{ color: 'var(--ink-3)' }}>
                          <MapPin size={10} />
                          <span className="text-[11px]">{p.address}</span>
                        </div>
                      )}
                      {p.phone && (
                        <a href={`tel:${p.phone}`}
                          className="flex items-center gap-1 mt-0.5"
                          style={{ color: 'var(--indigo)' }}>
                          <Phone size={10} />
                          <span className="text-[11px]">{p.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Open in Maps */}
                      <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
                        style={{ background: group.color, color: 'white' }}>
                        <Navigation size={12} />
                        <span className="hidden sm:inline">Maps</span>
                      </a>
                      {/* Edit — admin only */}
                      {isAdmin && (
                        <button onClick={() => openEdit(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}

        {/* Tip */}
        {places.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
            <Navigation size={13} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
            <p className="text-[11px]" style={{ color: 'var(--indigo)' }}>
              Tap the <strong>Maps</strong> button to open directions in Google Maps.
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }}
        title="Add Nearby Place" width="max-w-lg">
        <PlaceForm
          form={form} setForm={setForm}
          errors={errors} setErrors={setErrors}
          saving={saving} editing={null}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => { setShowAdd(false); setErrors({}) }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => { setEditing(null); setErrors({}) }}
        title={`Edit — ${editing?.name}`} width="max-w-lg">
        <PlaceForm
          form={form} setForm={setForm}
          errors={errors} setErrors={setErrors}
          saving={saving} editing={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => { setEditing(null); setErrors({}) }}
        />
      </Modal>
    </div>
  )
}