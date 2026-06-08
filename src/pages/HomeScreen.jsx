import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api/config'
import {
  LayoutDashboard, CreditCard, MessageSquareWarning,
  Megaphone, Users, Building2, Receipt, LogOut,
  Shield, MapPin, Package, CalendarDays, Search,
  Users2, Network, PackageSearch, BarChart3, ClipboardList,
  FileBarChart2, Footprints, Feather, Lightbulb, ShoppingBag,
  CalendarCheck, GraduationCap, Grid3X3, X, Mail,
  TrendingUp, AlertCircle, CheckCircle2, ChevronRight,
  Truck, MessageCircle, Volume2
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────
function fmt(n) {
  if (!n) return '₹0'
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
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

// ── Feature grid data ──────────────────────────────────────
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
    { to: '/resident/visitors',icon: Users,                label: 'Visitors',       color: '#0284c7', bg: '#f0f9ff' },
    { to: '/deliveries',       icon: Package,              label: 'Deliveries',     color: '#d97706', bg: '#fffbeb' },
    { to: '/lost-found',       icon: PackageSearch,        label: 'Lost & Found',   color: '#e11d48', bg: '#fff1f2' },
    { to: '/resident/watchman',icon: Shield,               label: 'Night Patrol',   color: '#1a1a2e', bg: '#f1f1f9' },
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

// ── App Icon ───────────────────────────────────────────────
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

// ── Bottom Sheet ───────────────────────────────────────────
function BottomSheet({ open, onClose, categories, onNavigate, search, setSearch }) {
  const sheetRef = useRef(null)

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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          zIndex: 50,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
        }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>All Features</span>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--surface-3)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} style={{ color: 'var(--ink-3)' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px', position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
            placeholder="Search features…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Feature grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', fontSize: 13 }}>
              No results for "{search}"
            </div>
          ) : (
            filtered.map(cat => (
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
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ── Custom tooltip for chart ───────────────────────────────
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

// ── Admin Home ─────────────────────────────────────────────
function AdminHome({ user, navigate, onOpenSheet }) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const [selectedMonth, setSelectedMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [dashboard,     setDashboard]     = useState(null)
  const [trend,         setTrend]         = useState([])
  const [payments,      setPayments]      = useState([])
  const [complaints,    setComplaints]    = useState([])
  const [deliveries,    setDeliveries]    = useState([])
  const [visitors,      setVisitors]      = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [steps,         setSteps]         = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { fetchAll() }, [selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, trendRes, paymentsRes, complaintsRes, deliveriesRes, visitorsRes, annRes, stepsRes] =
        await Promise.all([
          api.get(`/api/dashboard?month=${selectedMonth.month}&year=${selectedMonth.year}`),
          api.get('/api/dashboard/trend?months=6'),
          api.get(`/api/maintenance?month=${selectedMonth.month}&year=${selectedMonth.year}`),
          api.get('/api/complaints'),
          api.get('/api/deliveries?status=PENDING'),
          api.get('/api/visitors?todayOnly=true'),
          api.get('/api/announcements'),
          api.get('/api/steps/leaderboard/today').catch(() => ({ data: [] })),
        ])
      setDashboard(dashRes.data)
      setTrend(trendRes.data)
      setPayments(paymentsRes.data)
      setComplaints(complaintsRes.data)
      setDeliveries(deliveriesRes.data)
      setVisitors(visitorsRes.data)
      setAnnouncements(annRes.data)
      setSteps(stepsRes.data?.slice(0, 3) || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const maintenance    = dashboard?.maintenance || {}
  const societyFund    = dashboard?.societyFund || {}
  const MONTHLY_AMOUNT = maintenance.monthlyAmount || 4200
  const defaulters     = payments.filter(p => p.status === 'UNPAID')
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED')
  const pct = maintenance.total
    ? Math.round((maintenance.collected || 0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
    : 0

  const chartData = trend.map(t => ({
    name:      MONTH_NAMES[t.month - 1],
    collected: t.collected || 0,
  }))

  const monthLabel = `${MONTH_NAMES[selectedMonth.month - 1]} ${selectedMonth.year}`

  // Activity feed derived from available data
  const activityFeed = [
    ...payments.filter(p => p.status === 'PAID' && p.paidOn).slice(0, 3).map(p => ({
      type: 'payment', icon: CheckCircle2, color: '#059669', bg: '#ecfdf5',
      text: `Flat ${p.flatNo} paid ${fmt(p.paidAmount || p.amount)}`,
      sub: `Maintenance · ${p.paidOn}`,
    })),
    ...deliveries.slice(0, 2).map(d => ({
      type: 'delivery', icon: Package, color: '#d97706', bg: '#fffbeb',
      text: `Parcel for Flat ${d.flatNo}`,
      sub: `Delivery · ${timeAgo(d.arrivedAt || d.createdAt)}`,
    })),
    ...openComplaints.slice(0, 2).map(c => ({
      type: 'complaint', icon: AlertCircle, color: '#e11d48', bg: '#fff1f2',
      text: c.title,
      sub: `Complaint · Flat ${c.flatNo} · ${timeAgo(c.createdAt)}`,
    })),
    ...announcements.slice(0, 1).map(a => ({
      type: 'announcement', icon: Volume2, color: '#5b52f0', bg: '#eeeeff',
      text: a.title,
      sub: `Announcement · ${timeAgo(a.postedAt || a.createdAt)}`,
    })),
  ].slice(0, 5)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-[14px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

      {/* Month selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {getLastNMonths(6).map(m => {
          const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
          return (
            <button key={`${m.month}-${m.year}`}
              onClick={() => setSelectedMonth(m)}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Collected',  value: fmt(maintenance.collected || 0), sub: `${maintenance.paid || 0}/${maintenance.total || 0} paid`, color: '#059669', bg: '#ecfdf5' },
          { label: 'Pending',    value: fmt(maintenance.pending || 0),   sub: `${defaulters.length} flats`,                             color: '#e11d48', bg: '#fff1f2' },
          { label: 'Expenses',   value: fmt(dashboard?.expenses?.total || 0), sub: 'this month',                                        color: '#d97706', bg: '#fffbeb' },
          { label: 'Corpus',     value: fmt(societyFund.currentBalance || 0), sub: 'society fund',                                      color: '#5b52f0', bg: '#eeeeff' },
        ].map(k => (
          <div key={k.label} className="card p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{k.label}</div>
            <div className="text-[18px] font-bold" style={{ color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Community pulse */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Steps Today',    value: steps.reduce((s, w) => s + (w.totalSteps || 0), 0).toLocaleString() || '0', color: '#5b52f0', icon: Footprints },
          { label: 'Open Complaints',value: openComplaints.length,      color: '#e11d48', icon: MessageSquareWarning },
          { label: 'Parcels Waiting',value: deliveries.length,          color: '#d97706', icon: Truck },
          { label: 'Visitors In',    value: visitors.filter(v => v.status === 'IN').length, color: '#059669', icon: Users },
        ].map(p => {
          const Icon = p.icon
          return (
            <div key={p.label} className="card p-2.5 flex flex-col items-center text-center gap-1">
              <Icon size={16} style={{ color: p.color }} strokeWidth={1.75} />
              <div className="text-[15px] font-bold" style={{ color: p.color }}>{p.value}</div>
              <div className="text-[9px] font-semibold leading-tight" style={{ color: 'var(--ink-4)' }}>{p.label}</div>
            </div>
          )
        })}
      </div>

      {/* Collection progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>Collection rate · {monthLabel}</span>
          <span className="text-[12px] font-bold" style={{ color: pct >= 70 ? '#059669' : '#e11d48' }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${pct}%`,
            background: pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#e11d48',
          }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-semibold" style={{ color: '#059669' }}>{maintenance.paid || 0} paid</span>
          <span className="text-[10px] font-semibold" style={{ color: '#e11d48' }}>{defaulters.length} pending</span>
        </div>
      </div>

      {/* Chart + Activity feed */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3">

        {/* Trend chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Collection</span>
            <button onClick={() => navigate('/reports')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
              Report →
            </button>
          </div>
          <div className="p-3">
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
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
          </div>
          <div>
            {activityFeed.length === 0 ? (
              <div className="py-8 text-center text-[12px]" style={{ color: 'var(--ink-4)' }}>No recent activity</div>
            ) : activityFeed.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom: i < activityFeed.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg }}>
                    <Icon size={13} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>{item.text}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{item.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/maintenance')}
          className="card p-3 flex items-center gap-3 hover:bg-[var(--indigo-lt)] transition-colors text-left">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfdf5' }}>
            <CreditCard size={17} style={{ color: '#059669' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Maintenance</div>
            <div className="text-[10px]" style={{ color: '#e11d48' }}>{defaulters.length} pending</div>
          </div>
          <ChevronRight size={13} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
        <button onClick={() => navigate('/complaints')}
          className="card p-3 flex items-center gap-3 hover:bg-[var(--indigo-lt)] transition-colors text-left">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff1f2' }}>
            <MessageSquareWarning size={17} style={{ color: '#e11d48' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Complaints</div>
            <div className="text-[10px]" style={{ color: '#e11d48' }}>{openComplaints.length} open</div>
          </div>
          <ChevronRight size={13} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
      </div>

      {/* Announcements preview */}
      {announcements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Announcements</span>
            <button onClick={() => navigate('/announcements')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>Post +</button>
          </div>
          {announcements.slice(0, 2).map(a => (
            <div key={a.id} className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>{a.title}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }) : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

// ── Resident/Tenant Home ───────────────────────────────────
function ResidentHome({ user, navigate, onOpenSheet }) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const isOwner = user?.role === 'owner'
  const [selectedMonth, setSelectedMonth] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [myPayments,    setMyPayments]    = useState([])
  const [myComplaints,  setMyComplaints]  = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [myVisitors,    setMyVisitors]    = useState([])
  const [dashboard,     setDashboard]     = useState(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { if (user?.flatNo) fetchAll() }, [user, selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        api.get(`/api/maintenance/flat/${user.flatNo}`),
        api.get(`/api/complaints/flat/${user.flatNo}`),
        api.get('/api/announcements'),
        api.get(`/api/visitors?flatNo=${user.flatNo}&todayOnly=true`),
        api.get(`/api/dashboard?month=${selectedMonth.month}&year=${selectedMonth.year}`),
      ])
      setMyPayments(results[0].data)
      setMyComplaints(results[1].data)
      setAnnouncements(results[2].data)
      setMyVisitors(results[3].data)
      setDashboard(results[4].data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const currentMonthPay = myPayments.find(p => p.month === selectedMonth.month && p.year === selectedMonth.year)
  const openComplaints  = myComplaints.filter(c => c.status !== 'RESOLVED')
  const maintenance     = dashboard?.maintenance || {}
  const MONTHLY_AMOUNT  = maintenance.monthlyAmount || 4200
  const societyPct      = maintenance.total
    ? Math.round((maintenance.collected || 0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
    : 0
  const monthLabel = `${MONTH_NAMES[selectedMonth.month - 1]} ${selectedMonth.year}`

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-[14px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

      {/* Month selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {getLastNMonths(6).map(m => {
          const isActive = m.month === selectedMonth.month && m.year === selectedMonth.year
          return (
            <button key={`${m.month}-${m.year}`}
              onClick={() => setSelectedMonth(m)}
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

      {/* My payment status — hero card */}
      <div className="card p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 rounded-full"
          style={{ background: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48' }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>
              My Maintenance · {monthLabel}
            </div>
            <div className="text-[26px] font-bold" style={{
              color: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48',
              letterSpacing: '-0.03em',
            }}>
              {currentMonthPay?.status === 'PAID' ? 'Paid ✓' : `₹${(currentMonthPay?.amount || MONTHLY_AMOUNT).toLocaleString()}`}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {currentMonthPay?.status === 'PAID'
                ? `Paid on ${currentMonthPay.paidOn} · ${currentMonthPay.paymentMode || 'UPI'}`
                : 'Due this month — pay via UPI'}
            </div>
          </div>
          {(!currentMonthPay || currentMonthPay.status !== 'PAID') && (
            <button onClick={() => navigate('/resident/maintenance')} className="btn-primary text-[12px] px-3 py-2">
              Pay Now →
            </button>
          )}
        </div>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3 text-center">
          <div className="text-[18px] font-bold" style={{ color: '#e11d48' }}>{openComplaints.length}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>Open complaints</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[18px] font-bold" style={{ color: '#059669' }}>{societyPct}%</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>Society collected</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-[18px] font-bold" style={{ color: '#5b52f0' }}>{myVisitors.filter(v => v.status === 'IN').length}</div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>Visitors in now</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => navigate('/resident/maintenance')}
          className="card p-3 flex items-center gap-3 text-left hover:bg-[var(--indigo-lt)] transition-colors">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfdf5' }}>
            <CreditCard size={15} style={{ color: '#059669' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Maintenance</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Payment history</div>
          </div>
          <ChevronRight size={12} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
        <button onClick={() => navigate('/resident/complaints')}
          className="card p-3 flex items-center gap-3 text-left hover:bg-[var(--indigo-lt)] transition-colors">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff1f2' }}>
            <MessageSquareWarning size={15} style={{ color: '#e11d48' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Complaints</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{openComplaints.length} open</div>
          </div>
          <ChevronRight size={12} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
        <button onClick={() => navigate('/deliveries')}
          className="card p-3 flex items-center gap-3 text-left hover:bg-[var(--indigo-lt)] transition-colors">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fffbeb' }}>
            <Package size={15} style={{ color: '#d97706' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Deliveries</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Track parcels</div>
          </div>
          <ChevronRight size={12} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
        <button onClick={() => navigate('/steps')}
          className="card p-3 flex items-center gap-3 text-left hover:bg-[var(--indigo-lt)] transition-colors">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eeeeff' }}>
            <Footprints size={15} style={{ color: '#5b52f0' }} />
          </div>
          <div>
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>Step Challenge</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Log your walk</div>
          </div>
          <ChevronRight size={12} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
        </button>
      </div>

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

      <div className="h-4" />
    </div>
  )
}

// ── Main HomeScreen ────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [sheetSearch, setSheetSearch] = useState('')

  const now  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hour = now.getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙'

  const isAdmin  = user?.role === 'admin'
  const isOwner  = user?.role === 'owner'
  const isTenant = user?.role === 'tenant'
  const isSup    = user?.identifier === 'SUP'

  const roleLabel = isAdmin ? (isSup ? 'Supervisor' : 'Admin') : isOwner ? 'Owner' : 'Tenant'
  const roleColor = isAdmin ? '#5b52f0' : isOwner ? '#059669' : '#0284c7'
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  const categories = isAdmin ? ADMIN_CATEGORIES : isOwner ? OWNER_CATEGORIES : TENANT_CATEGORIES

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSheetSearch('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3"
        style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              {greeting} {greetEmoji}
            </div>
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
            {/* All features button */}
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)', border: '1px solid var(--indigo-md)' }}>
              <Grid3X3 size={13} />
              <span className="hidden sm:inline">All Features</span>
            </button>
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

      {/* ── Content ── */}
      {isAdmin
        ? <AdminHome user={user} navigate={navigate} onOpenSheet={() => setSheetOpen(true)} />
        : <ResidentHome user={user} navigate={navigate} onOpenSheet={() => setSheetOpen(true)} />
      }

      {/* ── Bottom Sheet ── */}
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
