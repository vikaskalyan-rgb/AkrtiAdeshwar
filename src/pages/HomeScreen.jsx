import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard, CreditCard, MessageSquareWarning,
  Megaphone, Users, Building2, Receipt, LogOut,
  Shield, MapPin, Package, CalendarDays, Search,
  Users2, Network, PackageSearch, BarChart3, ClipboardList,
  FileBarChart2, Footprints, Feather, Lightbulb, ShoppingBag,
  CalendarCheck, GraduationCap
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// ADMIN — 6 sections
// ─────────────────────────────────────────────────────────
const ADMIN_CATEGORIES = [
  {
    label: 'My Home',
    color: '#5b52f0',
    emoji: '🏠',
    items: [
      { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',   color: '#5b52f0', bg: '#eeeeff' },
      { to: '/maintenance',     icon: CreditCard,      label: 'Maintenance', color: '#059669', bg: '#ecfdf5' },
      { to: '/expenses',        icon: Receipt,         label: 'Expenses',    color: '#d97706', bg: '#fffbeb' },
      { to: '/reports',         icon: BarChart3,       label: 'Reports',     color: '#7c3aed', bg: '#f3f0ff' },
    ],
  },
  {
    label: 'Community Life',
    color: '#7c3aed',
    emoji: '✨',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      color: '#059669', bg: '#ecfdf5' },
    ],
  },
  {
    label: 'Events & Activities',
    color: '#0284c7',
    emoji: '🎉',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  {
    label: 'Safety & Services',
    color: '#e11d48',
    emoji: '🔒',
    items: [
      { to: '/visitors',   icon: Users,        label: 'Visitors',    color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries', icon: Package,      label: 'Deliveries',  color: '#d97706', bg: '#fffbeb' },
      { to: '/lost-found', icon: PackageSearch,label: 'Lost & Found',color: '#e11d48', bg: '#fff1f2' },
      { to: '/watchman',   icon: Shield,       label: 'Night Patrol',color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  {
    label: 'Information',
    color: '#059669',
    emoji: 'ℹ️',
    items: [
      { to: '/nearby',       icon: MapPin,   label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
      { to: '/flats',        icon: Building2,label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
      { to: '/announcements',icon: Megaphone,label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/workers',      icon: Users2,   label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
      { to: '/org-chart',    icon: Network,  label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
    ],
  },
  {
    label: 'Management',
    color: '#475569',
    emoji: '⚙️',
    items: [
      { to: '/complaints',      icon: MessageSquareWarning, label: 'Complaints', color: '#e11d48', bg: '#fff1f2' },
      { to: '/flat-management', icon: ClipboardList,        label: 'Flat Mgmt',  color: '#7c3aed', bg: '#f3f0ff' },
    ],
  },
]

// ─────────────────────────────────────────────────────────
// OWNER — 5 sections
// ─────────────────────────────────────────────────────────
const OWNER_CATEGORIES = [
  {
    label: 'My Home',
    color: '#5b52f0',
    emoji: '🏠',
    items: [
      { to: '/resident',             icon: LayoutDashboard,      label: 'Dashboard',   color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',  color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/expenses',    icon: Receipt,              label: 'Expenses',    color: '#d97706', bg: '#fffbeb' },
      { to: '/resident/reports',     icon: FileBarChart2,        label: 'Reports',     color: '#7c3aed', bg: '#f3f0ff' },
    ],
  },
  {
    label: 'Community Life',
    color: '#7c3aed',
    emoji: '✨',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      color: '#059669', bg: '#ecfdf5' },
    ],
  },
  {
    label: 'Events & Activities',
    color: '#0284c7',
    emoji: '🎉',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  {
    label: 'Safety & Services',
    color: '#e11d48',
    emoji: '🔒',
    items: [
      { to: '/resident/visitors', icon: Users,        label: 'Visitors',    color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries',        icon: Package,      label: 'Deliveries',  color: '#d97706', bg: '#fffbeb' },
      { to: '/lost-found',        icon: PackageSearch,label: 'Lost & Found',color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/watchman', icon: Shield,       label: 'Night Patrol',color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  {
    label: 'Information',
    color: '#059669',
    emoji: 'ℹ️',
    items: [
      { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/workers',       icon: Users2,   label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
      { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
    ],
  },
]

// ─────────────────────────────────────────────────────────
// TENANT — 5 sections
// ─────────────────────────────────────────────────────────
const TENANT_CATEGORIES = [
  {
    label: 'My Home',
    color: '#5b52f0',
    emoji: '🏠',
    items: [
      { to: '/resident',             icon: LayoutDashboard,      label: 'Dashboard',   color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',  color: '#e11d48', bg: '#fff1f2' },
    ],
  },
  {
    label: 'Community Life',
    color: '#7c3aed',
    emoji: '✨',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      color: '#059669', bg: '#ecfdf5' },
    ],
  },
  {
    label: 'Events & Activities',
    color: '#0284c7',
    emoji: '🎉',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  {
    label: 'Safety & Services',
    color: '#e11d48',
    emoji: '🔒',
    items: [
      { to: '/resident/visitors', icon: Users,        label: 'Visitors',    color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries',        icon: Package,      label: 'Deliveries',  color: '#d97706', bg: '#fffbeb' },
      { to: '/lost-found',        icon: PackageSearch,label: 'Lost & Found',color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/watchman', icon: Shield,       label: 'Night Patrol',color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  {
    label: 'Information',
    color: '#059669',
    emoji: 'ℹ️',
    items: [
      { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/workers',       icon: Users2,   label: 'Workers',        color: '#0284c7', bg: '#f0f9ff' },
      { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      color: '#d97706', bg: '#fffbeb' },
    ],
  },
]

// ── App Icon Button ───────────────────────────────────────
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
      <div
        className="w-[58px] h-[58px] rounded-[16px] flex items-center justify-center"
        style={{
          background: item.bg,
          border: `1px solid ${item.color}20`,
          boxShadow: pressed ? 'none' : `0 2px 8px ${item.color}18`,
        }}>
        <Icon size={25} style={{ color: item.color }} strokeWidth={1.75} />
      </div>
      <span
        className="text-[10px] font-semibold text-center leading-tight"
        style={{ color: 'var(--ink-2)', width: '64px' }}>
        {item.label}
      </span>
    </button>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const now  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hour = now.getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙'

  const categories =
    user?.role === 'admin' ? ADMIN_CATEGORIES :
    user?.role === 'owner' ? OWNER_CATEGORIES : TENANT_CATEGORIES

  const filtered = search.trim() === ''
    ? categories
    : categories
        .map(cat => ({
          ...cat,
          items: cat.items.filter(i =>
            i.label.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter(cat => cat.items.length > 0)

  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'owner' ? 'Owner' : 'Tenant'
  const roleColor = user?.role === 'admin' ? '#5b52f0' : user?.role === 'owner' ? '#059669' : '#0284c7'
  const totalFeatures = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4"
        style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>

        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
              {greeting} {greetEmoji}
            </div>
            <div className="text-[22px] font-bold leading-tight mt-0.5"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              {user?.name?.split(' ')[0]}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${roleColor}18`, color: roleColor }}>
                {roleLabel}
              </span>
              {user?.flatNo && (
                <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                  Flat {user.flatNo}
                </span>
              )}
              <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>
                · {totalFeatures} features
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
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

        {/* Search */}
        <div className="relative">
          <Search size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--ink-4)' }} />
          <input
            className="input pl-9 w-full text-[13px]"
            placeholder="Search features…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Categories ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search size={40} style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-3)' }}>
              No results for "{search}"
            </p>
            <button onClick={() => setSearch('')}
              className="text-[12px] font-semibold" style={{ color: 'var(--indigo)' }}>
              Clear search
            </button>
          </div>
        )}

        {filtered.map(cat => (
          <div key={cat.label}>
            {/* Category label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[3px] h-4 rounded-full flex-shrink-0"
                style={{ background: cat.color }} />
              <span className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: cat.color }}>
                {cat.emoji} {cat.label}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${cat.color}15`, color: cat.color }}>
                {cat.items.length}
              </span>
            </div>

            {/* Icons */}
            <div className="flex flex-wrap gap-x-2 gap-y-4 pl-1">
              {cat.items.map(item => (
                <AppIcon key={item.to} item={item} onPress={to => navigate(to)} />
              ))}
            </div>
          </div>
        ))}

        <div className="h-6" />
      </div>
    </div>
  )
}