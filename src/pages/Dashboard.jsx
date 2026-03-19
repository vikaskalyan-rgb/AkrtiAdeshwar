import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { KpiCard, StatusBadge } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import { useNavigate } from 'react-router-dom'
import api from '../api/config'
import { ChevronRight, Calendar, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  return `₹${n.toLocaleString('en-IN')}`
}
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getLastNMonths(n) {
  const result = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return result
}

function MonthSelector({ value, onChange }) {
  const months = getLastNMonths(6)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const display    = value ? `${MONTH_NAMES[value.month - 1]} ${value.year}` : 'Select month'
  const isSelected = (m) => m.month === value?.month && m.year === value?.year

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
        style={{
          background: open ? 'var(--indigo)' : 'white',
          color:      open ? 'white' : 'var(--ink-2)',
          border:     `1px solid ${open ? 'var(--indigo)' : 'var(--border)'}`,
        }}>
        <Calendar size={13} />
        {display}
        <ChevronRight size={12}
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 rounded-2xl p-2 animate-in"
          style={{
            background: 'white', border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(26,26,46,0.12)', minWidth: '180px', right: 0,
          }}>
          {months.map(m => (
            <button key={`${m.month}-${m.year}`}
              onClick={() => { onChange(m); setOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5"
              style={isSelected(m)
                ? { background: 'var(--indigo)', color: 'white' }
                : { background: 'transparent', color: 'var(--ink-2)' }}>
              <span>{MONTH_NAMES[m.month - 1]} {m.year}</span>
              {isSelected(m) && <span className="text-[10px] font-bold opacity-70">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg"
      style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      <div className="font-semibold mb-1">{label}</div>
      <div style={{ color: 'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const now      = new Date()
  const { user } = useAuth()

  const [selectedMonth, setSelectedMonth] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })

  const [dashboard,     setDashboard]     = useState(null)
  const [trend,         setTrend]         = useState([])
  const [payments,      setPayments]      = useState([])
  const [flats,         setFlats]         = useState([])
  const [complaints,    setComplaints]    = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [visitors,      setVisitors]      = useState([])
  const [expenses,      setExpenses]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [sendingAll,    setSendingAll]    = useState(false)
  const [sendingFlat,   setSendingFlat]   = useState(null)
  const [reminderMsg,   setReminderMsg]   = useState(null)

  useEffect(() => { fetchAll() }, [selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, trendRes, paymentsRes, flatsRes, complaintsRes, annRes, visitorsRes, expRes] =
        await Promise.all([
          api.get(`/api/dashboard?month=${selectedMonth.month}&year=${selectedMonth.year}`),
          api.get('/api/dashboard/trend?months=6'),
          api.get(`/api/maintenance?month=${selectedMonth.month}&year=${selectedMonth.year}`),
          api.get('/api/flats'),
          api.get('/api/complaints'),
          api.get('/api/announcements'),
          api.get('/api/visitors?todayOnly=true'),
          api.get(`/api/expenses?month=${selectedMonth.month}&year=${selectedMonth.year}`),
        ])
      setDashboard(dashRes.data)
      setTrend(trendRes.data)
      setPayments(paymentsRes.data)
      setFlats(flatsRes.data.filter(f => f.floor > 0 && f.wing !== 'Ground'))
      setComplaints(complaintsRes.data)
      setAnnouncements(annRes.data)
      setVisitors(visitorsRes.data)
      setExpenses(expRes.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendAllReminders = async () => {
    setSendingAll(true)
    setReminderMsg(null)
    try {
      const res = await api.post(
        `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}`
      )
      setReminderMsg({ text: res.data.message || 'Reminder emails sent!', success: true })
      setTimeout(() => setReminderMsg(null), 5000)
    } catch {
      alert('Failed to send reminders')
    } finally {
      setSendingAll(false)
    }
  }

 const handleSendSingleReminder = async (flatNo, payerName) => {
  setSendingFlat(flatNo)
  try {
    const res = await api.post(
      `/api/maintenance/reminders?month=${selectedMonth.month}&year=${selectedMonth.year}&flatNo=${flatNo}`
    )
    const sent = res.data.sent ?? 0
    setReminderMsg({
      text: sent > 0
        ? `✓ Reminder emailed to flat ${flatNo}`
        : `⚠ No email registered for flat ${flatNo} — update in Flat Management`,
      success: sent > 0,
    })
    setTimeout(() => setReminderMsg(null), 4000)
  } catch {
    alert('Failed to send reminder')
  } finally {
    setSendingFlat(null)
  }
}

  const chartData = trend.map(t => ({
    name:      new Date(t.year, t.month - 1).toLocaleString('default', { month: 'short' }),
    collected: t.collected || 0,
  }))

  const maintenance    = dashboard?.maintenance || {}
  const expensesTotal  = dashboard?.expenses?.total || 0
  const societyFund    = dashboard?.societyFund || {}
  const defaulters     = payments.filter(p => p.status === 'UNPAID')
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED')
  const expColors      = ['#5b52f0','#059669','#d97706','#e11d48','#0284c7','#7c3aed']

  const currentMonthLabel = `${MONTH_NAMES[selectedMonth.month - 1]} ${selectedMonth.year}`

  const flatGrid = flats.map(f => {
    const pay = payments.find(p => p.flatNo === f.flatNo)
    return { ...f, payStatus: pay?.status || 'UNPAID' }
  })

  if (loading) return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Dashboard" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[14px]" style={{ color: 'var(--ink-3)' }}>Loading dashboard...</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar
        title="Dashboard"
        subtitle={`Akriti Adeshwar · ${currentMonthLabel}`}
        actions={
          <MonthSelector value={selectedMonth} onChange={m => setSelectedMonth(m)} />
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4">

        {/* KPI Row */}
        <div className="kpi-grid">
          <KpiCard
            label="Collected This Month"
            value={fmt(maintenance.collected || 0)}
            sub={`${maintenance.paid || 0} of ${maintenance.total || 0} flats paid`}
            pill={`↑ ${maintenance.total
              ? Math.round((maintenance.collected||0) / (maintenance.total * (maintenance.monthlyAmount||4200)) * 100)
              : 0}%`}
            pillType="green" accentColor="#059669"
          />
          <KpiCard
            label="Pending Amount"
            value={fmt(maintenance.pending || 0)}
            sub={`${maintenance.unpaid || 0} unpaid flats`}
            pill="Action needed" pillType="red" accentColor="#e11d48"
          />
          <KpiCard
            label="Monthly Expenses"
            value={fmt(expensesTotal)}
            sub={`${expenses.length} entries`}
            pill="On budget" pillType="amber" accentColor="#d97706"
          />
          <KpiCard
            label="Society Fund"
            value={fmt(societyFund.currentBalance || 382000)}
            sub="Corpus balance"
            pill="Healthy" pillType="purple" accentColor="#5b52f0"
          />
        </div>

        {/* Chart + Defaulters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Monthly Collection</span>
              <button onClick={() => navigate('/reports')}
                className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                Report →
              </button>
            </div>
            <div className="p-3 md:p-4">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} barSize={22}>
                  <XAxis dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
                    axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />}
                    cursor={{ fill: 'var(--surface-3)', radius: 6 }} />
                  <Bar dataKey="collected" radius={[6,6,0,0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i}
                        fill={i === chartData.length - 1 ? '#5b52f0' : '#c7c4fc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Flat Grid */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: 'var(--ink-3)' }}>
                    Flat Status — {currentMonthLabel}
                  </span>
                  <div className="flex gap-2">
                    {[['PAID','Paid','#d1fae5'],['UNPAID','Unpaid','#ffe4e6']].map(([k,l,bg]) => (
                      <div key={k} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: bg }} />
                        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
                  {flatGrid.map(f => {
                    const isPaid = f.payStatus === 'PAID'
                    const isMe   = f.flatNo === user?.flatNo
                    return (
                      <div key={f.flatNo} title={f.flatNo}
                        onClick={() => navigate('/maintenance')}
                        className="aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{
                          background:    isMe ? 'var(--indigo)' : isPaid ? '#d1fae5' : '#ffe4e6',
                          color:         isMe ? 'white'          : isPaid ? '#065f46' : '#9f1239',
                          fontSize:      '7px', fontWeight: 700,
                          outline:       isMe ? '2px solid var(--indigo)' : 'none',
                          outlineOffset: '1px',
                        }}>
                        {f.flatNo}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Defaulters */}
          <div className="card flex flex-col" style={{ maxHeight: '420px' }}>
            <div className="card-header">
              <span className="card-title">Defaulters · {currentMonthLabel}</span>
              <button onClick={handleSendAllReminders} disabled={sendingAll}
                className="btn-primary py-1 px-2 text-[10px]">
                <Mail size={11} />
                {sendingAll ? '...' : 'Email All'}
              </button>
            </div>

            {/* Reminder success message */}
            {reminderMsg && (
  <div className="mx-3 mt-2 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
    style={{
      background: reminderMsg.success ? '#ecfdf5' : '#fffbeb',
      border: `1px solid ${reminderMsg.success ? '#6ee7b7' : '#fde68a'}`,
    }}>
    <Mail size={11} style={{
      color: reminderMsg.success ? 'var(--emerald)' : 'var(--amber)',
      flexShrink: 0
    }} />
    <span className="text-[10px] font-medium"
      style={{ color: reminderMsg.success ? '#065f46' : '#78350f' }}>
      {reminderMsg.text}
    </span>
  </div>
)}

            <div className="flex-1 overflow-y-auto">
              {defaulters.length === 0
                ? <div className="py-8 text-center text-[13px]"
                    style={{ color: 'var(--ink-4)' }}>All paid! 🎉</div>
                : defaulters.map(d => (
                  <div key={d.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: '#ffe4e6', color: '#9f1239' }}>
                      {d.flatNo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate"
                        style={{ color: 'var(--ink)' }}>{d.payerName}</div>
                      <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Unpaid</div>
                    </div>
                    <div className="text-[11px] font-bold mr-1" style={{ color: 'var(--rose)' }}>
                      {fmt(d.amount || 4200)}
                    </div>
                    <button
                      onClick={() => handleSendSingleReminder(d.flatNo, d.payerName)}
                      disabled={sendingFlat === d.flatNo}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-opacity"
                      style={{ background: 'var(--indigo)', opacity: sendingFlat === d.flatNo ? 0.5 : 1 }}>
                      <Mail size={12} />
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Complaints */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Active Complaints</span>
              <button onClick={() => navigate('/complaints')}
                className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                All {complaints.length} →
              </button>
            </div>
            {openComplaints.length === 0
              ? <div className="py-8 text-center text-[13px]"
                  style={{ color: 'var(--ink-4)' }}>No open complaints</div>
              : openComplaints.slice(0,4).map(c => (
                <div key={c.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: c.status==='OPEN' ? 'var(--rose)' : 'var(--amber)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium leading-tight"
                      style={{ color: 'var(--ink)' }}>{c.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                      {c.flatNo} · {c.createdAt}
                    </div>
                  </div>
                  <StatusBadge status={c.status === 'IN_PROGRESS' ? 'in-progress' : c.status?.toLowerCase()} />
                </div>
              ))
            }
          </div>

          {/* Expenses */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{currentMonthLabel} Expenses</span>
              <button onClick={() => navigate('/expenses')}
                className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                View →
              </button>
            </div>
            {expenses.length === 0
              ? <div className="py-8 text-center text-[13px]"
                  style={{ color: 'var(--ink-4)' }}>No expenses this month</div>
              : <>
                  {expenses.slice(0,5).map((e,i) => (
                    <div key={e.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ background: expColors[i % expColors.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate"
                          style={{ color: 'var(--ink)' }}>{e.description}</div>
                        <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{e.category}</div>
                      </div>
                      <div className="text-[12px] font-bold"
                        style={{ color: 'var(--ink-2)' }}>{fmt(e.amount)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-2.5"
                    style={{ background: 'var(--surface-3)' }}>
                    <span className="text-[11px] font-semibold"
                      style={{ color: 'var(--ink-3)' }}>Total</span>
                    <span className="text-[13px] font-bold"
                      style={{ color: 'var(--amber)' }}>{fmt(expensesTotal)}</span>
                  </div>
                </>
            }
          </div>

          {/* Announcements + Visitors */}
          <div className="space-y-3">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Announcements</span>
                <button onClick={() => navigate('/announcements')}
                  className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                  Post +
                </button>
              </div>
              {announcements.length === 0
                ? <div className="py-4 text-center text-[12px]"
                    style={{ color: 'var(--ink-4)' }}>No announcements</div>
                : announcements.slice(0,3).map(a => (
                  <div key={a.id} className="px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <StatusBadge status={a.type?.toLowerCase()} />
                    <div className="text-[12px] font-medium mt-1 leading-tight"
                      style={{ color: 'var(--ink)' }}>{a.title}</div>
                    <div className="text-[10px] mt-0.5"
                      style={{ color: 'var(--ink-3)' }}>{a.postedAt}</div>
                  </div>
                ))
              }
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Today's Visitors</span>
                <button onClick={() => navigate('/visitors')}
                  className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
                  Log +
                </button>
              </div>
              {visitors.length === 0
                ? <div className="py-4 text-center text-[12px]"
                    style={{ color: 'var(--ink-4)' }}>No visitors today</div>
                : visitors.slice(0,3).map(v => (
                  <div key={v.id}
                    className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ background: 'var(--indigo)' }}>
                      {v.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate"
                        style={{ color: 'var(--ink)' }}>{v.name}</div>
                      <div className="text-[10px]"
                        style={{ color: 'var(--ink-3)' }}>{v.flatNo} · {v.purpose}</div>
                    </div>
                    <span className="badge"
                      style={v.status==='IN'
                        ? { background:'#ecfdf5', color:'#059669' }
                        : { background:'var(--surface-3)', color:'var(--ink-3)' }}>
                      {v.status==='IN' ? 'In' : 'Out'}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}