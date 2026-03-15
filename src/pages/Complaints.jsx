import { useState } from 'react'
import { complaints as initialComplaints } from '../data/mockData'
import Topbar from '../components/layout/Topbar'
import { StatusBadge, Modal } from '../components/ui'
import { PlusCircle, Search, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = ['Plumbing','Electrical','Security','Sanitation','Noise','Structural','Other']
const EMPTY_FORM = { flatNo:'', residentName:'', category:'Plumbing', title:'', description:'', priority:'medium' }
const priorityStyle = { low:{ bg:'#ecfdf5', color:'#059669' }, medium:{ bg:'#fffbeb', color:'#d97706' }, high:{ bg:'#fff1f2', color:'#e11d48' } }

export default function Complaints() {
  const [complaints, setComplaints] = useState(initialComplaints)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = complaints.filter(c => {
    const matchSearch = search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.flatNo.toLowerCase().includes(search.toLowerCase()) || c.residentName.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'all' || c.status === filter)
  })

  const counts = {
    open: complaints.filter(c=>c.status==='open').length,
    'in-progress': complaints.filter(c=>c.status==='in-progress').length,
    resolved: complaints.filter(c=>c.status==='resolved').length,
  }

  const handleAdd = () => {
    if (!form.title || !form.flatNo) return
    setComplaints(prev => [{ id:`CMP${Date.now()}`, ...form, status:'open', createdAt:new Date().toISOString().split('T')[0], updatedAt:new Date().toISOString().split('T')[0] }, ...prev])
    setForm(EMPTY_FORM); setShowAdd(false)
  }

  const updateStatus = (id, status) => {
    setComplaints(prev => prev.map(c => c.id===id ? {...c, status, updatedAt:new Date().toISOString().split('T')[0]} : c))
    setSelected(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Complaints" subtitle="Manage resident complaints"
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><PlusCircle size={14}/><span className="hidden sm:inline"> New</span></button>} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Status cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { status:'open', label:'Open', icon:AlertTriangle, color:'#e11d48', bg:'#fff1f2' },
            { status:'in-progress', label:'In Progress', icon:Clock, color:'#d97706', bg:'#fffbeb' },
            { status:'resolved', label:'Resolved', icon:CheckCircle2, color:'#059669', bg:'#ecfdf5' },
          ].map(s => (
            <button key={s.status} onClick={() => setFilter(p => p===s.status ? 'all' : s.status)}
              className={clsx('card p-3 flex items-center gap-2 text-left transition-all', filter===s.status && 'ring-2')}
              style={{ '--tw-ring-color': s.color+'40' }}>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <s.icon size={15} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[20px] md:text-[24px] font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>{counts[s.status]}</div>
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

        {/* List — card style always (works on mobile and desktop) */}
        <div className="card overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 360px)' }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: c.status==='resolved' ? 'var(--emerald)' : c.status==='in-progress' ? 'var(--amber)' : 'var(--rose)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--indigo)' }}>{c.flatNo}</span>
                    <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{c.residentName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize" style={priorityStyle[c.priority]}>{c.priority}</span>
                    <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{c.createdAt}</span>
                  </div>
                  {/* Action buttons inline */}
                  <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                    {c.status==='open' && <button onClick={() => updateStatus(c.id,'in-progress')} className="text-[10px] px-2.5 py-1 rounded-lg font-semibold" style={{ background:'#fffbeb', color:'#d97706' }}>Start</button>}
                    {c.status==='in-progress' && <button onClick={() => updateStatus(c.id,'resolved')} className="text-[10px] px-2.5 py-1 rounded-lg font-semibold" style={{ background:'#ecfdf5', color:'#059669' }}>Resolve</button>}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No complaints found</div>}
          </div>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Complaint — ${selected?.id}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[['Flat',selected.flatNo],['Category',selected.category],['Priority',<span className="font-bold capitalize" style={priorityStyle[selected.priority]}>{selected.priority}</span>],['Status',<StatusBadge status={selected.status}/>],['Raised',selected.createdAt],['Updated',selected.updatedAt]].map(([k,v]) => (
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
            <div className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>Description</div>
              <div className="text-[12px] leading-relaxed" style={{ color:'var(--ink-2)' }}>{selected.description}</div>
            </div>
            <div className="flex gap-2">
              {selected.status==='open' && <button onClick={() => updateStatus(selected.id,'in-progress')} className="btn-primary flex-1 justify-center"><Clock size={13}/> In Progress</button>}
              {selected.status==='in-progress' && <button onClick={() => updateStatus(selected.id,'resolved')} className="btn-primary flex-1 justify-center"><CheckCircle2 size={13}/> Resolve</button>}
            </div>
          </div>
        )}
      </Modal>

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
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Priority</label>
              <select className="select w-full" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                {['low','medium','high'].map(p=><option key={p}>{p}</option>)}
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
            <button onClick={handleAdd} className="btn-primary flex-1 justify-center"><PlusCircle size={14}/> Submit</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}