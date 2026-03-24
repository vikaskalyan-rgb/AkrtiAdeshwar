import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../../api/config'
import { Calendar, ChevronRight } from 'lucide-react'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getLastNMonths(n) {
  const result = []
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return result
}

function MonthSelector({ value, onChange }) {
  const months  = getLastNMonths(6)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isSelected = (m) => m.month === value?.month && m.year === value?.year

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
        style={{
          background: open ? 'var(--emerald)' : 'white',
          color:      open ? 'white' : 'var(--ink-2)',
          border:     `1px solid ${open ? 'var(--emerald)' : 'var(--border)'}`,
        }}>
        <Calendar size={13} />
        {MONTH_NAMES[value.month - 1]} {value.year}
        <ChevronRight size={12}
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 rounded-2xl p-2 animate-in"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(26,26,46,0.12)',
            minWidth: '180px',
            right: 0,
          }}>
          {months.map(m => (
            <button key={`${m.month}-${m.year}`}
              onClick={() => { onChange(m); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5"
              style={isSelected(m)
                ? { background: 'var(--emerald)', color: 'white' }
                : { background: 'transparent', color: 'var(--ink-2)' }
              }>
              <span>{MONTH_NAMES[m.month - 1]} {m.year}</span>
              {isSelected(m) && (
                <span className="text-[10px] font-bold opacity-70">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ResidentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const isOwner  = user?.role === 'owner'

  const [selectedMonth, setSelectedMonth] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })

  const [myPayments,      setMyPayments]      = useState([])
  const [myComplaints,    setMyComplaints]     = useState([])
  const [announcements,   setAnnouncements]    = useState([])
  const [myVisitors,      setMyVisitors]       = useState([])
  const [expenses,        setExpenses]         = useState([])
  const [dashboard,       setDashboard]        = useState(null)
  const [allFlats,        setAllFlats]         = useState([])
  const [currentPayments, setCurrentPayments]  = useState([])
  const [loading,         setLoading]          = useState(true)

  const currentMonth = selectedMonth.month
  const currentYear  = selectedMonth.year

  useEffect(() => {
    if (user?.flatNo) fetchAll()
  }, [user, selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const requests = [
        api.get(`/api/maintenance/flat/${user.flatNo}`),
        api.get(`/api/complaints/flat/${user.flatNo}`),
        api.get('/api/announcements'),
        api.get(`/api/visitors?flatNo=${user.flatNo}&todayOnly=true`),
        api.get(`/api/dashboard?month=${currentMonth}&year=${currentYear}`),
        api.get('/api/flats'),
        api.get(`/api/maintenance?month=${currentMonth}&year=${currentYear}`),
      ]

      if (isOwner) {
        requests.push(api.get(`/api/expenses?month=${currentMonth}&year=${currentYear}`))
      }

      const results = await Promise.all(requests)

      setMyPayments(results[0].data)
      setMyComplaints(results[1].data)
      setAnnouncements(results[2].data)
      setMyVisitors(results[3].data)
      setDashboard(results[4].data)
      setAllFlats(results[5].data.filter(f => f.floor > 0 && f.wing !== 'Ground'))
      setCurrentPayments(results[6].data)
      if (isOwner && results[7]) setExpenses(results[7].data)
    } catch (err) {
      console.error('Resident dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentMonthPay = myPayments.find(
    p => p.month === currentMonth && p.year === currentYear
  )
  const openComplaints = myComplaints.filter(c => c.status !== 'RESOLVED')
  const maintenance    = dashboard?.maintenance || {}
  const societyFund    = dashboard?.societyFund || {}
  const totalExpenses  = expenses.reduce((s,e) => s + e.amount, 0)
  const MONTHLY_AMOUNT = maintenance.monthlyAmount || 4200

  // Payment history — all months sorted oldest to newest for chart
  const paymentHistory = [...myPayments]
    .sort((a,b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(p => ({
      name:   MONTH_NAMES[p.month - 1],
      paid:   p.status === 'PAID' ? (p.amount || MONTHLY_AMOUNT) : 0,
      status: p.status,
    }))

  const flatGrid = allFlats.map(f => {
    const pay = currentPayments.find(p => p.flatNo === f.flatNo)
    return { ...f, payStatus: pay?.status || 'UNPAID' }
  })

  const expColors  = ['#5b52f0','#059669','#d97706','#e11d48','#0284c7','#7c3aed']
  const monthLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`
  const daysLeft   = new Date(currentYear, currentMonth, 0).getDate() - now.getDate()

  if (loading) return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title={`Hi, ${user?.name?.split(' ')[0]}`} subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[14px]" style={{ color:'var(--ink-3)' }}>Loading your dashboard...</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar
        title={`Hi, ${user?.name?.split(' ')[0]}`}
        subtitle={`Flat ${user?.flatNo} · ${monthLabel}`}
        actions={
          <MonthSelector
            value={selectedMonth}
            onChange={m => setSelectedMonth(m)}
          />
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* KPIs */}
        <div className="kpi-grid">

          {/* My Payment */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: currentMonthPay?.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color:'var(--ink-3)' }}>My Payment</div>
            <div className="text-[22px] font-bold" style={{
              color: currentMonthPay?.status === 'PAID' ? 'var(--emerald)' : 'var(--rose)',
              letterSpacing: '-0.03em'
            }}>
              {currentMonthPay?.status === 'PAID'
                ? 'Paid ✓'
                : `₹${MONTHLY_AMOUNT.toLocaleString()}`}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color:'var(--ink-3)' }}>
              {currentMonthPay?.status === 'PAID'
                ? `on ${currentMonthPay.paidOn} · ${currentMonthPay.paymentMode}`
                : 'Due this month'}
            </div>
            {(!currentMonthPay || currentMonthPay.status === 'UNPAID') && (
              <button onClick={() => navigate('/resident/maintenance')}
                className="btn-primary mt-2 text-[11px] px-3 py-1.5">
                Pay Now →
              </button>
            )}
          </div>

          {/* My Complaints */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background:'var(--rose)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color:'var(--ink-3)' }}>My Complaints</div>
            <div className="text-[22px] font-bold"
              style={{ color:'var(--rose)', letterSpacing:'-0.03em' }}>
              {openComplaints.length}
            </div>
            <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
              open · {myComplaints.length} total
            </div>
            <button onClick={() => navigate('/resident/complaints')}
              className="mt-2 text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
              View →
            </button>
          </div>

          {/* Society collection rate */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background:'var(--emerald)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
              style={{ color:'var(--ink-3)' }}>Society</div>
            <div className="text-[22px] font-bold"
              style={{ color:'var(--emerald)', letterSpacing:'-0.03em' }}>
              {maintenance.total
                ? Math.round((maintenance.collected||0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
                : 0}%
            </div>
            <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
              {maintenance.paid||0}/{maintenance.total||0} paid
            </div>
          </div>

          {/* Fund (owners) / Days left (tenants) */}
          {isOwner ? (
            <div className="card p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background:'var(--indigo)' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{ color:'var(--ink-3)' }}>Fund</div>
              <div className="text-[22px] font-bold"
                style={{ color:'var(--indigo)', letterSpacing:'-0.03em' }}>
                {fmt(societyFund.currentBalance || 382000)}
              </div>
              <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>corpus balance</div>
            </div>
          ) : (
            <div className="card p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background:'var(--amber)' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1"
                style={{ color:'var(--ink-3)' }}>This Month</div>
              <div className="text-[22px] font-bold"
                style={{ color:'var(--amber)', letterSpacing:'-0.03em' }}>
                {MONTH_NAMES[currentMonth - 1]}
              </div>
              <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Last day!'}
              </div>
            </div>
          )}
        </div>

        {/* Payment history + flat grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Payment History</span>
              <button onClick={() => navigate('/resident/maintenance')}
                className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
                All →
              </button>
            </div>
            <div className="p-3 md:p-4">
              {paymentHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={paymentHistory} barSize={22}>
                    <XAxis dataKey="name"
                      tick={{ fontSize:10, fill:'var(--ink-3)' }}
                      axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={v => [fmt(v)]} />
                    <Bar dataKey="paid" radius={[6,6,0,0]}>
                      {paymentHistory.map((d,i) => (
                        <Cell key={i}
                          fill={d.status === 'PAID' ? '#059669' : '#fca5a5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[90px] flex items-center justify-center text-[12px]"
                  style={{ color:'var(--ink-4)' }}>
                  No payment history yet
                </div>
              )}

              {/* Society flat grid */}
              <div className="mt-3 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide mb-2"
                  style={{ color:'var(--ink-3)' }}>
                  Society Status — {monthLabel}
                </div>
                {flatGrid.length > 0 ? (
                  <div className="grid gap-1"
                    style={{ gridTemplateColumns:'repeat(auto-fill, minmax(34px, 1fr))' }}>
                    {flatGrid.map(f => {
                      const isMe  = f.flatNo === user?.flatNo
                      const bg    = isMe
                        ? 'var(--emerald)'
                        : f.payStatus === 'PAID' ? '#d1fae5' : '#ffe4e6'
                      const color = isMe
                        ? 'white'
                        : f.payStatus === 'PAID' ? '#065f46' : '#9f1239'
                      return (
                        <div key={f.flatNo} title={f.flatNo}
                          className="aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                          style={{
                            background: bg, color,
                            fontSize: '7px', fontWeight: 700,
                            outline: isMe ? '2px solid var(--emerald)' : 'none',
                            outlineOffset: '1px'
                          }}>
                          {f.flatNo}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[12px]"
                    style={{ color:'var(--ink-4)' }}>
                    No data for this month
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Complaints */}
          <div className="card flex flex-col" style={{ maxHeight:'380px' }}>
            <div className="card-header">
              <span className="card-title">My Complaints</span>
              <button onClick={() => navigate('/resident/complaints')}
                className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
                Raise +
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {myComplaints.length === 0
                ? <div className="py-8 text-center text-[13px]"
                    style={{ color:'var(--ink-4)' }}>No complaints raised</div>
                : myComplaints.map(c => (
                  <div key={c.id}
                    className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom:'1px solid var(--border)' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background:
                        c.status==='RESOLVED'    ? 'var(--emerald)' :
                        c.status==='IN_PROGRESS' ? 'var(--amber)'   : 'var(--rose)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium leading-tight truncate"
                        style={{ color:'var(--ink)' }}>{c.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                        {c.category} · {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : ''}
                      </div>
                    </div>
                    <StatusBadge
                      status={c.status==='IN_PROGRESS' ? 'in-progress' : c.status?.toLowerCase()} />
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className={`grid grid-cols-1 gap-3 ${isOwner ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>

          {/* Announcements — everyone */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Announcements</span>
              <button onClick={() => navigate('/resident/announcements')}
                className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
                All →
              </button>
            </div>
            {announcements.slice(0,3).map(a => (
              <div key={a.id} className="px-4 py-2.5"
                style={{ borderBottom:'1px solid var(--border)' }}>
                <StatusBadge status={a.type?.toLowerCase()} />
                <div className="text-[12px] font-medium mt-1 leading-tight"
                  style={{ color:'var(--ink)' }}>{a.title}</div>
                <div className="text-[10px] mt-0.5"
  style={{ color:'var(--ink-3)' }}>
  {a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
</div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="py-6 text-center text-[12px]"
                style={{ color:'var(--ink-4)' }}>No announcements</div>
            )}
          </div>

          {/* Expenses — owners only */}
          {isOwner && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{MONTH_NAMES[currentMonth-1]} Expenses</span>
                <button onClick={() => navigate('/resident/expenses')}
                  className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
                  View →
                </button>
              </div>
              {expenses.slice(0,5).map((e,i) => (
                <div key={e.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background:expColors[i%expColors.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate"
                      style={{ color:'var(--ink)' }}>{e.description}</div>
                  </div>
                  <div className="text-[12px] font-bold"
                    style={{ color:'var(--ink-2)' }}>₹{e.amount.toLocaleString()}</div>
                </div>
              ))}
              {expenses.length > 0 && (
                <div className="flex justify-between px-4 py-2.5"
                  style={{ background:'var(--surface-3)' }}>
                  <span className="text-[11px] font-semibold"
                    style={{ color:'var(--ink-3)' }}>Total</span>
                  <span className="text-[13px] font-bold"
                    style={{ color:'var(--amber)' }}>{fmt(totalExpenses)}</span>
                </div>
              )}
              {expenses.length === 0 && (
                <div className="py-6 text-center text-[12px]"
                  style={{ color:'var(--ink-4)' }}>No expenses this month</div>
              )}
            </div>
          )}

          {/* Visitors — everyone */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Visitors Today</span>
              <button onClick={() => navigate('/resident/visitors')}
                className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>
                All →
              </button>
            </div>
            {myVisitors.length === 0
              ? <div className="py-8 text-center text-[12px]"
                  style={{ color:'var(--ink-4)' }}>No visitors today</div>
              : myVisitors.map(v => (
                <div key={v.id}
                  className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ background:'var(--indigo)' }}>
                    {v.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate"
                      style={{ color:'var(--ink)' }}>{v.name}</div>
                    <div className="text-[10px]"
                      style={{ color:'var(--ink-3)' }}>{v.purpose}</div>
                  </div>
                  <span className="badge"
                    style={v.status==='IN'
                      ? {background:'#ecfdf5',color:'#059669'}
                      : {background:'var(--surface-3)',color:'var(--ink-3)'}}>
                    {v.status==='IN' ? 'In' : 'Out'}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  )
}