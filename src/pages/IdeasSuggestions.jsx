import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, ThumbsUp, MessageCircle, Trash2, Send,
  Lightbulb, TrendingUp, DollarSign, Leaf, Wrench,
  ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, CircleDot
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'IMPROVEMENT',  label: 'Improvement',  icon: TrendingUp,   color: '#0284c7', bg: '#f0f9ff' },
  { value: 'REVENUE',      label: 'Revenue',      icon: DollarSign,   color: '#059669', bg: '#ecfdf5' },
  { value: 'GREEN',        label: 'Green / Eco',  icon: Leaf,         color: '#16a34a', bg: '#f0fdf4' },
  { value: 'MAINTENANCE',  label: 'Maintenance',  icon: Wrench,       color: '#d97706', bg: '#fffbeb' },
  { value: 'OTHER',        label: 'Other',        icon: Lightbulb,    color: '#7c3aed', bg: '#f3f0ff' },
]

const STATUSES = [
  { value: 'NEW',          label: 'New',          icon: CircleDot,    color: '#0284c7', bg: '#f0f9ff' },
  { value: 'UNDER_REVIEW', label: 'Under Review', icon: Clock,        color: '#d97706', bg: '#fffbeb' },
  { value: 'ACCEPTED',     label: 'Accepted',     icon: CheckCircle2, color: '#059669', bg: '#ecfdf5' },
  { value: 'REJECTED',     label: 'Rejected',     icon: XCircle,      color: '#e11d48', bg: '#fff1f2' },
]

const getCat    = v => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]
const getStatus = v => STATUSES.find(s => s.value === v)   || STATUSES[0]

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

// ── Comments ──────────────────────────────────────────────
function CommentsSection({ idea, user }) {
  const [comments,   setComments]   = useState([])
  const [expanded,   setExpanded]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [text,       setText]       = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isAdmin = user?.role === 'admin'

  useEffect(() => { if (expanded) loadComments() }, [expanded])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/ideas/${idea.id}/comments`)
      setComments(res.data)
    } catch { setComments([]) }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/api/ideas/${idea.id}/comments`, {
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
        content:  text.trim(),
      })
      setText('')
      setShowForm(false)
      await loadComments()
    } catch { alert('Failed to post comment') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete comment?')) return
    try {
      await api.delete(`/api/ideas/comments/${id}`)
      await loadComments()
    } catch { alert('Failed to delete') }
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors">
        <div className="flex items-center gap-2">
          <MessageCircle size={13} style={{ color: 'var(--ink-3)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>
            {idea.commentCount > 0 ? `${idea.commentCount} comment${idea.commentCount > 1 ? 's' : ''}` : 'Add a comment'}
          </span>
        </div>
        {expanded ? <ChevronUp size={13} style={{ color: 'var(--ink-4)' }} /> : <ChevronDown size={13} style={{ color: 'var(--ink-4)' }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {showForm ? (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <textarea
                className="input resize-none h-14 w-full text-[12px]"
                placeholder="Share your thoughts on this idea..."
                value={text}
                onChange={e => setText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={submitting || !text.trim()} className="btn-primary flex-1 justify-center text-[12px] py-2">
                  <Send size={12} /> {submitting ? 'Posting...' : 'Post'}
                </button>
                <button onClick={() => { setShowForm(false); setText('') }} className="btn-ghost text-[12px] py-2">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center gap-2 py-2 rounded-xl text-[11px] font-semibold justify-center"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)', border: '1px solid var(--indigo-md)' }}>
              <MessageCircle size={12} /> Write a Comment
            </button>
          )}

          {loading ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>No comments yet</div>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>{c.userName}</span>
                        {c.flatNo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)' }}>
                            Flat {c.flatNo}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--ink-2)' }}>{c.content}</p>
                    </div>
                    {(isAdmin || c.flatNo === user?.flatNo) && (
                      <button onClick={() => handleDelete(c.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ color: 'var(--rose)', background: '#fff1f2' }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Idea Card ─────────────────────────────────────────────
function IdeaCard({ idea, user, onUpvote, onDelete, onStatusChange }) {
  const cat     = getCat(idea.category)
  const status  = getStatus(idea.status)
  const StatusIcon = status.icon
  const CatIcon = cat.icon
  const isAdmin = user?.role === 'admin'
  const isOwner = idea.flatNo === user?.flatNo

  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: cat.bg, color: cat.color }}>
              <CatIcon size={10} /> {cat.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}>
              <StatusIcon size={10} /> {status.label}
            </span>
          </div>
          {(isAdmin || isOwner) && (
            <button onClick={() => onDelete(idea)}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--rose)', background: '#fff1f2' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <h3 className="text-[14px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{idea.title}</h3>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{idea.description}</p>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: cat.color }}>
            {idea.userName?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-2)' }}>{idea.userName}</span>
          {idea.flatNo && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)' }}>
              Flat {idea.flatNo}
            </span>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'var(--ink-4)' }}>{timeAgo(idea.createdAt)}</span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => onUpvote(idea)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
            style={{
              background: idea.upvotedByMe ? 'var(--indigo-lt)' : 'var(--surface-3)',
              color:      idea.upvotedByMe ? 'var(--indigo)' : 'var(--ink-3)',
              border:     `1px solid ${idea.upvotedByMe ? 'var(--indigo-md)' : 'var(--border)'}`,
            }}>
            <ThumbsUp size={11} fill={idea.upvotedByMe ? 'var(--indigo)' : 'none'} />
            {idea.upvotes > 0 ? idea.upvotes : ''} {idea.upvotedByMe ? 'Upvoted' : 'Upvote'}
          </button>

          {/* Admin status changer */}
          {isAdmin && (
            <select
              value={idea.status}
              onChange={e => onStatusChange(idea, e.target.value)}
              className="select text-[11px] py-1.5 flex-shrink-0"
              style={{ height: 'auto', minWidth: '130px' }}>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <CommentsSection idea={idea} user={user} />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function IdeasSuggestions() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'

  const [ideas,   setIdeas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({ title: '', description: '', category: 'IMPROVEMENT' })
  const [errors,  setErrors]  = useState({})

  useEffect(() => { fetchIdeas() }, [])

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/ideas?flatNo=${user?.flatNo || ''}`)
      setIdeas(res.data)
    } catch { console.error('Failed to load ideas') }
    finally { setLoading(false) }
  }

  const filtered = filter === 'ALL' ? ideas : ideas.filter(i => i.category === filter)

  const catCounts = CATEGORIES.map(c => ({
    ...c, count: ideas.filter(i => i.category === c.value).length,
  }))

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
      await api.post('/api/ideas', {
        ...form,
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setForm({ title: '', description: '', category: 'IMPROVEMENT' })
      setShowAdd(false)
      await fetchIdeas()
    } catch { alert('Failed to submit idea') }
    finally { setSaving(false) }
  }

  const handleUpvote = async (idea) => {
    try {
      const res = await api.post(`/api/ideas/${idea.id}/upvote`, {
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setIdeas(prev => prev.map(i =>
        i.id === idea.id ? { ...i, upvotes: res.data.upvotes, upvotedByMe: res.data.upvoted } : i
      ))
    } catch { /* silent */ }
  }

  const handleDelete = async (idea) => {
    if (!confirm(`Delete "${idea.title}"?`)) return
    try {
      await api.delete(`/api/ideas/${idea.id}`)
      await fetchIdeas()
    } catch { alert('Failed to delete') }
  }

  const handleStatusChange = async (idea, newStatus) => {
    try {
      await api.patch(`/api/ideas/${idea.id}/status`, { status: newStatus })
      setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: newStatus } : i))
    } catch { alert('Failed to update status') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Ideas & Suggestions" subtitle="Shape our community"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Submit Idea</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-2">
          {STATUSES.map(s => {
            const Icon = s.icon
            const count = ideas.filter(i => i.status === s.value).length
            return (
              <div key={s.value} className="card p-2.5 text-center">
                <Icon size={14} className="mx-auto mb-1" style={{ color: s.color }} />
                <div className="text-[16px] font-bold" style={{ color: s.color }}>{count}</div>
                <div className="text-[9px] font-semibold" style={{ color: 'var(--ink-4)' }}>{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setFilter('ALL')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
            style={{
              background: filter === 'ALL' ? 'var(--indigo)' : 'white',
              color:      filter === 'ALL' ? 'white' : 'var(--ink-2)',
              border:     `1px solid ${filter === 'ALL' ? 'var(--indigo)' : 'var(--border)'}`,
            }}>
            All ({ideas.length})
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
                {c.label} {c.count > 0 && `(${c.count})`}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Lightbulb size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>No ideas yet</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>Have an idea to improve our apartment? Share it!</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
              <PlusCircle size={14} /> Submit First Idea
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(idea => (
              <IdeaCard key={idea.id} idea={idea} user={user}
                onUpvote={handleUpvote} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Submit an Idea" width="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--ink-2)' }}>Category</label>
            <div className="grid grid-cols-5 gap-1.5">
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
              Idea Title <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Install solar panels on terrace"
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }} />
            {errors.title && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Description <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea className="input resize-none h-24"
              placeholder="Describe your idea in detail. How will it help? Any cost estimate?"
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: undefined })) }} />
            {errors.description && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.description}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Submitting...' : 'Submit Idea'}
            </button>
            <button onClick={() => { setShowAdd(false); setErrors({}) }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}