import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, Heart, MessageCircle, Trash2, Send,
  BookOpen, Feather, Quote, Sparkles, AlignLeft, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'POEM',     label: 'Poem',       icon: Feather,    color: '#7c3aed', bg: '#f3f0ff' },
  { value: 'KAVITHAI', label: 'Kavithai',   icon: BookOpen,   color: '#db2777', bg: '#fdf2f8' },
  { value: 'STORY',    label: 'Story',      icon: AlignLeft,  color: '#0284c7', bg: '#f0f9ff' },
  { value: 'QUOTE',    label: 'Quote',      icon: Quote,      color: '#d97706', bg: '#fffbeb' },
  { value: 'OTHER',    label: 'Other',      icon: Sparkles,   color: '#059669', bg: '#ecfdf5' },
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

// ── Comments Section ──────────────────────────────────────
function CommentsSection({ post, user }) {
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
      const res = await api.get(`/api/community-board/${post.id}/comments`)
      setComments(res.data)
    } catch { setComments([]) }
    finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/api/community-board/${post.id}/comments`, {
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
      await api.delete(`/api/community-board/comments/${id}`)
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
            {post.commentCount > 0 ? `${post.commentCount} comment${post.commentCount > 1 ? 's' : ''}` : 'Add a comment'}
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
                placeholder="Write a comment..."
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
              className="w-full flex items-center gap-2 py-2 rounded-xl text-[11px] font-semibold justify-center transition-all"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)', border: '1px solid var(--indigo-md)' }}>
              <MessageCircle size={12} /> Write a Comment
            </button>
          )}

          {loading ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-[12px] py-2" style={{ color: 'var(--ink-4)' }}>No comments yet ✨</div>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
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

// ── Post Card ─────────────────────────────────────────────
function PostCard({ post, user, onLike, onDelete }) {
  const cat    = getCat(post.category)
  const Icon   = cat.icon
  const isAdmin = user?.role === 'admin'
  const isOwner = post.flatNo === user?.flatNo

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: cat.bg }}>
              <Icon size={13} style={{ color: cat.color }} />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: cat.bg, color: cat.color }}>
                {cat.label}
              </span>
            </div>
          </div>
          {(isAdmin || isOwner) && (
            <button onClick={() => onDelete(post)}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--rose)', background: '#fff1f2' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <h3 className="text-[14px] font-bold mb-1" style={{ color: 'var(--ink)' }}>{post.title}</h3>
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-2)' }}>{post.content}</p>

        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: cat.color }}>
            {post.userName?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-2)' }}>{post.userName}</span>
          {post.flatNo && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)' }}>
              Flat {post.flatNo}
            </span>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'var(--ink-4)' }}>{timeAgo(post.createdAt)}</span>
        </div>

        {/* Like */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onLike(post)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105"
            style={{
              background: post.likedByMe ? '#fff1f2' : 'var(--surface-3)',
              color:      post.likedByMe ? '#e11d48' : 'var(--ink-3)',
              border:     `1px solid ${post.likedByMe ? '#fca5a5' : 'var(--border)'}`,
            }}>
            <Heart size={11} fill={post.likedByMe ? '#e11d48' : 'none'} />
            {post.likes > 0 ? post.likes : ''} {post.likedByMe ? 'Liked' : 'Like'}
          </button>
        </div>
      </div>

      <CommentsSection post={post} user={user} />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function CommunityBoard() {
  const { user } = useAuth()
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')
  const [showAdd, setShowAdd] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [showTip, setShowTip] = useState(false)
  const [form,    setForm]    = useState({ title: '', content: '', category: 'POEM' })
  const [errors,  setErrors]  = useState({})

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/community-board?flatNo=${user?.flatNo || ''}`)
      setPosts(res.data)
    } catch { console.error('Failed to load posts') }
    finally { setLoading(false) }
  }

  const filtered = filter === 'ALL' ? posts : posts.filter(p => p.category === filter)

  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: posts.filter(p => p.category === c.value).length,
  }))

  const validate = () => {
    const e = {}
    if (!form.title.trim())   e.title   = 'Title is required'
    if (!form.content.trim()) e.content = 'Content is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/community-board', {
        ...form,
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setForm({ title: '', content: '', category: 'POEM' })
      setShowAdd(false)
      await fetchPosts()
    } catch { alert('Failed to post') }
    finally { setSaving(false) }
  }

  const handleLike = async (post) => {
    try {
      const res = await api.post(`/api/community-board/${post.id}/like`, {
        flatNo:   user?.flatNo || 'SUP',
        userName: user?.name   || 'Admin',
      })
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, likes: res.data.likes, likedByMe: res.data.liked } : p
      ))
    } catch { /* silent */ }
  }

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.title}"?`)) return
    try {
      await api.delete(`/api/community-board/${post.id}`)
      await fetchPosts()
    } catch { alert('Failed to delete') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Creative Corner" subtitle="Poems · Stories · Kavithais"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Share</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Tip Banner */}
        <button
          onClick={() => setShowTip(v => !v)}
          className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
          style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Info size={14} style={{ color: 'var(--indigo)', flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
              How to use Creative Corner {showTip ? '▲' : '▼'}
            </p>
            {showTip && (
              <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--indigo)' }}>
                Share your poems, short stories, Tamil kavithais, inspiring quotes or anything creative!
                Type or paste your content, pick a category, give it a title and hit Share.
                Others can like and comment on your post. Keep it positive and community-friendly 🙏
              </p>
            )}
          </div>
        </button>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setFilter('ALL')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
            style={{
              background: filter === 'ALL' ? 'var(--indigo)' : 'white',
              color:      filter === 'ALL' ? 'white' : 'var(--ink-2)',
              border:     `1px solid ${filter === 'ALL' ? 'var(--indigo)' : 'var(--border)'}`,
            }}>
            All ({posts.length})
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
                {c.label} {c.count > 0 && `(${c.count})`}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Feather size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>Nothing here yet</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>Be the first to share something creative!</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
              <PlusCircle size={14} /> Share Something
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} user={user} onLike={handleLike} onDelete={handleDelete} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Share with the Community" width="max-w-lg">
        <div className="space-y-4">
          {/* Category picker */}
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
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Title <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input className="input" placeholder="Give your post a title..."
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }} />
            {errors.title && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Content <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea className="input resize-none h-32"
              placeholder="Type or paste your poem, story, quote..."
              value={form.content}
              onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setErrors(er => ({ ...er, content: undefined })) }} />
            {errors.content && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.content}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Sharing...' : 'Share Post'}
            </button>
            <button onClick={() => { setShowAdd(false); setErrors({}) }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}