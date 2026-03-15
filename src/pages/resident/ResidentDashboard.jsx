import { useAuth } from '../../context/AuthContext'
import { flats, payments, complaints, announcements, visitors, expenses, societyFund, getMonthSummary, MONTHLY_MAINTENANCE, months } from '../../data/mockData'
import Topbar from '../../components/layout/Topbar'
import { StatusBadge } from '../../components/ui'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CURRENT = { month: 3, year: 2025, label: 'Mar 2025' }

export default function ResidentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const myPayment     = payments.find(p => p.flatNo === user?.flatNo && p.month === CURRENT.month && p.year === CURRENT.year)
  const myComplaints  = complaints.filter(c => c.flatNo === user?.flatNo)
  const openComplaints = myComplaints.filter(c => c.status !== 'resolved')
  const summary       = getMonthSummary(CURRENT.month, CURRENT.year)
  const myRole        = user?.role
  const visibleAnn    = announcements.filter(a => a.audience === 'everyone' || (a.audience === 'owners' && myRole === 'owner') || a.audience === 'residents').slice(0, 3)
  const todayVisitors = visitors.filter(v => v.inTime.startsWith('2025-03-15') && v.flatNo === user?.flatNo)
  const monthExpenses = expenses.filter(e => e.month === CURRENT.month && e.year === CURRENT.year)
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const myPayments = months.map(m => {
    const p = payments.find(pay => pay.flatNo === user?.flatNo && pay.month === m.month && pay.year === m.year)
    return { name: m.label.split(' ')[0], paid: p?.status === 'paid' ? MONTHLY_MAINTENANCE : 0, status: p?.status || 'unpaid' }
  })

  const flatGrid = flats.filter(f => f.floor > 0 && f.wing !== 'Ground').map(f => {
    const pay = payments.find(p => p.flatNo === f.flatNo && p.month === CURRENT.month && p.year === CURRENT.year)
    return { ...f, payStatus: f.isVacant ? 'vacant' : (pay?.status || 'unpaid') }
  })

  const expColors = ['#5b52f0','#059669','#d97706','#e11d48','#0284c7','#7c3aed']

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title={`Hi, ${user?.name?.split(' ')[0]}`} subtitle={`Flat ${user?.flatNo} · ${CURRENT.label}`} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="card p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: myPayment?.status === 'paid' ? 'var(--emerald)' : 'var(--rose)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>My Payment</div>
            <div className="text-[22px] font-bold" style={{ color: myPayment?.status === 'paid' ? 'var(--emerald)' : 'var(--rose)', letterSpacing: '-0.03em' }}>
              {myPayment?.status === 'paid' ? 'Paid ✓' : `₹${MONTHLY_MAINTENANCE.toLocaleString()}`}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {myPayment?.status === 'paid' ? `on ${myPayment.paidOn}` : 'Due this month'}
            </div>
            {myPayment?.status === 'unpaid' && (
              <button onClick={() => navigate('/resident/maintenance')} className="btn-primary mt-2 text-[11px] px-3 py-1.5">Pay Now →</button>
            )}
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--rose)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>My Complaints</div>
            <div className="text-[22px] font-bold" style={{ color: 'var(--rose)', letterSpacing: '-0.03em' }}>{openComplaints.length}</div>
            <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>open · {myComplaints.length} total</div>
            <button onClick={() => navigate('/resident/complaints')} className="mt-2 text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>View →</button>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--emerald)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Society</div>
            <div className="text-[22px] font-bold" style={{ color: 'var(--emerald)', letterSpacing: '-0.03em' }}>{Math.round(summary.collected/(summary.total*MONTHLY_MAINTENANCE)*100)}%</div>
            <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>{summary.paid}/{summary.total} paid</div>
          </div>
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'var(--indigo)' }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Fund</div>
            <div className="text-[22px] font-bold" style={{ color: 'var(--indigo)', letterSpacing: '-0.03em' }}>{fmt(societyFund.currentBalance)}</div>
            <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>corpus</div>
          </div>
        </div>

        {/* Payment history + flat grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Payment History</span>
              <button onClick={() => navigate('/resident/maintenance')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>All →</button>
            </div>
            <div className="p-3 md:p-4">
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={myPayments} barSize={22}>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--ink-3)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill:'var(--surface-3)', radius:6 }} formatter={v => [fmt(v)]} />
                  <Bar dataKey="paid" radius={[6,6,0,0]}>
                    {myPayments.map((d,i) => <Cell key={i} fill={d.status==='paid' ? '#059669' : '#fca5a5'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-3 pt-3" style={{ borderTop:'1px solid var(--border)' }}>
                <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color:'var(--ink-3)' }}>Society Status — {CURRENT.label}</div>
                <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(34px, 1fr))' }}>
                  {flatGrid.map(f => {
                    const isMe = f.flatNo === user?.flatNo
                    const bg = isMe ? 'var(--indigo)' : f.payStatus==='paid' ? '#d1fae5' : '#ffe4e6'
                    const color = isMe ? 'white' : f.payStatus==='paid' ? '#065f46' : '#9f1239'
                    return (
                      <div key={f.flatNo} title={f.flatNo}
                        className="aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ background:bg, color, fontSize:'7px', fontWeight:700, outline: isMe?'2px solid var(--indigo)':'none', outlineOffset:'1px' }}>
                        {f.flatNo}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* My complaints */}
          <div className="card flex flex-col" style={{ maxHeight:'380px' }}>
            <div className="card-header">
              <span className="card-title">My Complaints</span>
              <button onClick={() => navigate('/resident/complaints')} className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>Raise +</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {myComplaints.length===0
                ? <div className="py-8 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No complaints raised</div>
                : myComplaints.map(c => (
                  <div key={c.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: c.status==='resolved'?'var(--emerald)':c.status==='in-progress'?'var(--amber)':'var(--rose)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium leading-tight truncate" style={{ color:'var(--ink)' }}>{c.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>{c.category} · {c.createdAt}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Announcements */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Announcements</span>
              <button onClick={() => navigate('/resident/announcements')} className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>All →</button>
            </div>
            {visibleAnn.map(a => (
              <div key={a.id} className="px-4 py-2.5" style={{ borderBottom:'1px solid var(--border)' }}>
                <StatusBadge status={a.type} />
                <div className="text-[12px] font-medium mt-1 leading-tight" style={{ color:'var(--ink)' }}>{a.title}</div>
                <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>{a.postedAt}</div>
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">March Expenses</span>
              <button onClick={() => navigate('/resident/expenses')} className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>View →</button>
            </div>
            {monthExpenses.map((e,i) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background:expColors[i%expColors.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate" style={{ color:'var(--ink)' }}>{e.description}</div>
                </div>
                <div className="text-[12px] font-bold" style={{ color:'var(--ink-2)' }}>₹{e.amount.toLocaleString()}</div>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5" style={{ background:'var(--surface-3)' }}>
              <span className="text-[11px] font-semibold" style={{ color:'var(--ink-3)' }}>Total</span>
              <span className="text-[13px] font-bold" style={{ color:'var(--amber)' }}>{fmt(totalExpenses)}</span>
            </div>
          </div>

          {/* Visitors */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Visitors Today</span>
              <button onClick={() => navigate('/resident/visitors')} className="text-[11px] font-semibold" style={{ color:'var(--indigo)' }}>All →</button>
            </div>
            {todayVisitors.length===0
              ? <div className="py-8 text-center text-[12px]" style={{ color:'var(--ink-4)' }}>No visitors today</div>
              : todayVisitors.map(v => (
                <div key={v.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background:'var(--indigo)' }}>
                    {v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color:'var(--ink)' }}>{v.name}</div>
                    <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{v.purpose}</div>
                  </div>
                  <span className="badge" style={v.status==='in'?{background:'#ecfdf5',color:'#059669'}:{background:'var(--surface-3)',color:'var(--ink-3)'}}>
                    {v.status==='in'?'In':'Out'}
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