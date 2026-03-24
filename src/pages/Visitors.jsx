import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { PlusCircle, Search, LogIn, LogOut, Users } from 'lucide-react'
import { format } from 'date-fns'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const PURPOSES = ['Guest','Delivery','Plumber','Electrician','Maintenance','Cab Driver','Other']
const EMPTY_FORM = { name:'', purpose:'Guest', flatNo:'', residentName:'', phone:'', vehicleNo:'' }

export default function Visitors() {
  const { user } = useAuth()
  const [visitors, setVisitors] = useState([])
  const [stats, setStats] = useState({ currentlyInside:0, todayTotal:0, todayExited:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchVisitors() }, [dateFilter])
  useEffect(() => { fetchStats() }, [])

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const url = dateFilter === 'today' ? '/api/visitors?todayOnly=true' : '/api/visitors'
      const res = await api.get(url)
      setVisitors(res.data)
    } catch (err) {
      console.error('Error fetching visitors:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/visitors/stats')
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const filtered = visitors.filter(v =>
    search === '' ||
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.flatNo?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!form.name || !form.flatNo) return
    setSubmitting(true)
    try {
      await api.post('/api/visitors', form)
      await fetchVisitors()
      await fetchStats()
      setForm(EMPTY_FORM)
      setShowAdd(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log entry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckout = async (id) => {
    try {
      await api.patch(`/api/visitors/${id}/checkout`)
      await fetchVisitors()
      await fetchStats()
    } catch (err) {
      alert('Failed to checkout')
    }
  }

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch { return dateStr }
}

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Visitor Log" subtitle="Track all visitor entries and exits"
        actions={
          user?.role === 'admin'
            ? <button onClick={() => setShowAdd(true)} className="btn-primary">
                <PlusCircle size={14}/><span className="hidden sm:inline"> Log Entry</span>
              </button>
            : null
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label:'Inside Now', value: stats.currentlyInside, icon:LogIn,   color:'#059669', bg:'#ecfdf5' },
            { label:'Today',      value: stats.todayTotal,      icon:Users,    color:'#5b52f0', bg:'#eeeeff' },
            { label:'Exited',     value: stats.todayExited,     icon:LogOut,   color:'#d97706', bg:'#fffbeb' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:s.bg }}>
                <s.icon size={16} style={{ color:s.color }} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[22px] font-bold" style={{ color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search visitor or flat..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 rounded-xl p-1 flex-shrink-0"
            style={{ background:'white', border:'1px solid var(--border)' }}>
            {[['today','Today'],['all','All']].map(([v,l]) => (
              <button key={v} onClick={() => setDateFilter(v)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: dateFilter===v ? 'var(--indigo)' : 'transparent',
                  color: dateFilter===v ? 'white' : 'var(--ink-3)'
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          <div className="overflow-y-auto" style={{ maxHeight:'calc(100dvh - 340px)' }}>
            {loading ? (
              <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No visitors found</div>
            ) : filtered.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background:'var(--indigo)' }}>
                  {v.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>{v.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] font-bold font-mono" style={{ color:'var(--indigo)' }}>{v.flatNo}</span>
                    <span className="text-[11px]" style={{ color:'var(--ink-3)' }}>{v.purpose}</span>
                    {v.vehicleNo && (
                      <span className="text-[10px] font-mono" style={{ color:'var(--ink-4)' }}>{v.vehicleNo}</span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-4)' }}>
                    In: {formatTime(v.inTime)}
                    {v.outTime && ` · Out: ${formatTime(v.outTime)}`}
                  </div>
                </div>
                <div>
                  {v.status === 'IN'
                    ? <button onClick={() => handleCheckout(v.id)}
                        className="text-[11px] px-3 py-1.5 rounded-xl font-semibold"
                        style={{ background:'#fff1f2', color:'#e11d48' }}>
                        Check Out
                      </button>
                    : <span className="badge badge-vacant">Exited</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entry Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Visitor Entry">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Visitor Name', 'name',         'text',   'Full name'],
              ['Visiting Flat','flatNo',        'text',   'e.g. 3A'],
              ['Resident Name','residentName',  'text',   'Resident'],
              ['Phone',        'phone',         'text',   'Mobile (optional)'],
              ['Vehicle No.',  'vehicleNo',     'text',   'Optional'],
            ].map(([label,key,type,placeholder]) => (
              <div key={key}>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>{label}</label>
                <input className="input" type={type} placeholder={placeholder}
                  value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} />
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>Purpose</label>
              <select className="select w-full" value={form.purpose}
                onChange={e => setForm(f=>({...f, purpose:e.target.value}))}>
                {PURPOSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1 justify-center">
              <LogIn size={14}/> {submitting ? 'Logging...' : 'Log Entry'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}