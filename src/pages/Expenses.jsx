import { useState, useMemo } from 'react'
import { expenses, months } from '../data/mockData'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { PlusCircle, Trash2, Receipt } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CAT_COLORS = { Staffing:'#5b52f0', Maintenance:'#059669', Utilities:'#0284c7', Repairs:'#e11d48', Upkeep:'#d97706', Other:'#7c3aed' }
const EMPTY_FORM = { description: '', category: 'Staffing', amount: '', date: new Date().toISOString().split('T')[0] }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg" style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      <div className="font-semibold">{payload[0]?.name}</div>
      <div style={{ color: 'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

export default function Expenses() {
  const { user } = useAuth()   // ✅ moved INSIDE the component
  const [selectedMonth, setSelectedMonth] = useState(months[5])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [localExpenses, setLocalExpenses] = useState(expenses)

  const monthExpenses = useMemo(() =>
    localExpenses.filter(e => e.month === selectedMonth.month && e.year === selectedMonth.year),
    [localExpenses, selectedMonth])

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = Object.entries(
    monthExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const handleAdd = () => {
    if (!form.description || !form.amount) return
    setLocalExpenses(prev => [...prev, { id: `EXP${Date.now()}`, ...form, amount: parseInt(form.amount), month: selectedMonth.month, year: selectedMonth.year, addedBy: 'Admin' }])
    setForm(EMPTY_FORM); setShowAdd(false)
  }

  const handleDelete = (id) => { if (confirm('Delete this expense?')) setLocalExpenses(prev => prev.filter(e => e.id !== id)) }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Expenses" subtitle="Track society expenses month-wise"
        actions={user?.role === 'admin' ? <button onClick={() => setShowAdd(true)} className="btn-primary"><PlusCircle size={14}/> Add Expense</button> : null} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {[...months].reverse().map(m => {
            const mTotal = localExpenses.filter(e => e.month === m.month && e.year === m.year).reduce((s, e) => s + e.amount, 0)
            const isActive = m.label === selectedMonth.label
            return (
              <button key={m.label} onClick={() => setSelectedMonth(m)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                style={{ background: isActive ? 'var(--amber)' : 'white', color: isActive ? 'white' : 'var(--ink-2)', border: `1px solid ${isActive ? 'var(--amber)' : 'var(--border)'}`, boxShadow: isActive ? '0 2px 6px rgba(217,119,6,0.25)' : 'none' }}>
                {m.label}
                {mTotal > 0 && <span className="text-[9px]" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--ink-3)' }}>{fmt(mTotal)}</span>}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">{selectedMonth.label} — Expenses</span>
              <span className="text-[13px] font-bold" style={{ color: 'var(--amber)' }}>{fmt(total)}</span>
            </div>
            {monthExpenses.length === 0
              ? <div className="py-16 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>No expenses recorded for this month</div>
              : monthExpenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3 group transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[e.category] || '#5b52f0' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{e.description}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{e.category} · {e.date}</div>
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: 'var(--ink-2)' }}>{fmt(e.amount)}</div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 transition-all ml-2" style={{ color: 'var(--rose)' }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))
            }
            {monthExpenses.length > 0 && (
              <div className="flex justify-between items-center px-5 py-3" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--border)' }}>
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>Total Expenses</span>
                <span className="text-[18px] font-bold" style={{ color: 'var(--amber)', letterSpacing: '-0.02em' }}>{fmt(total)}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>By Category</div>
              {byCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3} dataKey="value">
                        {byCategory.map((entry, i) => <Cell key={i} fill={CAT_COLORS[entry.name] || '#5b52f0'} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {byCategory.map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[c.name] || '#5b52f0' }} />
                        <span className="flex-1 text-[11px]" style={{ color: 'var(--ink-2)' }}>{c.name}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--ink)' }}>{fmt(c.value)}</span>
                        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{Math.round(c.value/total*100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="text-center py-8 text-[12px]" style={{ color: 'var(--ink-4)' }}>No data</div>}
            </div>
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>Monthly Summary</div>
              {months.slice().reverse().map(m => {
                const mTotal = localExpenses.filter(e => e.month === m.month && e.year === m.year).reduce((s,e)=>s+e.amount,0)
                return (
                  <div key={m.label} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium w-16" style={{ color: 'var(--ink-3)' }}>{m.label.split(' ')[0]}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((mTotal/150000)*100, 100)}%`, background: 'var(--amber)' }} />
                    </div>
                    <span className="text-[10px] font-medium w-14 text-right" style={{ color: 'var(--ink-2)' }}>{fmt(mTotal)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Description</label>
            <input className="input" placeholder="e.g. Security staff salary" value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Category</label>
              <select className="select w-full" value={form.category} onChange={e => setForm(f=>({...f, category: e.target.value}))}>
                {Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Amount (₹)</label>
              <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f=>({...f, amount: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Date</label>
            <input className="input" type="date" value={form.date} onChange={e => setForm(f=>({...f, date: e.target.value}))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} className="btn-primary flex-1 justify-center"><Receipt size={14}/> Add Expense</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}