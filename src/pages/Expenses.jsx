import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { PlusCircle, Trash2, Receipt } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

function fmt(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000) return `₹${(n/1000).toFixed(1)}K`
  return `₹${n}`
}

const CAT_COLORS = {
  STAFFING:'#5b52f0', MAINTENANCE:'#059669', UTILITIES:'#0284c7',
  REPAIRS:'#e11d48', UPKEEP:'#d97706', OTHER:'#7c3aed'
}

const MONTHS = [
  { month:10, year:2024, label:'Oct 2024' },
  { month:11, year:2024, label:'Nov 2024' },
  { month:12, year:2024, label:'Dec 2024' },
  { month:1,  year:2025, label:'Jan 2025' },
  { month:2,  year:2025, label:'Feb 2025' },
  { month:3,  year:2025, label:'Mar 2025' },
  { month:3,  year:2026, label:'Mar 2026' },
]

const EMPTY_FORM = {
  description: '',
  category: 'STAFFING',
  amount: '',
  date: new Date().toISOString().split('T')[0]
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg" style={{ background:'white', border:'1px solid var(--border)', color:'var(--ink)' }}>
      <div className="font-semibold">{payload[0]?.name}</div>
      <div style={{ color:'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

export default function Expenses() {
  const { user } = useAuth()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState({ month: now.getMonth()+1, year: now.getFullYear(), label:'Mar 2026' })
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ total:0, byCategory:{} })
  const [allMonthTotals, setAllMonthTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchExpenses() }, [selectedMonth])
  useEffect(() => { fetchAllMonthTotals() }, [])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get(`/api/expenses?month=${selectedMonth.month}&year=${selectedMonth.year}`),
        api.get(`/api/expenses/summary?month=${selectedMonth.month}&year=${selectedMonth.year}`),
      ])
      setExpenses(expRes.data)
      setSummary(sumRes.data)
    } catch (err) {
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllMonthTotals = async () => {
    try {
      const results = await Promise.all(
        MONTHS.map(m => api.get(`/api/expenses/summary?month=${m.month}&year=${m.year}`)
          .then(r => ({ label: m.label, total: r.data.total || 0 }))
          .catch(() => ({ label: m.label, total: 0 }))
        )
      )
      const totals = {}
      results.forEach(r => { totals[r.label] = r.total })
      setAllMonthTotals(totals)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = async () => {
    if (!form.description || !form.amount) return
    setSubmitting(true)
    try {
      await api.post('/api/expenses', {
        ...form,
        amount: parseInt(form.amount),
        category: form.category.toUpperCase(),
      })
      await fetchExpenses()
      await fetchAllMonthTotals()
      setForm(EMPTY_FORM)
      setShowAdd(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/api/expenses/${id}`)
      await fetchExpenses()
      await fetchAllMonthTotals()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const total = summary.total || 0
  const byCategory = Object.entries(summary.byCategory || {}).map(([name, value]) => ({ name, value }))
  const maxMonthTotal = Math.max(...Object.values(allMonthTotals), 1)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Expenses" subtitle="Track society expenses month-wise"
        actions={
          user?.role === 'admin'
            ? <button onClick={() => setShowAdd(true)} className="btn-primary"><PlusCircle size={14}/> Add Expense</button>
            : null
        }
      />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">

        {/* Month Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
          {[...MONTHS].reverse().map(m => {
            const mTotal = allMonthTotals[m.label] || 0
            const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
            return (
              <button key={m.label} onClick={() => setSelectedMonth(m)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
                style={{
                  background: isActive ? 'var(--amber)' : 'white',
                  color: isActive ? 'white' : 'var(--ink-2)',
                  border: `1px solid ${isActive ? 'var(--amber)' : 'var(--border)'}`,
                  boxShadow: isActive ? '0 2px 6px rgba(217,119,6,0.25)' : 'none'
                }}>
                {m.label}
                {mTotal > 0 && (
                  <span className="text-[9px]" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--ink-3)' }}>
                    {fmt(mTotal)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">

          {/* Expense list */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{selectedMonth.label} — Expenses</span>
              <span className="text-[13px] font-bold" style={{ color:'var(--amber)' }}>{fmt(total)}</span>
            </div>
            {loading ? (
              <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No expenses recorded for this month</div>
            ) : (
              <>
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 group transition-colors hover:bg-[var(--surface-2)]"
                    style={{ borderBottom:'1px solid var(--border)' }}>
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: CAT_COLORS[e.category] || '#5b52f0' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color:'var(--ink)' }}>{e.description}</div>
                      <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>{e.category} · {e.date}</div>
                    </div>
                    <div className="text-[14px] font-bold" style={{ color:'var(--ink-2)' }}>{fmt(e.amount)}</div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all ml-2"
                        style={{ color:'var(--rose)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center px-5 py-3"
                  style={{ background:'var(--surface-3)', borderTop:'1px solid var(--border)' }}>
                  <span className="text-[12px] font-semibold" style={{ color:'var(--ink-3)' }}>Total Expenses</span>
                  <span className="text-[18px] font-bold" style={{ color:'var(--amber)', letterSpacing:'-0.02em' }}>{fmt(total)}</span>
                </div>
              </>
            )}
          </div>

          {/* Sidebar: Pie + Monthly Summary */}
          <div className="space-y-3">
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color:'var(--ink-3)' }}>By Category</div>
              {byCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={byCategory} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3} dataKey="value">
                        {byCategory.map((entry, i) => (
                          <Cell key={i} fill={CAT_COLORS[entry.name] || '#5b52f0'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {byCategory.map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[c.name] || '#5b52f0' }} />
                        <span className="flex-1 text-[11px]" style={{ color:'var(--ink-2)' }}>{c.name}</span>
                        <span className="text-[11px] font-bold" style={{ color:'var(--ink)' }}>{fmt(c.value)}</span>
                        <span className="text-[10px]" style={{ color:'var(--ink-3)' }}>
                          {total > 0 ? Math.round(c.value/total*100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[12px]" style={{ color:'var(--ink-4)' }}>No data</div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color:'var(--ink-3)' }}>Monthly Summary</div>
              {[...MONTHS].reverse().map(m => {
                const mTotal = allMonthTotals[m.label] || 0
                return (
                  <div key={m.label} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium w-16" style={{ color:'var(--ink-3)' }}>
                      {m.label.split(' ')[0]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'var(--surface-3)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min((mTotal/maxMonthTotal)*100, 100)}%`,
                        background: 'var(--amber)'
                      }} />
                    </div>
                    <span className="text-[10px] font-medium w-14 text-right" style={{ color:'var(--ink-2)' }}>
                      {fmt(mTotal)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>Description</label>
            <input className="input" placeholder="e.g. Security staff salary"
              value={form.description} onChange={e => setForm(f=>({...f, description:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>Category</label>
              <select className="select w-full" value={form.category}
                onChange={e => setForm(f=>({...f, category:e.target.value}))}>
                {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>Amount (₹)</label>
              <input className="input" type="number" placeholder="0"
                value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color:'var(--ink-2)' }}>Date</label>
            <input className="input" type="date"
              value={form.date} onChange={e => setForm(f=>({...f, date:e.target.value}))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1 justify-center">
              <Receipt size={14}/> {submitting ? 'Adding...' : 'Add Expense'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}