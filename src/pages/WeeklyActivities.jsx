import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, CalendarDays, Clock, MapPin,
  Users, CheckCircle2, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Asia/Kolkata',
  })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

function isUpcoming(dateStr) {
  if (!dateStr) return false
  const actDate = new Date(dateStr)
  const today   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  today.setHours(0, 0, 0, 0)
  return actDate >= today
}

// ── RSVP List ─────────────────────────────────────────────
function RsvpSection({ activity, user }) {
  const [rsvps,     setRsvps]     = useState([])
  const [expanded,  setExpanded]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [attending, setAttending] = useState(activity.attendingMe || false)
  const [count,     setCount]     = useState(activity.attendeeCount || 0)
  const [toggling,  setToggling]  = useState(false)

  useEffect(() => { if (expanded) loadRsvps() }, [expanded])

  const loadRsvps = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/weekly-activities/${activity.id}/rsvp`)
      setRsvps(res.data)
    } catch { setRsvps([]) }
    finally { setLoading(false) }
  }

  const handleToggle = async () => {
    setToggling(true)
    try {
      const res = await api.post(`/api/weekly-activities/${activity.id}/rsvp`, {
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setAttending(res.data.attending)
      setCount(res.data.count)
      if (expanded) await loadRsvps()
    } catch { alert('Failed to update RSVP') }
    finally { setToggling(false) }
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* RSVP toggle button */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
          style={{
            background: attending ? '#ecfdf5' : 'var(--surface-3)',
            color:      attending ? '#059669' : 'var(--ink-3)',
            border:     `1px solid ${attending ? '#a7f3d0' : 'var(--border)'}`,
          }}>
          <CheckCircle2 size={12} fill={attending ? '#059669' : 'none'} style={{ color: attending ? '#059669' : 'var(--ink-4)' }} />
          {attending ? "I'm Attending" : 'Mark Attending'}
        </button>

        {/* Attendee count toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-[11px] font-semibold"
          style={{ color: 'var(--ink-3)' }}>
          <Users size={12} />
          {count} attending
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3">
          {loading ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>Loading...</div>
          ) : rsvps.length === 0 ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>No one has marked attending yet</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {rsvps.map(r => (
                <div key={r.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                  style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669' }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: '#059669' }}>
                    {r.userName?.charAt(0)?.toUpperCase()}
                  </div>
                  {r.userName}
                  {r.flatNo && <span className="text-[9px] opacity-70">· {r.flatNo}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Activity Card ─────────────────────────────────────────
function ActivityCard({ activity, user, onDelete }) {
  const isAdmin    = user?.role === 'admin'
  const upcoming   = isUpcoming(activity.date)

  return (
    <div className="card overflow-hidden"
      style={{ opacity: upcoming ? 1 : 0.7 }}>
      {/* Top color strip */}
      <div className="h-1.5" style={{ background: upcoming ? 'var(--indigo)' : 'var(--ink-4)' }} />

      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: upcoming ? 'var(--indigo-lt)' : 'var(--surface-3)',
              color:      upcoming ? 'var(--indigo)'    : 'var(--ink-4)',
            }}>
            {upcoming ? '📅 Upcoming' : '✓ Past'}
          </span>
          {isAdmin && (
            <button onClick={() => onDelete(activity)}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--rose)', background: '#fff1f2' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{activity.title}</h3>
        {activity.description && (
          <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'var(--ink-2)' }}>{activity.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CalendarDays size={12} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              {formatDate(activity.date)}
            </span>
          </div>
          {activity.time && (
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>
                {formatTime(activity.time)}
              </span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin size={12} style={{ color: 'var(--indigo)', flexShrink: 0 }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{activity.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* RSVP only for upcoming activities */}
      {upcoming && <RsvpSection activity={activity} user={user} />}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function WeeklyActivities() {
  const { user }  = useAuth()
  const isAdmin   = user?.role === 'admin'

  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [tab,        setTab]        = useState('upcoming')
  const [errors,     setErrors]     = useState({})
  const [form,       setForm]       = useState({
    title: '', description: '', date: '', time: '', location: '',
  })

  useEffect(() => { fetchActivities() }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/weekly-activities?flatNo=${user?.flatNo || ''}`)
      setActivities(res.data)
    } catch { console.error('Failed to load activities') }
    finally { setLoading(false) }
  }

  const upcomingList = activities.filter(a => isUpcoming(a.date))
  const pastList     = activities.filter(a => !isUpcoming(a.date))
  const displayed    = tab === 'upcoming' ? upcomingList : pastList

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.date)         e.date  = 'Date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/weekly-activities', form)
      setForm({ title: '', description: '', date: '', time: '', location: '' })
      setShowAdd(false)
      await fetchActivities()
    } catch { alert('Failed to create activity') }
    finally { setSaving(false) }
  }

  const handleDelete = async (activity) => {
    if (!confirm(`Delete "${activity.title}"?`)) return
    try {
      await api.delete(`/api/weekly-activities/${activity.id}`)
      await fetchActivities()
    } catch { alert('Failed to delete') }
  }

  // Today's date for min date in input
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Weekly Activities" subtitle="Party Hall Events"
        actions={
          isAdmin && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <PlusCircle size={14} />
              <span className="hidden sm:inline"> Add Activity</span>
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Upcoming / Past tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
          {[
            { key: 'upcoming', label: `Upcoming (${upcomingList.length})` },
            { key: 'past',     label: `Past (${pastList.length})` },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: tab === t.key ? 'white' : 'transparent',
                color:      tab === t.key ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow:  tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>
              {tab === 'upcoming' ? 'No upcoming activities' : 'No past activities'}
            </p>
            {tab === 'upcoming' && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
                {isAdmin ? 'Add an activity to get started!' : 'Check back soon for upcoming events.'}
              </p>
            )}
            {tab === 'upcoming' && isAdmin && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
                <PlusCircle size={14} /> Add First Activity
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(activity => (
              <ActivityCard key={activity.id} activity={activity} user={user} onDelete={handleDelete} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Add Modal — admin only */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Add Activity" width="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Title <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Diwali Celebration Night"
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }} />
            {errors.title && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Description (optional)
            </label>
            <textarea className="input resize-none h-16"
              placeholder="Details about the event..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
                Date <span style={{ color: 'var(--rose)' }}>*</span>
              </label>
              <input type="date" className="input" min={todayStr}
                value={form.date}
                onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: undefined })) }} />
              {errors.date && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.date}</p>}
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
                Time (optional)
              </label>
              <input type="time" className="input"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Location (optional)
            </label>
            <input className="input" placeholder="e.g. Party Hall, Terrace..."
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving...' : 'Add Activity'}
            </button>
            <button onClick={() => { setShowAdd(false); setErrors({}) }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}