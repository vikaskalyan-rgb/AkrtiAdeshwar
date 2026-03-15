// Thin wrappers that render admin pages in read-only resident context
import Announcements from '../Announcements'
import Visitors from '../Visitors'
import Expenses from '../Expenses'
import FlatDirectory from '../FlatDirectory'
import Reports from '../Reports'

// Announcements filtered for resident view (based on audience)
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { announcements as initialAnn } from '../../data/mockData'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge } from '../../components/ui'
import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ResidentAnnouncements() {
  const { user } = useAuth()
  const myRole = user?.role

  const visible = initialAnn.filter(a => {
    if (a.audience === 'everyone') return true
    if (a.audience === 'owners' && myRole === 'owner') return true
    if (a.audience === 'residents') return true
    return false
  }).sort((a,b) => (b.isPinned?1:0)-(a.isPinned?1:0))

  const audienceStyle = {
    everyone:  { label:'Everyone',        bg:'#eeeeff', color:'#5b52f0' },
    owners:    { label:'Owners Only',     bg:'#fffbeb', color:'#d97706' },
    residents: { label:'Residents Only',  bg:'#ecfdf5', color:'#059669' },
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Announcements" subtitle="Society notices and updates" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-3 max-w-3xl">
          {visible.length === 0 && (
            <div className="py-16 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No announcements for you</div>
          )}
          {visible.map(a => {
            const aud = audienceStyle[a.audience] || audienceStyle.everyone
            return (
              <div key={a.id} className="card">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <StatusBadge status={a.type} />
                    <span className="badge flex items-center gap-1" style={{ background: aud.bg, color: aud.color }}>
                      <Users size={9} />{aud.label}
                    </span>
                    {a.isPinned && <span className="badge" style={{ background:'#fffbeb', color:'#d97706' }}>📌 Pinned</span>}
                  </div>
                  <h3 className="text-[15px] font-bold mb-2" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{a.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{a.body}</p>
                  <div className="mt-4 pt-3 text-[11px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-4)' }}>
                    Posted by {a.postedBy} · {a.postedAt}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Re-export admin pages as-is for read-only resident access
export { Visitors as ResidentVisitors }
export { Expenses as ResidentExpenses }
export { FlatDirectory as ResidentDirectory }
export { Reports as ResidentReports }
