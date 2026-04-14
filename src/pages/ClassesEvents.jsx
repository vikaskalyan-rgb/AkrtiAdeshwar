import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, GraduationCap, Clapperboard, Trophy,
  Music, Palette, Dumbbell, Calculator, Languages,
  HelpCircle, Trash2, Phone, Clock, CalendarDays,
  MapPin, Search, MessageCircle
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'TUITION',     label: 'Tuition',      icon: Calculator,   color: '#0284c7', bg: '#f0f9ff' },
  { value: 'COMPETITION', label: 'Competition',  icon: Trophy,       color: '#d97706', bg: '#fffbeb' },
  { value: 'MOVIE',       label: 'Movie Night',  icon: Clapperboard, color: '#7c3aed', bg: '#f3f0ff' },
  { value: 'MUSIC',       label: 'Music/Dance',  icon: Music,        color: '#db2777', bg: '#fdf2f8' },
  { value: 'ART',         label: 'Art/Craft',    icon: Palette,      color: '#ea580c', bg: '#fff7ed' },
  { value: 'FITNESS',     label: 'Fitness',      icon: Dumbbell,     color: '#16a34a', bg: '#f0fdf4' },
  { value: 'LANGUAGE',    label: 'Language',     icon: Languages,    color: '#059669', bg: '#ecfdf5' },
  { value: 'CLASS',       label: 'Class/Course', icon: GraduationCap,color: '#5b52f0', bg: '#eeeeff' },
  { value: 'OTHER',       label: 'Other',        icon: HelpCircle,   color: '#8888aa', bg: '#f7f7fb' },
]

const getCat = v => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatEventDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Asia/Kolkata',
  })
}

function formatTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

// ── Event Card ────────────────────────────────────────────
function EventCard({ event, user, onDelete, onContact }) {
  const cat     = getCat(event.category)
  const Icon    = cat.icon
  const isAdmin = user?.role === 'admin'
  const isOwner = event.flatNo === user?.flatNo

  return (
    <div className="card overflow-hidden">
      {/* Category color strip */}
      <div className="h-1" style={{ background: cat.color }} />

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cat.bg, color: cat.color }}>
            <Icon size={10} /> {cat.label}
          </span>
          {(isAdmin || isOwner) && (
            <button onClick={() => onDelete(event)}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--rose)', background: '#fff1f2' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <h3 className="text-[14px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{event.title}</h3>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--ink-2)' }}>{event.description}</p>

        {/* Details row */}
        <div className="space-y-1.5 mb-3">
          {(event.eventDate || event.eventTime) && (
            <div className="flex items-center gap-2">
              <CalendarDays size={12} style={{ color: cat.color, flexShrink: 0 }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
                {formatEventDate(event.eventDate)}
                {event.eventTime && ` · ${formatTime(event.eventTime)}`}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={12} style={{ color: cat.color, flexShrink: 0 }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{event.location}</span>
            </div>
          )}
        </div>

        {/* Posted by + Contact */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: cat.color }}>
            {event.userName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>{event.userName}</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
              {event.flatNo ? `Flat ${event.flatNo}` : 'Admin'}
              {event.createdAt && <span> · {timeAgo(event.createdAt)}</span>}
            </div>
          </div>
          {!isOwner && (
            <button
              onClick={() => onContact(event)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all hover:scale-105"
              style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}>
              <MessageCircle size={12} /> Contact
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contact Modal ─────────────────────────────────────────
function ContactModal({ event, open, onClose }) {
  if (!event) return null
  const cat = getCat(event.category)
  return (
    <Modal open={open} onClose={onClose} title={`Contact — ${event.userName}`}>
      <div className="space-y-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>Posted by</div>
          <div className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{event.userName}</div>
          {event.flatNo && (
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Flat {event.flatNo}</div>
          )}
          {event.contactPhone && (
            <div className="flex items-center gap-1.5 mt-1">
              <Phone size={12} style={{ color: 'var(--ink-4)' }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{event.contactPhone}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl p-3" style={{ background: cat.bg, border: `1px solid ${cat.color}30` }}>
          <p className="text-[11px] font-semibold" style={{ color: cat.color }}>{event.title}</p>
          {event.eventDate && (
            <p className="text-[11px] mt-0.5" style={{ color: cat.color }}>
              {formatEventDate(event.eventDate)}{event.eventTime && ` · ${formatTime(event.eventTime)}`}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {event.contactPhone ? (
            <>
              <button onClick={() => window.open(`tel:${event.contactPhone}`)} className="btn-ghost flex-1 justify-center">
                <Phone size={13} /> Call
              </button>
              <button
                onClick={() => window.open(`https://wa.me/91${event.contactPhone}`)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: '#25d366', color: 'white' }}>
                WhatsApp
              </button>
            </>
          ) : (
            <p className="text-[12px] text-center w-full" style={{ color: 'var(--ink-3)' }}>
              Visit Flat {event.flatNo} directly to inquire.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function ClassesEvents() {
  const { user }  = useAuth()
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [contact, setContact] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})
  const [form,    setForm]    = useState({
    title: '', description: '', category: 'TUITION',
    eventDate: '', eventTime: '', location: '', contactPhone: '',
  })

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/classes-events')
      setEvents(res.data)
    } catch { console.error('Failed to load events') }
    finally { setLoading(false) }
  }

  const filtered = events.filter(e => {
    const matchSearch = search === '' ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.userName?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || e.category === filter
    return matchSearch && matchFilter
  })

  const catCounts = CATEGORIES.map(c => ({
    ...c, count: events.filter(e => e.category === c.value).length,
  })).filter(c => c.count > 0)

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/classes-events', {
        ...form,
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setForm({ title: '', description: '', category: 'TUITION', eventDate: '', eventTime: '', location: '', contactPhone: '' })
      setShowAdd(false)
      await fetchEvents()
    } catch { alert('Failed to post event') }
    finally { setSaving(false) }
  }

  const handleDelete = async (event) => {
    if (!confirm(`Delete "${event.title}"?`)) return
    try {
      await api.delete(`/api/classes-events/${event.id}`)
      await fetchEvents()
    } catch { alert('Failed to delete') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Classes & Events" subtitle="Tuition · Classes · Competitions"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Post</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
          <input className="input pl-9 w-full"
            placeholder="Search classes, events..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category filter */}
        {catCounts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setFilter('ALL')}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
              style={{
                background: filter === 'ALL' ? 'var(--indigo)' : 'white',
                color:      filter === 'ALL' ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${filter === 'ALL' ? 'var(--indigo)' : 'var(--border)'}`,
              }}>
              All ({events.length})
            </button>
            {catCounts.map(c => {
              const Icon = c.icon
              return (
                <button key={c.value}
                  onClick={() => setFilter(v => v === c.value ? 'ALL' : c.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
                  style={{
                    background: filter === c.value ? c.color : 'white',
                    color:      filter === c.value ? 'white' : 'var(--ink-2)',
                    border:     `1px solid ${filter === c.value ? c.color : 'var(--border)'}`,
                  }}>
                  <Icon size={11} />
                  {c.label} ({c.count})
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <GraduationCap size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>
              {events.length === 0 ? 'No classes or events yet' : 'No results found'}
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
              {events.length === 0 ? 'Post your tuition, classes, or upcoming events for the community!' : 'Try a different search'}
            </p>
            {events.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
                <PlusCircle size={14} /> Post First Event
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(event => (
              <EventCard key={event.id} event={event} user={user}
                onDelete={handleDelete}
                onContact={e => setContact(e)} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Contact Modal */}
      <ContactModal event={contact} open={!!contact} onClose={() => setContact(null)} />

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Post a Class or Event" width="max-w-lg">
        <div className="space-y-4">

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--ink-2)' }}>Category</label>
            <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
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

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Title <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Maths tuition for Std 6-8, Bharatanatyam class..."
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }} />
            {errors.title && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Description <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea className="input resize-none h-20"
              placeholder="Timings, fees, age group, who to contact..."
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: undefined })) }} />
            {errors.description && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Date (optional)</label>
              <input type="date" className="input"
                value={form.eventDate}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Time (optional)</label>
              <input type="time" className="input"
                value={form.eventTime}
                onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Location (optional)</label>
              <input className="input" placeholder="e.g. Flat 3A, Party Hall..."
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Contact Phone (optional)</label>
              <input className="input" placeholder="10-digit mobile"
                value={form.contactPhone}
                onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Posting...' : 'Post Event'}
            </button>
            <button onClick={() => { setShowAdd(false); setErrors({}) }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}