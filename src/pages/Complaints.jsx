import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { StatusBadge, Modal } from '../components/ui'
import { PlusCircle, Search, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import api from '../api/config'

const CATEGORIES = ['Plumbing','Electrical','Security','Sanitation','Noise','Structural','Other']
const priorityStyle = {
  low:    { bg:'#ecfdf5', color:'#059669' },
  medium: { bg:'#fffbeb', color:'#d97706' },
  high:   { bg:'#fff1f2', color:'#e11d48' },
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [counts, setCounts] = useState({ open:0, inProgress:0, resolved:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ flatNo:'', residentName:'', category:'PLUMBING', title:'', description:'', priority:'MEDIUM' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchComplaints() }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/api/complaints'),
        api.get('/api/complaints/counts'),
      ])
      setComplaints(listRes.data)
      setCounts(countRes.data)
    } catch (err) {
      console.error('Error fetching complaints:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = complaints.filter(c => {
    const matchSearch = search === '' ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.residentName?.toLowerCase().includes(search.toLowerCase())
    const statusMatch = filter === 'all' ||
      (filter === 'open' && c.status === 'OPEN') ||
      (filter === 'in-progress' && c.status === 'IN_PROGRESS') ||
      (filter === 'resolved' && c.status === 'RESOLVED')
    return matchSearch && statusMatch
  })

  const handleAdd = async () => {
    if (!form.title || !form.flatNo) return
    setSubmitting(true)
    try {
      await api.post('/api/complaints', {
        ...form,
        category: form.category.toUpperCase(),
        priority: form.priority.toUpperCase(),
      })
      await fetchComplaints()
      setForm({ flatNo:'', residentName:'', category:'PLUMBING', title:'', description:'', priority:'MEDIUM' })
      setShowAdd(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/complaints/${id}/status`, {
        status: status.toUpperCase().replace('-','_')
      })
      await fetchComplaints()
      setSelected(null)
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getStatusLabel = (status) => {
    if (status === 'IN_PROGRESS') return 'in-progress'
    return status?.toLowerCase()
  }

  const getPriorityStyle = (priority) => {
    return priorityStyle[priority?.toLowerCase()] || priorityStyle.medium
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Complaints" subtitle="Manage resident complaints"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <PlusCircle size={14}/><span className="hidden sm:inline"> New</span>
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Status cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { key:'open',        label:'Open',        icon:AlertTriangle, color:'#e11d48', bg:'#fff1f2', count: counts.open },
            { key:'in-progress', label:'In Progress', icon:Clock,         color:'#d97706', bg:'#fffbeb', count: counts.inProgress },
            { key:'resolved',    label:'Resolved',    icon:CheckCircle2,  color:'#059669', bg:'#ecfdf5', count: counts.resolved },
          ].map(s => (
            <button key={s.key}
              onClick={() => setFilter(p => p === s.key ? 'all' : s.key)}
              className={clsx('card p-3 flex items-center gap-2 text-left transition-all', filter === s.key && 'ring-2')}
              style={{ '--tw-ring-color': s.color + '40' }}>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[20px] md:text-[24px] font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>{s.count}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select flex-shrink-0" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 360px)' }}>
            {loading ? (
              <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No complaints found</div>
            ) : filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: c.status === 'RESOLVED' ? 'var(--emerald)' : c.status === 'IN_PROGRESS' ? 'var(--amber)' : 'var(--rose)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{c.title}</div>
                    <StatusBadge status={getStatusLabel(c.status)} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--indigo)' }}>{c.flatNo}</span>
                    <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{c.residentName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize" style={getPriorityStyle(c.priority)}>
                      {c.priority?.toLowerCase()}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{c.createdAt}</span>
                  </div>
                  <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    {c.status === 'OPEN' && (
                      <button onClick={() => updateStatus(c.id, 'IN_PROGRESS')}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background:'#fffbeb', color:'#d97706' }}>Start</button>
                    )}
                    {c.status === 'IN_PROGRESS' && (
                      <button onClick={() => updateStatus(c.id, 'RESOLVED')}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background:'#ecfdf5', color:'#059669' }}>Resolve</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Complaint #${selected?.id}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Flat', selected.flatNo],
                ['Resident', selected.residentName],
                ['Category', selected.category],
                ['Priority', <span className="font-bold capitalize" style={getPriorityStyle(selected.priority)}>{selected.priority?.toLowerCase()}</span>],
                ['Status', <StatusBadge status={getStatusLabel(selected.status)} />],
                ['Raised On', selected.createdAt],
              ].map(([k,v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>Issue</div>
              <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>{selected.title}</div>
            </div>
            {selected.description && (
              <div className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>Description</div>
                <div className="text-[12px] leading-relaxed" style={{ color:'var(--ink-2)' }}>{selected.description}</div>
              </div>
            )}
            <div className="flex gap-2">
              {selected.status === 'OPEN' && (
                <button onClick={() => updateStatus(selected.id, 'IN_PROGRESS')} className="btn-primary flex-1 justify-center">
                  <Clock size={13}/> Mark In Progress
                </button>
              )}
              {selected.status === 'IN_PROGRESS' && (
                <button onClick={() => updateStatus(selected.id, 'RESOLVED')} className="btn-primary flex-1 justify-center">
                  <CheckCircle2 size={13}/> Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Complaint Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log New Complaint">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Flat No.</label>
              <input className="input" placeholder="e.g. 2G" value={form.flatNo} onChange={e=>setForm(f=>({...f,flatNo:e.target.value}))} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Resident</label>
              <input className="input" placeholder="Name" value={form.residentName} onChange={e=>setForm(f=>({...f,residentName:e.target.value}))} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Category</label>
              <select className="select w-full" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c} value={c.toUpperCase()}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Priority</label>
              <select className="select w-full" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                {['LOW','MEDIUM','HIGH'].map(p=><option key={p} value={p}>{p.toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Title</label>
            <input className="input" placeholder="Brief issue title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Description</label>
            <textarea className="input resize-none h-20" placeholder="Describe the issue..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1 justify-center">
              <PlusCircle size={14}/> {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}