import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { PlusCircle, Search, CheckCircle2, PackageSearch, MapPin } from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const TYPES = [
  { value: 'LOST',  label: 'I Lost Something',  emoji: '😢', color: '#e11d48', bg: '#fff1f2', border: '#fca5a5' },
  { value: 'FOUND', label: 'I Found Something',  emoji: '🎉', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
]

const EMPTY_FORM = {
  type: 'LOST', title: '', description: '', location: '',
}

const Field = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
      {label}{required && <span style={{ color: 'var(--rose)' }}> *</span>}
    </label>
    {children}
  </div>
)

const ItemForm = ({ form, setForm, errors, saving, onSave, onCancel }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {TYPES.map(t => (
        <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
          style={form.type === t.value
            ? { background: t.bg, border: `2px solid ${t.color}` }
            : { background: 'var(--surface-3)', border: '2px solid var(--border)' }}>
          <span className="text-[28px]">{t.emoji}</span>
          <span className="text-[12px] font-bold"
            style={{ color: form.type === t.value ? t.color : 'var(--ink-2)' }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>

    <Field label="What is it?" required>
      <input className="input" placeholder='e.g. "Blue umbrella", "House keys", "Gold earring"'
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      {errors?.title && <p className="text-[10px] mt-1" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
    </Field>

    <Field label="Description (optional)">
      <textarea className="input resize-none h-16"
        placeholder="Color, brand, any identifying features..."
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
    </Field>

    <Field label="Location (optional)">
      <input className="input" placeholder='e.g. "Near lift on Floor 2", "Parking area"'
        value={form.location}
        onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
    </Field>

    <div className="flex gap-2">
      <button onClick={onSave} disabled={saving} className="btn-primary flex-1 justify-center">
        {saving ? 'Posting...' : 'Post'}
      </button>
      <button onClick={onCancel} className="btn-ghost">Cancel</button>
    </div>
  </div>
)

export default function LostFound() {
  const { user }  = useAuth()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL') // ALL, LOST, FOUND, OPEN, RETURNED
  const [showAdd, setShowAdd] = useState(false)
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/lost-found')
      setItems(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = items.filter(i => {
    const matchSearch = search === '' ||
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.location?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'OPEN'     && i.status === 'OPEN') ||
      (filter === 'RETURNED' && i.status === 'RETURNED') ||
      i.type === filter
    return matchSearch && matchFilter
  })

  const openCount     = items.filter(i => i.status === 'OPEN').length
  const lostCount     = items.filter(i => i.type === 'LOST' && i.status === 'OPEN').length
  const foundCount    = items.filter(i => i.type === 'FOUND' && i.status === 'OPEN').length

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Please describe what was lost/found'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/lost-found', {
        ...form,
        flatNo:   user?.flatNo,
        postedBy: user?.name || user?.identifier,
      })
      await fetchItems()
      setShowAdd(false)
      setForm(EMPTY_FORM)
    } catch { alert('Failed to post') }
    finally { setSaving(false) }
  }

  const handleResolve = async (id) => {
    if (!confirm('Mark this as returned/resolved?')) return
    try {
      await api.patch(`/api/lost-found/${id}/resolve`)
      await fetchItems()
    } catch { alert('Failed to update') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this post?')) return
    try {
      await api.delete(`/api/lost-found/${id}`)
      await fetchItems()
    } catch { alert('Failed to remove') }
  }

  const canManage = (item) =>
    user?.role === 'admin' || item.flatNo === user?.flatNo

  const formatDate = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Lost & Found" subtitle="Report lost items or found belongings"
        actions={
          <button onClick={() => { setForm(EMPTY_FORM); setErrors({}); setShowAdd(true) }}
            className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Post</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Open',  value: openCount,  color: 'var(--indigo)', bg: 'var(--indigo-lt)' },
            { label: 'Lost',  value: lostCount,  color: '#e11d48', bg: '#fff1f2' },
            { label: 'Found', value: foundCount, color: '#059669', bg: '#ecfdf5' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <div className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                style={{ color: 'var(--ink-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9 w-full" placeholder="Search items..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { v: 'ALL',      l: 'All' },
              { v: 'OPEN',     l: '🔍 Open' },
              { v: 'LOST',     l: '😢 Lost' },
              { v: 'FOUND',    l: '🎉 Found' },
              { v: 'RETURNED', l: '✅ Resolved' },
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
            <PackageSearch size={36} className="mx-auto mb-3"
              style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--ink-2)' }}>
              {search ? 'No items match your search' : 'Nothing lost or found yet!'}
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
              Post here if you lost something or found an item in the building
            </p>
          </div>

        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const t      = TYPES.find(t => t.value === item.type) || TYPES[0]
              const isOpen = item.status === 'OPEN'
              return (
                <div key={item.id} className="card p-4"
                  style={{
                    border: `1.5px solid ${isOpen ? t.border : 'var(--border)'}`,
                    opacity: isOpen ? 1 : 0.7,
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] flex-shrink-0"
                      style={{ background: t.bg }}>
                      {t.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
                          {item.title}
                        </span>
                        <span className="badge text-[9px]"
                          style={{ background: t.bg, color: t.color }}>
                          {item.type}
                        </span>
                        {!isOpen && (
                          <span className="badge text-[9px]"
                            style={{ background: '#ecfdf5', color: '#059669' }}>
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[12px] mt-1" style={{ color: 'var(--ink-2)' }}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                        {item.location && (
                          <span className="flex items-center gap-1 text-[11px]"
                            style={{ color: 'var(--ink-3)' }}>
                            <MapPin size={10} /> {item.location}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                          Flat {item.flatNo} · {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManage(item) && isOpen && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleResolve(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}>
                        <CheckCircle2 size={12} /> Mark Resolved
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                        style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Post Lost / Found Item">
        <ItemForm form={form} setForm={setForm} errors={errors}
          saving={saving} onSave={handleSave} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}