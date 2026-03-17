import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, FileDown } from 'lucide-react'
import { MonthRangePicker } from '../components/ui/MonthPicker'
import api from '../api/config'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg text-[12px]"
      style={{ background:'white', border:'1px solid var(--border)', color:'var(--ink)' }}>
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color }}>{p.name}: {fmt(p.value)}</div>
      ))}
    </div>
  )
}

function getMonthRange(from, to) {
  const result = []
  let y = from.year
  let m = from.month
  while (y < to.year || (y === to.year && m <= to.month)) {
    result.push({ month: m, year: y })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return result
}

export default function Reports() {
  const now = new Date()

  const [fromMonth, setFromMonth] = useState({
    month: now.getMonth() - 4 <= 0 ? now.getMonth() + 8 : now.getMonth() - 4,
    year:  now.getMonth() - 4 <= 0 ? now.getFullYear() - 1 : now.getFullYear()
  })
  const [toMonth, setToMonth] = useState({
    month: now.getMonth() + 1,
    year:  now.getFullYear()
  })

  const [trendData, setTrendData] = useState([])
  const [flats, setFlats]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchData() }, [fromMonth, toMonth])

  const fetchData = async () => {
    setLoading(true)
    try {
      const months = getMonthRange(fromMonth, toMonth)
      const [trendResults, flatsRes] = await Promise.all([
        Promise.all(months.map(async m => {
          const [mainRes, expRes] = await Promise.all([
            api.get(`/api/maintenance/summary?month=${m.month}&year=${m.year}`),
            api.get(`/api/expenses/summary?month=${m.month}&year=${m.year}`),
          ])
          return {
            ...mainRes.data,
            expenses: expRes.data.total || 0,
            surplus:  (mainRes.data.collected || 0) - (expRes.data.total || 0),
            label: new Date(m.year, m.month - 1)
              .toLocaleString('default', { month: 'short', year: '2-digit' }),
          }
        })),
        api.get('/api/flats'),
      ])
      setTrendData(trendResults)
      setFlats(flatsRes.data.filter(f => f.floor > 0))
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCollected = trendData.reduce((s,d) => s + (d.collected||0), 0)
  const totalExpenses  = trendData.reduce((s,d) => s + (d.expenses||0),  0)
  const totalSurplus   = totalCollected - totalExpenses

  const vacantFlats = flats.filter(f => f.ownerType === 'VACANT')
  const rentedFlats = flats.filter(f => f.ownerType === 'RENTED')
  const ownerFlats  = flats.filter(f => f.ownerType === 'OWNER_OCCUPIED')

  const rangeLabel = `${new Date(fromMonth.year, fromMonth.month-1)
    .toLocaleString('default',{month:'short',year:'numeric'})} → ${new Date(toMonth.year, toMonth.month-1)
    .toLocaleString('default',{month:'short',year:'numeric'})}`

  if (loading) return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Reports" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[14px]" style={{ color:'var(--ink-3)' }}>Loading reports...</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar
        title="Reports"
        subtitle={rangeLabel}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <MonthRangePicker
              from={fromMonth} to={toMonth}
              onFromChange={f => {
                // Ensure from is not after to
                if (f.year < toMonth.year || (f.year === toMonth.year && f.month <= toMonth.month)) {
                  setFromMonth(f)
                }
              }}
              onToChange={t => {
                // Ensure to is not before from
                if (t.year > fromMonth.year || (t.year === fromMonth.year && t.month >= fromMonth.month)) {
                  setToMonth(t)
                }
              }}
            />
            <button onClick={() => alert('Export coming soon!')} className="btn-ghost">
              <FileDown size={14}/><span className="hidden sm:inline"> Export</span>
            </button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {[
            { label:`${trendData.length}M Collection`, value:fmt(totalCollected), icon:TrendingUp,   color:'var(--emerald)', bg:'#ecfdf5' },
            { label:`${trendData.length}M Expenses`,   value:fmt(totalExpenses),  icon:TrendingDown, color:'var(--amber)',   bg:'#fffbeb' },
            { label:`${trendData.length}M Surplus`,    value:fmt(totalSurplus),   icon:TrendingUp,
              color: totalSurplus >= 0 ? 'var(--indigo)' : 'var(--rose)',
              bg:    totalSurplus >= 0 ? '#eeeeff'        : '#fff1f2'
            },
          ].map(s => (
            <div key={s.label} className="card p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:s.bg }}>
                <s.icon size={16} style={{ color:s.color }} />
              </div>
              <div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide"
                  style={{ color:'var(--ink-3)' }}>{s.label}</div>
                <div className="text-[16px] md:text-[20px] font-bold"
                  style={{ color:s.color, letterSpacing:'-0.02em' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="card-title mb-4">Collection vs Expenses</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barSize={14} barGap={4}>
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'var(--ink-3)' }}
                  axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />}
                  cursor={{ fill:'var(--surface-3)', radius:4 }} />
                <Legend wrapperStyle={{ fontSize:11, color:'var(--ink-3)' }} />
                <Bar dataKey="collected" name="Collected" fill="#5b52f0"
                  fillOpacity={0.85} radius={[5,5,0,0]} />
                <Bar dataKey="expenses"  name="Expenses"  fill="#d97706"
                  fillOpacity={0.85} radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <div className="card-title mb-4">Defaulters Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'var(--ink-3)' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'var(--ink-3)' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />}
                  cursor={{ stroke:'var(--border)', strokeWidth:1 }} />
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="unpaid" name="Unpaid Flats"
                  stroke="#e11d48" strokeWidth={2} dot={{ fill:'#e11d48', r:3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Monthly Breakdown</span>
            <span className="text-[11px]" style={{ color:'var(--ink-3)' }}>{rangeLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ background:'var(--surface-3)', borderBottom:'1px solid var(--border)' }}>
                  {['Month','Collected','Pending','Expenses','Surplus','Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color:'var(--ink-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...trendData].reverse().map((d, i) => {
                  const total      = d.total || 40
                  const monthlyAmt = d.monthlyAmount || 4200
                  const pct = total > 0
                    ? Math.round((d.collected||0) / (total * monthlyAmt) * 100)
                    : 0
                  return (
                    <tr key={i}
                      className="hover:bg-[var(--surface-2)] transition-colors"
                      style={{ borderBottom:'1px solid var(--border)' }}>
                      <td className="px-4 py-3 text-[13px] font-bold"
                        style={{ color:'var(--ink)' }}>{d.label}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold"
                        style={{ color:'var(--emerald)' }}>{fmt(d.collected||0)}</td>
                      <td className="px-4 py-3 text-[13px]"
                        style={{ color:'var(--rose)' }}>{fmt(d.pending||0)}</td>
                      <td className="px-4 py-3 text-[13px]"
                        style={{ color:'var(--amber)' }}>{fmt(d.expenses||0)}</td>
                      <td className="px-4 py-3 text-[13px] font-semibold"
                        style={{ color:(d.surplus||0)>=0?'var(--indigo)':'var(--rose)' }}>
                        {(d.surplus||0)>=0?'+':''}{fmt(d.surplus||0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-[40px]"
                            style={{ background:'var(--surface-3)' }}>
                            <div className="h-full rounded-full" style={{
                              width:`${pct}%`,
                              background: pct>=85?'var(--emerald)':pct>=70?'var(--amber)':'var(--rose)'
                            }} />
                          </div>
                          <span className="text-[11px] font-bold"
                            style={{ color:pct>=85?'var(--emerald)':pct>=70?'var(--amber)':'var(--rose)' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Flat composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="card-title mb-4">Flat Composition</div>
            <div className="space-y-3">
              {[
                { label:'Owner Occupied', count:ownerFlats.length, color:'var(--indigo)', bg:'#eeeeff' },
                { label:'Rented',         count:rentedFlats.length, color:'var(--amber)',  bg:'#fffbeb' },
                { label:'Vacant / Unknown', count:vacantFlats.length, color:'var(--rose)', bg:'#fff1f2' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span style={{ color:'var(--ink-2)' }}>{s.label}</span>
                    <span className="font-bold" style={{ color:s.color }}>
                      {s.count} ({flats.length > 0 ? Math.round(s.count/flats.length*100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background:'var(--surface-3)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width:`${flats.length > 0 ? (s.count/flats.length)*100 : 0}%`,
                        background:s.color
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="card-title mb-4">Surplus Trend</div>
            <div className="space-y-2">
              {trendData.map((d,i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium w-14 flex-shrink-0"
                    style={{ color:'var(--ink-3)' }}>{d.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background:'var(--surface-3)' }}>
                    {(d.surplus||0) > 0 && (
                      <div className="h-full rounded-full" style={{
                        width:`${Math.min(
                          ((d.surplus||0) / Math.max(...trendData.map(x=>x.surplus||0),1))*100,
                          100
                        )}%`,
                        background:'var(--indigo)'
                      }} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium w-16 text-right flex-shrink-0"
                    style={{ color:(d.surplus||0)>=0?'var(--indigo)':'var(--rose)' }}>
                    {(d.surplus||0)>=0?'+':''}{fmt(d.surplus||0)}
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