import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { complaints as initialComplaints } from '../../data/mockData'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge, Modal } from '../../components/ui'
import { PlusCircle, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = ['Plumbing','Electrical','Security','Sanitation','Noise','Structural','Other']
const priorityStyle = { low:{ bg:'#ecfdf5', color:'#059669' }, medium:{ bg:'#fffbeb', color:'#d97706' }, high:{ bg:'#fff1f2', color:'#e11d48' } }

export default function ResidentComplaints() {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState(initialComplaints)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ category:'Plumbing', title:'', description:'', priority:'medium' })
  const [selected, setSelected] = useState(null)

  const myComplaints = complaints.filter(c => c.flatNo === user?.flatNo)
  const counts = {
    open:         myComplaints.filter(c=>c.status==='open').length,
    'in-progress': myComplaints.filter(c=>c.status==='in-progress').length,
    resolved:     myComplaints.filter(c=>c.status==='resolved').length,
  }

  const handleAdd = () => {
    if (!form.title) return
    setComplaints(prev => [{ id:`CMP${Date.now()}`, flatNo:user.flatNo, residentName:user.name, ...form, status:'open', createdAt:new Date().toISOString().split('T')[0], updatedAt:new Date().toISOString().split('T')[0] }, ...prev])
    setForm({ category:'Plumbing', title:'', description:'', priority:'medium' }); setShowAdd(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="My Complaints" subtitle={`Flat ${user?.flatNo}`}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><PlusCircle size={14}/><span className="hidden sm:inline"> Raise</span></button>} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { status:'open', label:'Open', icon:AlertTriangle, color:'#e11d48', bg:'#fff1f2' },
            { status:'in-progress', label:'In Progress', icon:Clock, color:'#d97706', bg:'#fffbeb' },
            { status:'resolved', label:'Resolved', icon:CheckCircle2, color:'#059669', bg:'#ecfdf5' },
          ].map(s => (
            <div key={s.status} className="card p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:s.bg }}>
                <s.icon size={15} style={{ color:s.color }} />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[20px] font-bold" style={{ color:s.color, letterSpacing:'-0.03em' }}>{counts[s.status]}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="card-header"><span className="card-title">All My Complaints</span></div>
          {myComplaints.length===0
            ? <div className="py-16 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color:'var(--ink-4)' }} />
                <p className="text-[13px]" style={{ color:'var(--ink-4)' }}>No complaints — all good!</p>
              </div>
            : myComplaints.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className="flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background:c.status==='resolved'?'var(--emerald)':c.status==='in-progress'?'var(--amber)':'var(--rose)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-[11px] mt-1 line-clamp-2" style={{ color:'var(--ink-3)' }}>{c.description}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={priorityStyle[c.priority]}>{c.priority}</span>
                    <span className="text-[10px]" style={{ color:'var(--ink-4)' }}>{c.createdAt}</span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Complaint — ${selected?.id}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[['Category',selected.category],['Priority',<span className="font-bold capitalize" style={priorityStyle[selected.priority]}>{selected.priority}</span>],['Status',<StatusBadge status={selected.status}/>],['Raised',selected.createdAt]].map(([k,v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>Issue</div>
              <div className="text-[14px] font-bold" style={{ color:'var(--ink)' }}>{selected.title}</div>
            </div>
            {selected.description && (
              <div className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>Description</div>
                <div className="text-[13px] leading-relaxed" style={{ color:'var(--ink-2)' }}>{selected.description}</div>
              </div>
            )}
            {selected.status!=='resolved' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background:'#fffbeb', border:'1px solid #fde68a' }}>
                <Clock size={13} style={{ color:'var(--amber)' }} />
                <span className="text-[12px]" style={{ color:'#78350f' }}>Admin is working on this. You'll be notified.</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Raise Complaint">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Category</label>
              <select className="select w-full" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Priority</label>
              <div className="flex gap-1">
                {['low','medium','high'].map(p => (
                  <button key={p} onClick={() => setForm(f=>({...f,priority:p}))}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all"
                    style={form.priority===p ? { ...priorityStyle[p], border:`1px solid ${priorityStyle[p].color}40` } : { background:'var(--surface-3)', color:'var(--ink-3)', border:'1px solid var(--border)' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Title</label>
            <input className="input" placeholder="Brief issue title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Description</label>
            <textarea className="input resize-none h-24" placeholder="Describe the issue in detail..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
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