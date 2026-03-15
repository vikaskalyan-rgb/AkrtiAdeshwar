import { months, flats, payments, expenses, getMonthSummary, MONTHLY_MAINTENANCE } from '../data/mockData'
import Topbar from '../components/layout/Topbar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Cell } from 'recharts'
import { FileDown, TrendingUp, TrendingDown } from 'lucide-react'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg text-[12px]" style={{ background:'white', border:'1px solid var(--border)', color:'var(--ink)' }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: {fmt(p.value)}</div>)}
    </div>
  )
}

export default function Reports() {
  const chartData = months.map(m => {
    const s = getMonthSummary(m.month, m.year)
    const exp = expenses.filter(e=>e.month===m.month&&e.year===m.year).reduce((a,e)=>a+e.amount,0)
    return { name:m.label.split(' ')[0], collected:s.collected, expenses:exp, surplus:s.collected-exp }
  })

  const defaultTrend = months.map(m => {
    const s = getMonthSummary(m.month, m.year)
    return { name:m.label.split(' ')[0], unpaid:s.unpaid }
  })

  const top5 = flats.filter(f=>!f.isVacant&&f.floor>0).map(f => {
    const unpaidMonths = payments.filter(p=>p.flatNo===f.flatNo&&p.status!=='paid').length
    return { ...f, unpaidMonths, totalDue:unpaidMonths*MONTHLY_MAINTENANCE }
  }).filter(f=>f.unpaidMonths>0).sort((a,b)=>b.totalDue-a.totalDue).slice(0,5)

  const totalCollected = chartData.reduce((s,d)=>s+d.collected,0)
  const totalExpenses  = chartData.reduce((s,d)=>s+d.expenses,0)
  const surplus = totalCollected - totalExpenses

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Reports" subtitle="6-month overview"
        actions={<button onClick={() => alert('Coming soon!')} className="btn-ghost"><FileDown size={14}/><span className="hidden sm:inline"> Export</span></button>} />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label:'6M Collection', value:fmt(totalCollected), icon:TrendingUp, color:'var(--emerald)', bg:'#ecfdf5' },
            { label:'6M Expenses',   value:fmt(totalExpenses),  icon:TrendingDown, color:'var(--amber)', bg:'#fffbeb' },
            { label:'6M Surplus',    value:fmt(surplus),        icon:TrendingUp, color:surplus>=0?'var(--indigo)':'var(--rose)', bg:surplus>=0?'#eeeeff':'#fff1f2' },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:s.bg }}>
                <s.icon size={16} style={{ color:s.color }} />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[16px] md:text-[20px] font-bold" style={{ color:s.color, letterSpacing:'-0.02em' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="card-title mb-3">Collection vs Expenses</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={16} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill:'var(--surface-3)', radius:4 }} />
                <Legend wrapperStyle={{ fontSize:11, color:'var(--ink-3)' }} />
                <Bar dataKey="collected" name="Collected" fill="#5b52f0" fillOpacity={0.85} radius={[5,5,0,0]} />
                <Bar dataKey="expenses"  name="Expenses"  fill="#d97706" fillOpacity={0.85} radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <div className="card-title mb-3">Defaulters Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={defaultTrend}>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke:'var(--border)', strokeWidth:1 }} />
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="unpaid" name="Unpaid" stroke="#e11d48" strokeWidth={2} dot={{ fill:'#e11d48', r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly table — scrollable on mobile */}
        <div className="card overflow-hidden">
          <div className="card-header"><span className="card-title">Monthly Breakdown</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ background:'var(--surface-3)', borderBottom:'1px solid var(--border)' }}>
                  {['Month','Collected','Pending','Expenses','Surplus','Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((d,i) => {
                  const m = [...months].reverse()[i]
                  const s = getMonthSummary(m.month, m.year)
                  const pct = Math.round(d.collected/(s.total*MONTHLY_MAINTENANCE)*100)
                  return (
                    <tr key={d.name} className="hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color:'var(--ink)' }}>{m.label}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color:'var(--emerald)' }}>{fmt(d.collected)}</td>
                      <td className="px-4 py-3 text-[13px]" style={{ color:'var(--rose)' }}>{fmt(s.pending)}</td>
                      <td className="px-4 py-3 text-[13px]" style={{ color:'var(--amber)' }}>{fmt(d.expenses)}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold" style={{ color:d.surplus>=0?'var(--indigo)':'var(--rose)' }}>{d.surplus>=0?'+':''}{fmt(d.surplus)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-[40px]" style={{ background:'var(--surface-3)' }}>
                            <div className="h-full rounded-full" style={{ width:`${pct}%`, background:pct>=85?'var(--emerald)':pct>=70?'var(--amber)':'var(--rose)' }} />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color:pct>=85?'var(--emerald)':pct>=70?'var(--amber)':'var(--rose)' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top defaulters */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Defaulters</span></div>
          {top5.map((f,i) => (
            <div key={f.flatNo} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors" style={{ borderBottom:'1px solid var(--border)' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background:'var(--surface-3)', color:'var(--ink-3)' }}>{i+1}</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background:'#fff1f2', color:'var(--rose)' }}>{f.flatNo}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color:'var(--ink)' }}>{f.ownerName}</div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{f.wing} Wing · Floor {f.floor}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[14px] font-bold" style={{ color:'var(--rose)' }}>{fmt(f.totalDue)}</div>
                <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{f.unpaidMonths}mo due</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}