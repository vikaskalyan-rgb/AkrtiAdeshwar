import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { months, flats, complaints, visitors, announcements, expenses, societyFund, getMonthSummary, MONTHLY_MAINTENANCE, payments } from '../data/mockData'
import { KpiCard, StatusBadge, WhatsAppIcon } from '../components/ui'
import Topbar from '../components/layout/Topbar'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CURRENT = { month: 3, year: 2025, label: 'Mar 2025' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg" style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      <div className="font-semibold mb-1">{label}</div>
      <div style={{ color: 'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const summary = getMonthSummary(CURRENT.month, CURRENT.year)
  const defaulters = payments.filter(p => p.month === CURRENT.month && p.year === CURRENT.year && p.status === 'unpaid')

  const chartData = months.map(m => {
    const s = getMonthSummary(m.month, m.year)
    return { name: m.label.split(' ')[0], collected: s.collected }
  })

  const flatGrid = flats.filter(f => f.floor > 0 && f.wing !== 'Ground').map(f => {
    const pay = payments.find(p => p.flatNo === f.flatNo && p.month === CURRENT.month && p.year === CURRENT.year)
    return { ...f, payStatus: f.isVacant ? 'vacant' : (pay?.status || 'unpaid') }
  })

  const openComplaints = complaints.filter(c => c.status !== 'resolved')
  const todayVisitors  = visitors.filter(v => v.inTime.startsWith('2025-03-15'))
  const monthExpenses  = expenses.filter(e => e.month === CURRENT.month && e.year === CURRENT.year)
  const totalExpenses  = monthExpenses.reduce((s, e) => s + e.amount, 0)

  const statusStyle = {
    paid:   { bg: '#d1fae5', color: '#065f46' },
    unpaid: { bg: '#ffe4e6', color: '#9f1239' },
    vacant: { bg: 'var(--surface-3)', color: 'var(--ink-4)' },
  }

  const expColors = ['#5b52f0','#059669','#d97706','#e11d48','#0284c7','#7c3aed']

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar
        title="Dashboard"
        subtitle={`Akriti Adeshwar · ${CURRENT.label}`}
        actions={
          <select className="select text-[11px]">
            {[...months].reverse().map(m => <option key={m.label}>{m.label}</option>)}
          </select>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4">

        {/* KPI Row */}
        <div className="kpi-grid">
          <KpiCard label="Collected" value={fmt(summary.collected)} sub={`${summary.paid} of ${summary.total} paid`} pill={`↑ ${Math.round(summary.collected/(summary.total*MONTHLY_MAINTENANCE)*100)}%`} pillType="green" accentColor="#059669" />
          <KpiCard label="Pending"   value={fmt(summary.pending)}   sub={`${summary.unpaid} unpaid flats`}           pill="Action needed" pillType="red"    accentColor="#e11d48" />
          <KpiCard label="Expenses"  value={fmt(totalExpenses)}     sub={`${monthExpenses.length} entries`}           pill="On budget"     pillType="amber"  accentColor="#d97706" />
          <KpiCard label="Fund"      value={fmt(societyFund.currentBalance)} sub="Corpus balance"                    pill="Healthy"       pillType="purple" accentColor="#5b52f0" />
        </div>

        {/* Chart + Defaulters — stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Monthly Collection</span>
              <button onClick={() => navigate('/reports')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>Report →</button>
            </div>
            <div className="p-3 md:p-4">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} barSize={22}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-3)', radius: 6 }} />
                  <Bar dataKey="collected" radius={[6,6,0,0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={i === 5 ? '#5b52f0' : '#c7c4fc'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Flat Grid */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Flat Status — {CURRENT.label}</span>
                  <div className="flex gap-2">
                    {[['paid','Paid','#d1fae5','#065f46'],['unpaid','Unpaid','#ffe4e6','#9f1239']].map(([k,l,bg,c]) => (
                      <div key={k} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: bg }} />
                        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))' }}>
                  {flatGrid.map(f => {
                    const s = statusStyle[f.payStatus] || statusStyle.vacant
                    return (
                      <div key={f.flatNo} title={f.flatNo}
                        onClick={() => navigate('/maintenance')}
                        className="aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ background: s.bg, color: s.color, fontSize: '7px', fontWeight: 700 }}>
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
              <span className="card-title">Defaulters · {CURRENT.label}</span>
              <button onClick={() => alert(`Reminders sent to ${defaulters.length}!`)} className="btn-whatsapp py-1 px-2 text-[10px]">
                <WhatsAppIcon size={11} /> All
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {defaulters.map(d => (
                <div key={d.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#ffe4e6', color: '#9f1239' }}>
                    {d.flatNo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{d.payerName}</div>
                    <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Unpaid</div>
                  </div>
                  <div className="text-[11px] font-bold mr-1" style={{ color: 'var(--rose)' }}>{fmt(MONTHLY_MAINTENANCE)}</div>
                  <button onClick={() => alert(`Reminder sent to ${d.payerName}!`)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: '#25D366' }}>
                    <WhatsAppIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row — single col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Complaints */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Active Complaints</span>
              <button onClick={() => navigate('/complaints')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>All {complaints.length} →</button>
            </div>
            {openComplaints.slice(0,4).map(c => (
              <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: c.status === 'open' ? 'var(--rose)' : 'var(--amber)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>{c.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{c.flatNo} · {c.createdAt}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>

          {/* Expenses */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">March Expenses</span>
              <button onClick={() => navigate('/expenses')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>View →</button>
            </div>
            {monthExpenses.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: expColors[i % expColors.length] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>{e.description}</div>
                  <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{e.category}</div>
                </div>
                <div className="text-[12px] font-bold" style={{ color: 'var(--ink-2)' }}>{fmt(e.amount)}</div>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-2.5" style={{ background: 'var(--surface-3)' }}>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}>Total</span>
              <span className="text-[13px] font-bold" style={{ color: 'var(--amber)' }}>{fmt(totalExpenses)}</span>
            </div>
          </div>

          {/* Announcements + Visitors */}
          <div className="space-y-3">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Announcements</span>
                <button onClick={() => navigate('/announcements')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>Post +</button>
              </div>
              {announcements.slice(0,3).map(a => (
                <div key={a.id} className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <StatusBadge status={a.type} />
                  <div className="text-[12px] font-medium mt-1 leading-tight" style={{ color: 'var(--ink)' }}>{a.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{a.postedAt}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Today's Visitors</span>
                <button onClick={() => navigate('/visitors')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>Log +</button>
              </div>
              {todayVisitors.slice(0,3).map(v => (
                <div key={v.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: 'var(--indigo)' }}>
                    {v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{v.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{v.flatNo} · {v.purpose}</div>
                  </div>
                  <span className="badge" style={v.status === 'in' ? { background: '#ecfdf5', color: '#059669' } : { background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                    {v.status === 'in' ? 'In' : 'Out'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}