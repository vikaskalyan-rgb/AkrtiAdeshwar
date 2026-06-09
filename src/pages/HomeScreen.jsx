import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api/config'
import {
  LayoutDashboard, CreditCard, MessageSquareWarning,
  Megaphone, Users, Building2, Receipt, LogOut,
  Shield, MapPin, Package, CalendarDays,
  Users2, Network, PackageSearch, BarChart3, ClipboardList,
  FileBarChart2, Footprints, Feather, Lightbulb, ShoppingBag,
  CalendarCheck, GraduationCap, Grid3X3, X, Search,
  TrendingUp, AlertCircle, CheckCircle2, ChevronRight,
  Truck, Volume2, Mail
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────
function fmt(n) {
  if (!n) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
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

// ── Feature categories ────────────────────────────────────
const ADMIN_CATEGORIES = [
  { label: 'My Home', color: '#5b52f0', emoji: '🏠', items: [
    { to: '/dashboard',        icon: LayoutDashboard,      label: 'Dashboard',      color: '#5b52f0', bg: '#eeeeff' },
    { to: '/maintenance',      icon: CreditCard,           label: 'Maintenance',    color: '#059669', bg: '#ecfdf5' },
    { to: '/expenses',         icon: Receipt,              label: 'Expenses',       color: '#d97706', bg: '#fffbeb' },
    { to: '/reports',          icon: BarChart3,            label: 'Reports',        color: '#7c3aed', bg: '#f3f0ff' },
  ]},
  { label: 'Community Life', color: '#7c3aed', emoji: '✨', items: [
    { to: '/steps',            icon: Footprints,           label: 'Step Challenge', color: '#5b52f0', bg: '#eeeeff' },
    { to: '/community-board',  icon: Feather,              label: 'Creative Corner',color: '#7c3aed', bg: '#f3f0ff' },
    { to: '/ideas',            icon: Lightbulb,            label: 'Ideas',          color: '#d97706', bg: '#fffbeb' },
    { to: '/buy-sell',         icon: ShoppingBag,          label: 'Buy & Sell',     color: '#059669', bg: '#ecfdf5' },
  ]},
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉', items: [
    { to: '/weekly-activities',icon: CalendarCheck,        label: 'Activities',     color: '#0284c7', bg: '#f0f9ff' },
    { to: '/classes-events',   icon: GraduationCap,        label: 'Classes',        color: '#e11d48', bg: '#fff1f2' },
    { to: '/amenities',        icon: CalendarDays,         label: 'Hall Booking',   color: '#5b52f0', bg: '#eeeeff' },
  ]},
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒', items: [
    { to: '/visitors',         icon: Users,                label: 'Visitors',       color: '#0284c7', bg: '#f0f9ff' },
    { to: '/deliveries',       icon: Package,              label: 'Deliveries',     color: '#d97706', bg: '#fffbeb' },
    { to: '/lost-found',       icon: PackageSearch,        label: 'Lost & Found',   color: '#e11d48', bg: '#fff1f2' },
    { to: '/watchman',         icon: Shield,               label: 'Night Patrol',   color: '#1a1a2e', bg: '#f1f1f9' },
  ]},
  { label: 'Information', color: '#059669', emoji: 'ℹ️', items: [
    { to: '/nearby',           icon: MapPin,               label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
    { to: '/flats',            icon: Building2,            label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
    { to: '/announcements',    icon: Megaphone,            label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
    { to: '/workers',          icon: Users2,               label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
    { to: '/org-chart',        icon: Network,              label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
  ]},
  { label: 'Management', color: '#475569', emoji: '⚙️', items: [
    { to: '/complaints',       icon: MessageSquareWarning, label: 'Complaints',     color: '#e11d48', bg: '#fff1f2' },
    { to: '/flat-management',  icon: ClipboardList,        label: 'Flat Mgmt',      color: '#7c3aed', bg: '#f3f0ff' },
  ]},
]

const OWNER_CATEGORIES = [
  { label: 'My Home', color: '#5b52f0', emoji: '🏠', items: [
    { to: '/resident',             icon: LayoutDashboard,      label: 'Dashboard',      color: '#5b52f0', bg: '#eeeeff' },
    { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance',    color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',     color: '#e11d48', bg: '#fff1f2' },
    { to: '/resident/expenses',    icon: Receipt,              label: 'Expenses',       color: '#d97706', bg: '#fffbeb' },
    { to: '/resident/reports',     icon: FileBarChart2,        label: 'Reports',        color: '#7c3aed', bg: '#f3f0ff' },
  ]},
  { label: 'Community Life', color: '#7c3aed', emoji: '✨', items: [
    { to: '/steps',            icon: Footprints,  label: 'Step Challenge',  color: '#5b52f0', bg: '#eeeeff' },
    { to: '/community-board',  icon: Feather,     label: 'Creative Corner', color: '#7c3aed', bg: '#f3f0ff' },
    { to: '/ideas',            icon: Lightbulb,   label: 'Ideas',           color: '#d97706', bg: '#fffbeb' },
    { to: '/buy-sell',         icon: ShoppingBag, label: 'Buy & Sell',      color: '#059669', bg: '#ecfdf5' },
  ]},
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉', items: [
    { to: '/weekly-activities',icon: CalendarCheck, label: 'Activities',   color: '#0284c7', bg: '#f0f9ff' },
    { to: '/classes-events',   icon: GraduationCap, label: 'Classes',      color: '#e11d48', bg: '#fff1f2' },
    { to: '/amenities',        icon: CalendarDays,  label: 'Hall Booking', color: '#5b52f0', bg: '#eeeeff' },
  ]},
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒', items: [
    { to: '/resident/visitors',icon: Users,        label: 'Visitors',    color: '#0284c7', bg: '#f0f9ff' },
    { to: '/deliveries',       icon: Package,      label: 'Deliveries',  color: '#d97706', bg: '#fffbeb' },
    { to: '/lost-found',       icon: PackageSearch,label: 'Lost & Found',color: '#e11d48', bg: '#fff1f2' },
    { to: '/resident/watchman',icon: Shield,       label: 'Night Patrol',color: '#1a1a2e', bg: '#f1f1f9' },
  ]},
  { label: 'Information', color: '#059669', emoji: 'ℹ️', items: [
    { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
    { to: '/resident/workers',       icon: Users2,   label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
    { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
  ]},
]

const TENANT_CATEGORIES = [
  { label: 'My Home', color: '#5b52f0', emoji: '🏠', items: [
    { to: '/resident',             icon: LayoutDashboard,      label: 'Dashboard',   color: '#5b52f0', bg: '#eeeeff' },
    { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance', color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',  color: '#e11d48', bg: '#fff1f2' },
  ]},
  { label: 'Community Life', color: '#7c3aed', emoji: '✨', items: [
    { to: '/steps',            icon: Footprints,  label: 'Step Challenge',  color: '#5b52f0', bg: '#eeeeff' },
    { to: '/community-board',  icon: Feather,     label: 'Creative Corner', color: '#7c3aed', bg: '#f3f0ff' },
    { to: '/ideas',            icon: Lightbulb,   label: 'Ideas',           color: '#d97706', bg: '#fffbeb' },
    { to: '/buy-sell',         icon: ShoppingBag, label: 'Buy & Sell',      color: '#059669', bg: '#ecfdf5' },
  ]},
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉', items: [
    { to: '/weekly-activities',icon: CalendarCheck, label: 'Activities',   color: '#0284c7', bg: '#f0f9ff' },
    { to: '/classes-events',   icon: GraduationCap, label: 'Classes',      color: '#e11d48', bg: '#fff1f2' },
    { to: '/amenities',        icon: CalendarDays,  label: 'Hall Booking', color: '#5b52f0', bg: '#eeeeff' },
  ]},
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒', items: [
    { to: '/resident/visitors', icon: Users,        label: 'Visitors',    color: '#0284c7', bg: '#f0f9ff' },
    { to: '/deliveries',        icon: Package,      label: 'Deliveries',  color: '#d97706', bg: '#fffbeb' },
    { to: '/lost-found',        icon: PackageSearch,label: 'Lost & Found',color: '#e11d48', bg: '#fff1f2' },
    { to: '/resident/watchman', icon: Shield,       label: 'Night Patrol',color: '#1a1a2e', bg: '#f1f1f9' },
  ]},
  { label: 'Information', color: '#059669', emoji: 'ℹ️', items: [
    { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
    { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
    { to: '/resident/workers',       icon: Users2,   label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
    { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
  ]},
]

// ── App Icon ──────────────────────────────────────────────
function AppIcon({ item, onPress }) {
  const Icon = item.icon
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={() => onPress(item.to)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="flex flex-col items-center gap-1.5 select-none"
      style={{
        transform: pressed ? 'scale(0.86)' : 'scale(1)',
        transition: 'transform 0.1s ease',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <div className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center"
        style={{
          background: item.bg,
          border: `1px solid ${item.color}20`,
          boxShadow: pressed ? 'none' : `0 2px 8px ${item.color}15`,
        }}>
        <Icon size={22} style={{ color: item.color }} strokeWidth={1.75} />
      </div>
      <span className="text-[10px] font-semibold text-center leading-tight"
        style={{ color: 'var(--ink-2)', width: '60px' }}>
        {item.label}
      </span>
    </button>
  )
}

// ── Bottom Sheet ──────────────────────────────────────────
function BottomSheet({ open, onClose, categories, onNavigate, search, setSearch }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const filtered = search.trim() === ''
    ? categories
    : categories.map(cat => ({
        ...cat,
        items: cat.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())),
      })).filter(cat => cat.items.length > 0)

  const totalFeatures = categories.reduce((s, c) => s + c.items.length, 0)

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 40, opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
        background: 'white', borderRadius: '20px 20px 0 0',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 10px' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>All Features</span>
            <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 8 }}>{totalFeatures} features</span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 99,
            background: 'var(--surface-3)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={15} style={{ color: 'var(--ink-3)' }} />
          </button>
        </div>
        {/* Search */}
        <div style={{ padding: '0 16px 12px', position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: 28, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none'
          }} />
          <input className="input" style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
            placeholder="Search features…" value={search}
            onChange={e => setSearch(e.target.value)} autoFocus={false} />
        </div>
        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 40px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', fontSize: 13 }}>
              No results for "{search}"
            </div>
          ) : filtered.map(cat => (
            <div key={cat.label} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 14, borderRadius: 99, background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: `${cat.color}15`, color: cat.color }}>
                  {cat.items.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 8px' }}>
                {cat.items.map(item => (
                  <AppIcon key={item.to} item={item} onPress={(to) => { onClose(); onNavigate(to) }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Custom Tooltip ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-[12px] shadow-lg"
      style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink)' }}>
      <div className="font-semibold mb-0.5">{label}</div>
      <div style={{ color: 'var(--indigo)' }}>{fmt(payload[0]?.value)}</div>
    </div>
  )
}

// ── Admin Home ────────────────────────────────────────────
function AdminHome({ user, navigate }) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const [selMonth,      setSelMonth]      = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [dashboard,     setDashboard]     = useState(null)
  const [trend,         setTrend]         = useState([])
  const [payments,      setPayments]      = useState([])
  const [complaints,    setComplaints]    = useState([])
  const [deliveries,    setDeliveries]    = useState([])
  const [visitors,      setVisitors]      = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [sendingAll,    setSendingAll]    = useState(false)
  const [reminderMsg,   setReminderMsg]   = useState(null)

  useEffect(() => { fetchAll() }, [selMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, trendRes, paymentsRes, complaintsRes, visitorsRes, annRes] =
        await Promise.all([
          api.get(`/api/dashboard?month=${selMonth.month}&year=${selMonth.year}`),
          api.get('/api/dashboard/trend?months=6'),
          api.get(`/api/maintenance?month=${selMonth.month}&year=${selMonth.year}`),
          api.get('/api/complaints'),
          api.get('/api/visitors?todayOnly=true'),
          api.get('/api/announcements'),
        ])
      setDashboard(dashRes.data)
      setTrend(trendRes.data)
      setPayments(paymentsRes.data)
      setComplaints(complaintsRes.data)
      setVisitors(visitorsRes.data)
      setAnnouncements(annRes.data)
     api.get('/api/deliveries')
  .then(r => setDeliveries(r.data.filter(d => d.status === 'PENDING')))
  .catch(() => setDeliveries([]))
    } catch (err) { console.error('AdminHome error:', err) }
    finally { setLoading(false) }
  }

  const handleSendAllReminders = async () => {
    setSendingAll(true)
    try {
      const res = await api.post(`/api/maintenance/reminders?month=${selMonth.month}&year=${selMonth.year}`)
      setReminderMsg(res.data.message || 'Reminders sent!')
      setTimeout(() => setReminderMsg(null), 4000)
    } catch { alert('Failed to send reminders') }
    finally { setSendingAll(false) }
  }

  const maintenance    = dashboard?.maintenance || {}
  const societyFund    = dashboard?.societyFund || {}
  const expensesTotal  = dashboard?.expenses?.total || 0
  const MONTHLY_AMOUNT = maintenance.monthlyAmount || 4200
  const defaulters     = payments.filter(p => p.status === 'UNPAID')
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED')
  const visitorsIn     = visitors.filter(v => v.status === 'IN')
  const pct = maintenance.total
    ? Math.round((maintenance.collected || 0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
    : 0
  const monthLabel = `${MONTH_NAMES[selMonth.month - 1]} ${selMonth.year}`

  const chartData = trend.map(t => ({
    name:      MONTH_NAMES[t.month - 1],
    collected: t.collected || 0,
  }))

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading dashboard...</div>
    </div>
  )

  return (
    <div className="space-y-3">

      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {getLastNMonths(6).map(m => {
          const isActive = m.month === selMonth.month && m.year === selMonth.year
          return (
            <button key={`${m.month}-${m.year}`} onClick={() => setSelMonth(m)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: isActive ? 'var(--indigo)' : 'white',
                color:      isActive ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${isActive ? 'var(--indigo)' : 'var(--border)'}`,
              }}>
              {MONTH_NAMES[m.month - 1]} {m.year}
            </button>
          )
        })}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Collected',  value: fmt(maintenance.collected || 0), sub: `${maintenance.paid || 0}/${maintenance.total || 0} paid`,   color: '#059669', bg: '#ecfdf5' },
          { label: 'Pending',    value: fmt(maintenance.pending   || 0), sub: `${defaulters.length} flats`,                               color: '#e11d48', bg: '#fff1f2' },
          { label: 'Expenses',   value: fmt(expensesTotal),              sub: 'this month',                                               color: '#d97706', bg: '#fffbeb' },
          { label: 'Corpus',     value: fmt(societyFund.currentBalance || 0), sub: 'society fund',                                        color: '#5b52f0', bg: '#eeeeff' },
        ].map(k => (
          <div key={k.label} className="card p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: k.color }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{k.label}</div>
            <div className="text-[20px] font-bold" style={{ color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Community pulse */}
      <div className="card p-3">
        <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>Community Pulse</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Open Complaints', value: openComplaints.length, color: '#e11d48', icon: MessageSquareWarning },
            { label: 'Parcels Waiting', value: deliveries.length,     color: '#d97706', icon: Truck },
            { label: 'Visitors In',     value: visitorsIn.length,      color: '#059669', icon: Users },
            { label: 'Announcements',   value: announcements.length,   color: '#5b52f0', icon: Volume2 },
          ].map(p => {
            const Icon = p.icon
            return (
              <div key={p.label} className="flex flex-col items-center text-center gap-1 p-2 rounded-xl"
                style={{ background: 'var(--surface-2)' }}>
                <Icon size={15} style={{ color: p.color }} strokeWidth={1.75} />
                <div className="text-[16px] font-bold" style={{ color: p.color }}>{p.value}</div>
                <div className="text-[9px] font-semibold leading-tight" style={{ color: 'var(--ink-4)' }}>{p.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Collection progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>
            Collection · {monthLabel}
          </span>
          <span className="text-[12px] font-bold" style={{ color: pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#e11d48' }}>
            {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${pct}%`,
            background: pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#e11d48',
          }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-semibold" style={{ color: '#059669' }}>✓ {maintenance.paid || 0} paid</span>
          <span className="text-[10px] font-semibold" style={{ color: '#e11d48' }}>✗ {defaulters.length} pending</span>
        </div>
      </div>

      {/* Trend chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Monthly Collection</span>
          <button onClick={() => navigate('/reports')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
            Report →
          </button>
        </div>
        <div className="p-3">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-3)', radius: 6 }} />
                <Bar dataKey="collected" radius={[5, 5, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? '#5b52f0' : '#c7c4fc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[90px] flex items-center justify-center text-[12px]" style={{ color: 'var(--ink-4)' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/maintenance')}
          className="card p-3 flex items-center gap-3 text-left transition-colors hover:bg-[var(--indigo-lt)]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfdf5' }}>
            <CreditCard size={16} style={{ color: '#059669' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Maintenance</div>
            <div className="text-[10px]" style={{ color: '#e11d48' }}>{defaulters.length} pending</div>
          </div>
          <ChevronRight size={13} style={{ color: 'var(--ink-4)' }} />
        </button>
        <button onClick={() => navigate('/complaints')}
          className="card p-3 flex items-center gap-3 text-left transition-colors hover:bg-[var(--indigo-lt)]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff1f2' }}>
            <MessageSquareWarning size={16} style={{ color: '#e11d48' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Complaints</div>
            <div className="text-[10px]" style={{ color: '#e11d48' }}>{openComplaints.length} open</div>
          </div>
          <ChevronRight size={13} style={{ color: 'var(--ink-4)' }} />
        </button>
      </div>

      {/* Defaulters with reminder */}
      {defaulters.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Defaulters · {monthLabel}</span>
            <button onClick={handleSendAllReminders} disabled={sendingAll}
              className="btn-primary py-1 px-2 text-[10px]">
              <Mail size={11} />
              {sendingAll ? '...' : 'Email All'}
            </button>
          </div>
          {reminderMsg && (
            <div className="mx-3 mt-2 px-3 py-2 rounded-xl text-[11px] font-medium"
              style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46' }}>
              {reminderMsg}
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {defaulters.slice(0, 8).map(d => (
              <div key={d.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: '#ffe4e6', color: '#9f1239' }}>
                  {d.flatNo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{d.payerName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Unpaid</div>
                </div>
                <div className="text-[11px] font-bold" style={{ color: 'var(--rose)' }}>
                  {fmt(d.amount || MONTHLY_AMOUNT)}
                </div>
              </div>
            ))}
            {defaulters.length > 8 && (
              <button onClick={() => navigate('/maintenance')}
                className="w-full py-2.5 text-[11px] font-semibold text-center"
                style={{ color: 'var(--indigo)' }}>
                View all {defaulters.length} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Announcements</span>
            <button onClick={() => navigate('/announcements')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
              Post +
            </button>
          </div>
          {announcements.slice(0, 3).map(a => (
            <div key={a.id} className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>{a.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Resident Home ─────────────────────────────────────────
function ResidentHome({ user, navigate }) {
  const now     = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const isOwner = user?.role === 'owner'

  const [selMonth,      setSelMonth]      = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [myPayments,    setMyPayments]    = useState([])
  const [myComplaints,  setMyComplaints]  = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [myVisitors,    setMyVisitors]    = useState([])
  const [dashboard,     setDashboard]     = useState(null)
  const [expenses,      setExpenses]      = useState([])
  const [allFlats,      setAllFlats]      = useState([])
  const [allPayments,   setAllPayments]   = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { if (user?.flatNo) fetchAll() }, [user, selMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const requests = [
        api.get(`/api/maintenance/flat/${user.flatNo}`),
        api.get(`/api/complaints/flat/${user.flatNo}`),
        api.get('/api/announcements'),
        api.get(`/api/visitors?flatNo=${user.flatNo}&todayOnly=true`),
        api.get(`/api/dashboard?month=${selMonth.month}&year=${selMonth.year}`),
        api.get('/api/flats'),
        api.get(`/api/maintenance?month=${selMonth.month}&year=${selMonth.year}`),
      ]
      if (isOwner) {
        requests.push(api.get(`/api/expenses?month=${selMonth.month}&year=${selMonth.year}`))
      }
      const results = await Promise.all(requests)
      setMyPayments(results[0].data)
      setMyComplaints(results[1].data)
      setAnnouncements(results[2].data)
      setMyVisitors(results[3].data)
      setDashboard(results[4].data)
      setAllFlats(results[5].data.filter(f => f.floor > 0 && f.wing !== 'Ground'))
      setAllPayments(results[6].data)
      if (isOwner && results[7]) setExpenses(results[7].data)
    } catch (err) { console.error('ResidentHome error:', err) }
    finally { setLoading(false) }
  }

  const maintenance     = dashboard?.maintenance || {}
  const societyFund     = dashboard?.societyFund || {}
  const MONTHLY_AMOUNT  = maintenance.monthlyAmount || 4200
  const currentMonthPay = myPayments.find(p => p.month === selMonth.month && p.year === selMonth.year)
  const openComplaints  = myComplaints.filter(c => c.status !== 'RESOLVED')
  const societyPct      = maintenance.total
    ? Math.round((maintenance.collected || 0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
    : 0
  const monthLabel = `${MONTH_NAMES[selMonth.month - 1]} ${selMonth.year}`
  const expTotal   = expenses.reduce((s, e) => s + e.amount, 0)
  const daysLeft   = new Date(selMonth.year, selMonth.month, 0).getDate() - now.getDate()

  // Payment history for chart — last 6 months sorted oldest first
  const payHistory = [...myPayments]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(p => ({
      name:   MONTH_NAMES[p.month - 1],
      paid:   p.status === 'PAID' ? (p.amount || MONTHLY_AMOUNT) : 0,
      status: p.status,
    }))

  // Flat grid
  const flatGrid = allFlats.map(f => {
    const pay = allPayments.find(p => p.flatNo === f.flatNo)
    return { ...f, payStatus: pay?.status || 'UNPAID' }
  })

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading your dashboard...</div>
    </div>
  )

  return (
    <div className="space-y-3">

      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {getLastNMonths(6).map(m => {
          const isActive = m.month === selMonth.month && m.year === selMonth.year
          return (
            <button key={`${m.month}-${m.year}`} onClick={() => setSelMonth(m)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
              style={{
                background: isActive ? 'var(--emerald)' : 'white',
                color:      isActive ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${isActive ? 'var(--emerald)' : 'var(--border)'}`,
              }}>
              {MONTH_NAMES[m.month - 1]} {m.year}
            </button>
          )
        })}
      </div>

      {/* My payment hero card */}
      <div className="card p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48' }} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>
              My Maintenance · {monthLabel}
            </div>
            <div className="text-[26px] font-bold" style={{
              color: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48',
              letterSpacing: '-0.03em',
            }}>
              {currentMonthPay?.status === 'PAID'
                ? 'Paid ✓'
                : currentMonthPay?.status === 'PARTIAL'
                ? `₹${((currentMonthPay.amount || MONTHLY_AMOUNT) - (currentMonthPay.paidAmount || 0)).toLocaleString()} left`
                : `₹${(currentMonthPay?.amount || MONTHLY_AMOUNT).toLocaleString()}`}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {currentMonthPay?.status === 'PAID'
                ? `Paid on ${currentMonthPay.paidOn} · ${currentMonthPay.paymentMode || 'UPI'}`
                : currentMonthPay?.status === 'PARTIAL'
                ? `Partial — paid ₹${(currentMonthPay.paidAmount || 0).toLocaleString()}`
                : `Due this month${daysLeft > 0 ? ` · ${daysLeft} days left` : ' · Last day!'}`}
            </div>
          </div>
          {currentMonthPay?.status !== 'PAID' && (
            <button onClick={() => navigate('/resident/maintenance')}
              className="btn-primary text-[12px] px-3 py-2 flex-shrink-0">
              Pay Now →
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#e11d48' }} />
          <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>My Complaints</div>
          <div className="text-[20px] font-bold" style={{ color: '#e11d48', letterSpacing: '-0.02em' }}>{openComplaints.length}</div>
          <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>open · {myComplaints.length} total</div>
          <button onClick={() => navigate('/resident/complaints')} className="text-[10px] font-semibold mt-1" style={{ color: 'var(--indigo)' }}>
            View →
          </button>
        </div>
        <div className="card p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#059669' }} />
          <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Society</div>
          <div className="text-[20px] font-bold" style={{ color: '#059669', letterSpacing: '-0.02em' }}>{societyPct}%</div>
          <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{maintenance.paid || 0}/{maintenance.total || 0} paid</div>
        </div>
        {isOwner && (
          <>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#d97706' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Expenses</div>
              <div className="text-[20px] font-bold" style={{ color: '#d97706', letterSpacing: '-0.02em' }}>{fmt(expTotal)}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{expenses.length} entries</div>
              <button onClick={() => navigate('/resident/expenses')} className="text-[10px] font-semibold mt-1" style={{ color: 'var(--indigo)' }}>
                View →
              </button>
            </div>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#5b52f0' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Fund</div>
              <div className="text-[20px] font-bold" style={{ color: '#5b52f0', letterSpacing: '-0.02em' }}>{fmt(societyFund.currentBalance || 0)}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>corpus balance</div>
            </div>
          </>
        )}
        {!isOwner && (
          <>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#0284c7' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Visitors Today</div>
              <div className="text-[20px] font-bold" style={{ color: '#0284c7', letterSpacing: '-0.02em' }}>{myVisitors.length}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{myVisitors.filter(v => v.status === 'IN').length} still in</div>
            </div>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#d97706' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>This Month</div>
              <div className="text-[20px] font-bold" style={{ color: '#d97706', letterSpacing: '-0.02em' }}>{MONTH_NAMES[selMonth.month - 1]}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{daysLeft > 0 ? `${daysLeft} days left` : 'Last day!'}</div>
            </div>
          </>
        )}
      </div>

      {/* Payment history chart + flat grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Payment History</span>
          <button onClick={() => navigate('/resident/maintenance')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
            All →
          </button>
        </div>
        <div className="p-3">
          {payHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={85}>
              <BarChart data={payHistory} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={v => [fmt(v)]} />
                <Bar dataKey="paid" radius={[5, 5, 0, 0]}>
                  {payHistory.map((d, i) => (
                    <Cell key={i} fill={d.status === 'PAID' ? '#059669' : '#fca5a5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[85px] flex items-center justify-center text-[12px]" style={{ color: 'var(--ink-4)' }}>
              No payment history yet
            </div>
          )}

          {/* Society flat grid */}
          {flatGrid.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                  Society Status — {monthLabel}
                </span>
                <div className="flex gap-2">
                  {[['#d1fae5', 'Paid'], ['#ffe4e6', 'Unpaid']].map(([bg, l]) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm" style={{ background: bg }} />
                      <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))' }}>
                {flatGrid.map(f => {
                  const isMe = f.flatNo === user?.flatNo
                  return (
                    <div key={f.flatNo} title={f.flatNo}
                      className="aspect-square rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                      style={{
                        background: isMe ? 'var(--emerald)' : f.payStatus === 'PAID' ? '#d1fae5' : '#ffe4e6',
                        color:      isMe ? 'white' : f.payStatus === 'PAID' ? '#065f46' : '#9f1239',
                        fontSize: '7px', fontWeight: 700,
                        outline: isMe ? '2px solid var(--emerald)' : 'none',
                        outlineOffset: '1px',
                      }}>
                      {f.flatNo}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visitors */}
      {myVisitors.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Visitors Today</span>
            <button onClick={() => navigate('/resident/visitors')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>All →</button>
          </div>
          {myVisitors.slice(0, 3).map(v => (
            <div key={v.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: 'var(--indigo)' }}>
                {v.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{v.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{v.purpose}</div>
              </div>
              <span className="badge" style={v.status === 'IN' ? { background: '#ecfdf5', color: '#059669' } : { background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                {v.status === 'IN' ? 'In' : 'Out'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Announcements</span>
            <button onClick={() => navigate('/resident/announcements')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>All →</button>
          </div>
          {announcements.slice(0, 3).map(a => (
            <div key={a.id} className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>{a.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main HomeScreen ───────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sheetOpen,   setSheetOpen]   = useState(false)
  const [sheetSearch, setSheetSearch] = useState('')

  const now        = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hour       = now.getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙'

  const isAdmin  = user?.role === 'admin'
  const isOwner  = user?.role === 'owner'
  const isSup    = user?.identifier === 'SUP'

  const roleLabel = isSup ? 'Supervisor' : isAdmin ? 'Admin' : isOwner ? 'Owner' : 'Tenant'
  const roleColor = isAdmin ? '#5b52f0' : isOwner ? '#059669' : '#0284c7'
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const categories = isAdmin ? ADMIN_CATEGORIES : isOwner ? OWNER_CATEGORIES : TENANT_CATEGORIES
  const totalFeatures = categories.reduce((s, c) => s + c.items.length, 0)

  const handleSheetClose = () => { setSheetOpen(false); setSheetSearch('') }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3"
        style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px]" style={{ color: 'var(--ink-4)' }}>{greeting} {greetEmoji}</div>
            <div className="text-[20px] font-bold leading-tight mt-0.5"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {user?.name?.split(' ')[0]}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${roleColor}18`, color: roleColor }}>
                {roleLabel}
              </span>
              {user?.flatNo && (
                <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Flat {user.flatNo}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
              style={{ background: roleColor }}>
              {initials}
            </div>
            <button onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#fff1f2', color: '#e11d48' }}
              title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5">
        {isAdmin
          ? <AdminHome user={user} navigate={navigate} />
          : <ResidentHome user={user} navigate={navigate} />
        }

        {/* Bottom spacing for the FAB */}
        <div className="h-24" />
      </div>

      {/* ── All Features FAB — big, impossible to miss ── */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3"
        style={{
          background: 'linear-gradient(to top, var(--surface-2) 70%, transparent)',
          position: 'absolute', bottom: 0, left: 0, right: 0,
          pointerEvents: 'none',
        }}>
        <button
          onClick={() => setSheetOpen(true)}
          style={{ pointerEvents: 'auto' }}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
          style={{
            background: 'var(--indigo)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(91,82,240,0.4)',
            pointerEvents: 'auto',
          }}>
          <Grid3X3 size={20} />
          All Features
          <span className="text-[12px] font-semibold opacity-70 ml-1">({totalFeatures})</span>
        </button>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        categories={categories}
        onNavigate={navigate}
        search={sheetSearch}
        setSearch={setSheetSearch}
      />
    </div>
  )
}
