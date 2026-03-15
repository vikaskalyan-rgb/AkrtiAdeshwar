import { useState } from 'react'
import { announcements as initial, getAnnouncementRecipients } from '../data/mockData'
import Topbar from '../components/layout/Topbar'
import { StatusBadge, Modal } from '../components/ui'
import { PlusCircle, Pin, Trash2, Users } from 'lucide-react'
import clsx from 'clsx'

const TYPE_COLORS = { notice:'#5b52f0', event:'#059669', urgent:'#e11d48' }
const AUDIENCE_LABELS = {
  everyone:  { label:'Everyone',        desc:'Owners + all residents',               color:'#5b52f0', bg:'#eeeeff' },
  owners:    { label:'Owners Only',     desc:'Flat owners only (not tenants)',        color:'#d97706', bg:'#fffbeb' },
  residents: { label:'Residents Only',  desc:'Physically living (tenants + owners)', color:'#059669', bg:'#ecfdf5' },
}
const audienceStyle = {
  everyone:  { label:'Everyone',       bg:'#eeeeff', color:'#5b52f0' },
  owners:    { label:'Owners Only',    bg:'#fffbeb', color:'#d97706' },
  residents: { label:'Residents Only', bg:'#ecfdf5', color:'#059669' },
}

export default function Announcements() {
  const [anns, setAnns] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ type:'notice', audience:'everyone', title:'', body:'' })
  const [filter, setFilter] = useState('all')

  const filtered = anns.filter(a => filter==='all' || a.type===filter).sort((a,b) => (b.isPinned?1:0)-(a.isPinned?1:0))
  const recipientCount = getAnnouncementRecipients(form.audience).length

  const handleAdd = () => {
    if (!form.title || !form.body) return
    setAnns(prev => [{ id:`ANN${Date.now()}`, ...form, postedBy:'Admin', postedAt:new Date().toISOString().split('T')[0], isPinned:false }, ...prev])
    setForm({ type:'notice', audience:'everyone', title:'', body:'' }); setShowAdd(false)
  }
  const togglePin   = (id) => setAnns(prev => prev.map(a => a.id===id ? {...a, isPinned:!a.isPinned} : a))
  const handleDelete = (id) => { if (confirm('Delete?')) setAnns(prev => prev.filter(a => a.id!==id)) }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Announcements" subtitle="Post notices to residents"
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><PlusCircle size={14}/><span className="hidden sm:inline"> Post</span></button>} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          {['all','notice','event','urgent'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-2 rounded-xl text-[11px] font-semibold transition-all capitalize flex-shrink-0"
              style={{
                background: filter===t ? (t==='all' ? 'var(--indigo)' : TYPE_COLORS[t]) : 'white',
                color: filter===t ? 'white' : 'var(--ink-2)',
                border: `1px solid ${filter===t ? 'transparent' : 'var(--border)'}`,
              }}>
              {t==='all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(a => {
            const aud = audienceStyle[a.audience] || audienceStyle.everyone
            return (
              <div key={a.id} className={clsx('card group', a.isPinned && 'ring-1 ring-indigo-200')}>
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.isPinned && <Pin size={11} style={{ color:'var(--amber)' }} />}
                      <StatusBadge status={a.type} />
                      <span className="badge flex items-center gap-1" style={{ background:aud.bg, color:aud.color }}>
                        <Users size={9} />{aud.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => togglePin(a.id)} className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                        style={{ background:a.isPinned?'#fffbeb':'var(--surface-3)', color:a.isPinned?'var(--amber)':'var(--ink-3)' }}>
                        {a.isPinned?'Unpin':'Pin'}
                      </button>
                      <button onClick={() => handleDelete(a.id)} style={{ color:'var(--ink-4)' }}><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <h3 className="text-[14px] md:text-[15px] font-bold mb-2" style={{ color:'var(--ink)', letterSpacing:'-0.01em' }}>{a.title}</h3>
                  <p className="text-[12px] md:text-[13px] leading-relaxed" style={{ color:'var(--ink-2)' }}>{a.body}</p>
                  <div className="mt-3 pt-3 flex items-center justify-between flex-wrap gap-2" style={{ borderTop:'1px solid var(--border)' }}>
                    <span className="text-[11px]" style={{ color:'var(--ink-4)' }}>Posted by {a.postedBy} · {a.postedAt}</span>
                    <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color:aud.color }}>
                      <Users size={11}/>{getAnnouncementRecipients(a.audience).length} recipients
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Post Announcement" width="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color:'var(--ink-2)' }}>Type</label>
            <div className="flex gap-2">
              {['notice','event','urgent'].map(t => (
                <button key={t} onClick={() => setForm(f=>({...f,type:t}))}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold capitalize transition-all"
                  style={form.type===t ? { background:TYPE_COLORS[t]+'18', color:TYPE_COLORS[t], border:`1px solid ${TYPE_COLORS[t]}44` } : { background:'var(--surface-3)', color:'var(--ink-3)', border:'1px solid var(--border)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color:'var(--ink-2)' }}>Send To</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(AUDIENCE_LABELS).map(([key,val]) => (
                <button key={key} onClick={() => setForm(f=>({...f,audience:key}))}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={form.audience===key ? { background:val.bg, border:`2px solid ${val.color}`, color:val.color } : { background:'var(--surface-3)', border:'1px solid var(--border)', color:'var(--ink-3)' }}>
                  <div className="text-[11px] font-bold">{val.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-75 hidden sm:block">{val.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background:'var(--surface-3)', border:'1px solid var(--border)' }}>
              <Users size={13} style={{ color:'var(--indigo)' }} />
              <span className="text-[12px] font-medium" style={{ color:'var(--ink-2)' }}>
                Sending to <strong style={{ color:'var(--indigo)' }}>{recipientCount} recipients</strong>
              </span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Title</label>
            <input className="input" placeholder="Announcement title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color:'var(--ink-2)' }}>Message</label>
            <textarea className="input resize-none h-24" placeholder="Full message..." value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="btn-primary flex-1 justify-center"><PlusCircle size={14}/> Post to {recipientCount}</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}