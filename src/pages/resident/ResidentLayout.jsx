import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, CreditCard, MessageSquareWarning,
  Megaphone, Users, Building2, FileBarChart2, Receipt,
  LogOut, Menu, X, Network, Users2, Shield, MapPin,
  Package, CalendarDays, PackageSearch, ChevronLeft, Home
} from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

const NAV = [
  { label: 'My Home', items: [
    { to: '/resident',               icon: LayoutDashboard,      label: 'Dashboard' },
    { to: '/resident/maintenance',   icon: CreditCard,           label: 'My Maintenance' },
    { to: '/resident/complaints',    icon: MessageSquareWarning, label: 'My Complaints' },
  ]},
  { label: 'Society', items: [
    { to: '/resident/announcements', icon: Megaphone,     label: 'Announcements' },
    { to: '/resident/visitors',      icon: Users,         label: 'Visitors' },
    { to: '/resident/watchman',      icon: Shield,        label: 'Night Patrol' },
    { to: '/resident/nearby',        icon: MapPin,        label: 'Nearby Places' },
    { to: '/resident/expenses',      icon: Receipt,       label: 'Expenses',       ownerOnly: true },
    { to: '/resident/directory',     icon: Building2,     label: 'Flat Directory' },
    { to: '/resident/org-chart',     icon: Network,       label: 'Committee' },
    { to: '/resident/workers',       icon: Users2,        label: 'Workers' },
    { to: '/lost-found',             icon: PackageSearch, label: 'Lost & Found' },
    { to: '/deliveries',             icon: Package,       label: 'Deliveries' },
    { to: '/amenities',              icon: CalendarDays,  label: 'Hall Booking' },
    { to: '/resident/reports',       icon: FileBarChart2, label: 'Reports',        ownerOnly: true },
  ]},
]

const READ_ONLY = [
  '/resident/announcements',
  '/resident/visitors',
  '/resident/expenses',
  '/resident/reports',
  '/resident/directory',
  '/resident/org-chart',
]

// Page title map — shown in mobile topbar
const PAGE_TITLES = {
  '/resident':               'Dashboard',
  '/resident/maintenance':   'My Maintenance',
  '/resident/complaints':    'My Complaints',
  '/resident/announcements': 'Announcements',
  '/resident/visitors':      'Visitors',
  '/resident/watchman':      'Night Patrol',
  '/resident/nearby':        'Nearby Places',
  '/resident/expenses':      'Expenses',
  '/resident/directory':     'Flat Directory',
  '/resident/org-chart':     'Committee',
  '/resident/workers':       'Workers',
  '/resident/reports':       'Reports',
  '/lost-found':             'Lost & Found',
  '/deliveries':             'Deliveries',
  '/amenities':              'Hall Booking',
  '/home':                   'Home',
}

export default function ResidentLayout({ children }) {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (to) =>
    to === '/resident' ? location.pathname === '/resident' : location.pathname.startsWith(to)

  const isOwner  = user?.role === 'owner'
  const isHome   = location.pathname === '/home'
  const isDash   = location.pathname === '/resident'
  // On mobile — show home screen route OR dashboard as "root" (no back button needed)
  const isRoot   = isHome || isDash

  const pageTitle = PAGE_TITLES[location.pathname] || 'Akriti Adeshwar'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] min-w-[220px] bg-white flex-col h-screen overflow-hidden"
        style={{ borderRight: '1px solid var(--border)' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-[9px] font-bold tracking-[2px] uppercase mb-1"
            style={{ color: 'var(--emerald)' }}>
            Resident Portal
          </div>
          <div className="text-[17px] font-bold leading-tight"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Akriti<br />Adeshwar
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full pulse-dot inline-block"
              style={{ background: 'var(--emerald)' }} />
            <span className="text-[10px] font-medium" style={{ color: 'var(--ink-3)' }}>
              Flat {user?.flatNo} · {user?.role === 'owner' ? 'Owner' : 'Tenant'}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV.map(section => (
            <div key={section.label} className="mb-4">
              <div className="text-[9px] font-bold tracking-[1.5px] uppercase px-3 py-1.5"
                style={{ color: 'var(--ink-4)' }}>
                {section.label}
              </div>
              {section.items
                .filter(item => !item.ownerOnly || isOwner)
                .map(item => {
                  const Icon     = item.icon
                  const active   = isActive(item.to)
                  const readOnly = READ_ONLY.includes(item.to)
                  return (
                    <NavLink key={item.to} to={item.to}
                      className={clsx('nav-item mb-0.5', active && 'nav-item-active')}>
                      <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                      <span className="flex-1">{item.label}</span>
                      {readOnly && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--surface-3)', color: 'var(--ink-4)' }}>
                          View
                        </span>
                      )}
                    </NavLink>
                  )
                })}
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 p-3 rounded-xl"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
              style={{ background: 'var(--emerald)' }}>
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                {user?.name}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                Flat {user?.flatNo} · {user?.role === 'owner' ? 'Owner' : 'Tenant'}
              </div>
            </div>
            <button onClick={logout}
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ background: 'var(--rose-lt)', color: 'var(--rose)' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white flex items-center px-3 gap-2"
        style={{ borderBottom: '1px solid var(--border)', height: '56px' }}>

        {isRoot ? (
          /* Home / Dashboard — show app name */
          <>
            <div className="flex-1">
              <div className="text-[9px] font-bold tracking-[2px] uppercase"
                style={{ color: 'var(--emerald)' }}>
                Resident · Flat {user?.flatNo}
              </div>
              <div className="text-[15px] font-bold leading-tight"
                style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                Akriti Adeshwar
              </div>
            </div>
            {/* Home button — navigate to HomeScreen */}
            <button onClick={() => navigate('/home')}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--surface-3)', color: 'var(--indigo)' }}>
              <Home size={17} />
            </button>
            <button onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-2)' }}>
              <Menu size={18} />
            </button>
          </>
        ) : (
          /* Inside a page — show back button + page title */
          <>
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-2)' }}>
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold truncate"
                style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {pageTitle}
              </div>
            </div>
            {/* Home shortcut */}
            <button onClick={() => navigate('/home')}
              className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'var(--surface-3)', color: 'var(--indigo)' }}>
              <Home size={17} />
            </button>
            <button onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-2)' }}>
              <Menu size={18} />
            </button>
          </>
        )}
      </div>

      {/* ── Mobile slide-in menu ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-white w-72 h-full flex flex-col"
            style={{ borderRight: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[9px] font-bold tracking-[2px] uppercase"
                  style={{ color: 'var(--emerald)' }}>Resident Portal</div>
                <div className="text-[16px] font-bold"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  Flat {user?.flatNo}
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Home button inside drawer */}
            <button
              onClick={() => { navigate('/home'); setMobileMenuOpen(false) }}
              className="flex items-center gap-3 mx-3 mt-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)', border: '1px solid var(--indigo-md)' }}>
              <Home size={16} />
              <span className="text-[13px] font-semibold">Home Screen</span>
            </button>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {NAV.map(section => (
                <div key={section.label} className="mb-4">
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase px-3 py-1.5"
                    style={{ color: 'var(--ink-4)' }}>
                    {section.label}
                  </div>
                  {section.items
                    .filter(item => !item.ownerOnly || isOwner)
                    .map(item => {
                      const Icon   = item.icon
                      const active = isActive(item.to)
                      return (
                        <NavLink key={item.to} to={item.to}
                          className={clsx('nav-item mb-0.5', active && 'nav-item-active')}
                          onClick={() => setMobileMenuOpen(false)}>
                          <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                          <span className="flex-1">{item.label}</span>
                        </NavLink>
                      )
                    })}
                </div>
              ))}
            </nav>

            <div className="mx-3 mb-4 p-3 rounded-xl"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ background: 'var(--emerald)' }}>
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                    {user?.name}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                    Flat {user?.flatNo} · {user?.role === 'owner' ? 'Owner' : 'Tenant'}
                  </div>
                </div>
                <button onClick={logout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: 'var(--rose-lt)', color: 'var(--rose)' }}>
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden pt-[56px] md:pt-0">
        {children}
      </main>
    </div>
  )
}