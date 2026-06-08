import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import { PlusCircle, Trash2, Receipt } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

function fmt(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

const CAT_COLORS = {
  STAFFING:    '#5b52f0',
  MAINTENANCE: '#059669',
  UTILITIES:   '#0284c7',
  REPAIRS:     '#e11d48',
  UPKEEP:      '#d97706',
  OTHER:       '#7c3aed',
}

// ── Dynamic last 12 months (always current) ───────────────
function getLast12Months() {
  const months = []
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', year: 'numeric' }),
    })
  }
  return months
}

const MONTHS = getLast12Months()

const EMPTY_FORM = {
  description: '',
  category:    'STAFFING',
  amount:      '',
  date:        new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg"
      style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      <div className="font-semibold">{payload[0]?.name}</div>
      <div style={{ color: 'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

export default function Expenses() {
  const { user } = useAuth()

  const [selectedMonth,   setSelectedMonth]   = useState(MONTHS[0])
  const [expenses,        setExpenses]        = useState([])
  const [summary,         setSummary]         = useState({ total: 0, byCategory: {} })
  const [allMonthTotals,  setAllMonthTotals]  = useState({})
  const [loading,         setLoading]         = useState(true)
  const [showAdd,         setShowAdd]         = useState(false)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [submitting,      setSubmitting]      = useState(false)
  const [filterCategory,  setFilterCategory]  = useState('ALL')

  useEffect(() => { fetchExpenses() },       [selectedMonth])
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
        MONTHS.map(m =>
          api.get(`/api/expenses/summary?month=${m.month}&year=${m.year}`)
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
        amount:   parseInt(form.amount),
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

  const total      = summary.total || 0
  const byCategory = Object.entries(summary.byCategory || {}).map(([name, value]) => ({ name, value }))
  const maxMonthTotal = Math.max(...Object.values(allMonthTotals), 1)

  // Category filter
  const filteredExpenses = filterCategory === 'ALL'
    ? expenses
    : expenses.filter(e => e.category === filterCategory)

  // Categories that actually have expenses this month
  const activeCategories = [...new Set(expenses.map(e => e.category))]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Expenses" subtitle="Track society expenses month-wise"
        actions={
          user?.role === 'admin'
            ? <button onClick={() => setShowAdd(true)} className="btn-primary">
                <PlusCircle size={14} /> Add Expense
              </button>
            : null
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">

        {/* Month Tabs — dynamic, always current */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MONTHS.map(m => {
            const mTotal   = allMonthTotals[m.label] || 0
            const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
            return (
              <button key={m.label} onClick={() => { setSelectedMonth(m); setFilterCategory('ALL') }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
                style={{
                  background: isActive ? 'var(--amber)' : 'white',
                  color:      isActive ? 'white' : 'var(--ink-2)',
                  border:     `1px solid ${isActive ? 'var(--amber)' : 'var(--border)'}`,
                  boxShadow:  isActive ? '0 2px 6px rgba(217,119,6,0.25)' : 'none',
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
              <span className="text-[13px] font-bold" style={{ color: 'var(--amber)' }}>{fmt(total)}</span>
            </div>

            {/* Category filter pills */}
            {activeCategories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b"
                style={{ borderColor: 'var(--border)', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setFilterCategory('ALL')}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: filterCategory === 'ALL' ? 'var(--amber)' : 'var(--surface-3)',
                    color:      filterCategory === 'ALL' ? 'white' : 'var(--ink-2)',
                    border:     `1px solid ${filterCategory === 'ALL' ? 'var(--amber)' : 'var(--border)'}`,
                  }}>
                  All ({expenses.length})
                </button>
                {activeCategories.map(cat => (
                  <button key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
                    style={{
                      background: filterCategory === cat ? CAT_COLORS[cat] : 'var(--surface-3)',
                      color:      filterCategory === cat ? 'white' : 'var(--ink-2)',
                      border:     `1px solid ${filterCategory === cat ? CAT_COLORS[cat] : 'var(--border)'}`,
                    }}>
                    {cat} ({expenses.filter(e => e.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>
                {expenses.length === 0
                  ? 'No expenses recorded for this month'
                  : `No ${filterCategory} expenses this month`}
              </div>
            ) : (
              <>
                {filteredExpenses.map(e => (
                  <div key={e.id}
                    className="flex items-center gap-3 px-5 py-3 group transition-colors hover:bg-[var(--surface-2)]"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: CAT_COLORS[e.category] || '#5b52f0' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{e.description}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {e.category} · {e.date}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold" style={{ color: 'var(--ink-2)' }}>{fmt(e.amount)}</div>
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all ml-2"
                        style={{ color: 'var(--rose)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center px-5 py-3"
                  style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--border)' }}>
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>
                    {filterCategory === 'ALL' ? 'Total Expenses' : `${filterCategory} Total`}
                  </span>
                  <span className="text-[18px] font-bold"
                    style={{ color: filterCategory === 'ALL' ? 'var(--amber)' : CAT_COLORS[filterCategory] || 'var(--amber)', letterSpacing: '-0.02em' }}>
                    {fmt(filterCategory === 'ALL' ? total : filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Sidebar: Pie + Monthly Summary */}
          <div className="space-y-3">
            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
                By Category
              </div>
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
                      <button key={c.name}
                        onClick={() => setFilterCategory(f => f === c.name ? 'ALL' : c.name)}
                        className="flex items-center gap-2 w-full rounded-lg px-1 py-0.5 transition-all"
                        style={{
                          background: filterCategory === c.name ? `${CAT_COLORS[c.name]}18` : 'transparent',
                        }}>
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ background: CAT_COLORS[c.name] || '#5b52f0' }} />
                        <span className="flex-1 text-[11px] text-left" style={{ color: 'var(--ink-2)' }}>{c.name}</span>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--ink)' }}>{fmt(c.value)}</span>
                        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                          {total > 0 ? Math.round(c.value / total * 100) : 0}%
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[12px]" style={{ color: 'var(--ink-4)' }}>No data</div>
              )}
            </div>

            <div className="card p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--ink-3)' }}>
                Monthly Summary
              </div>
              {MONTHS.map(m => {
                const mTotal = allMonthTotals[m.label] || 0
                return (
                  <div key={m.label} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-medium w-16" style={{ color: 'var(--ink-3)' }}>
                      {m.label.split(' ')[0]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min((mTotal / maxMonthTotal) * 100, 100)}%`,
                        background: 'var(--amber)',
                      }} />
                    </div>
                    <span className="text-[10px] font-medium w-14 text-right" style={{ color: 'var(--ink-2)' }}>
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
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Description</label>
            <input className="input" placeholder="e.g. Security staff salary"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Category</label>
              <select className="select w-full" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Amount (₹)</label>
              <input className="input" type="number" placeholder="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Date</label>
            <input className="input" type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={submitting} className="btn-primary flex-1 justify-center">
              <Receipt size={14} /> {submitting ? 'Adding...' : 'Add Expense'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
