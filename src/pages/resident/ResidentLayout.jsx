import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, CreditCard, MessageSquareWarning,
  Megaphone, Users, Building2, FileBarChart2, Receipt, LogOut, Menu, X, Network, Users2, Shield ,MapPin
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
    { to: '/resident/watchman', icon: Shield, label: 'Night Patrol' },
    { to: '/resident/nearby', icon: MapPin, label: 'Nearby Places' },
    { to: '/resident/expenses',      icon: Receipt,       label: 'Expenses',       ownerOnly: true },
    { to: '/resident/directory',     icon: Building2,     label: 'Flat Directory' },
    { to: '/resident/org-chart',     icon: Network,       label: 'Committee' },
    { to: '/resident/workers', icon: Users2, label: 'Workers' },
    { to: '/resident/reports',       icon: FileBarChart2, label: 'Reports',        ownerOnly: true },
  ]},
]

const BOTTOM_NAV = [
  { to: '/resident',               icon: LayoutDashboard,      label: 'Home' },
  { to: '/resident/maintenance',   icon: CreditCard,           label: 'Pay' },
  { to: '/resident/complaints',    icon: MessageSquareWarning, label: 'Issues' },
  { to: '/resident/announcements', icon: Megaphone,            label: 'Notice' },
  { to: '/resident/directory',     icon: Building2,            label: 'Flats' },
]

const READ_ONLY = [
  '/resident/announcements',
  '/resident/visitors',
  '/resident/expenses',
  '/resident/reports',
  '/resident/directory',
  '/resident/org-chart',
]

export default function ResidentLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (to) =>
    to === '/resident' ? location.pathname === '/resident' : location.pathname.startsWith(to)

  const isOwner = user?.role === 'owner'

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
              style={{ background: 'var(--emerald)' }}></span>
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
                })
              }
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
              <div className="text-[12px] font-semibold truncate"
                style={{ color: 'var(--ink)' }}>{user?.name}</div>
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

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', height: '56px' }}>
        <div>
          <div className="text-[9px] font-bold tracking-[2px] uppercase"
            style={{ color: 'var(--emerald)' }}>
            Resident · Flat {user?.flatNo}
          </div>
          <div className="text-[15px] font-bold leading-tight"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Akriti Adeshwar
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--surface-3)', color: 'var(--ink-2)' }}>
          <Menu size={18} />
        </button>
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
                    })
                  }
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
                  <div className="text-[13px] font-semibold truncate"
                    style={{ color: 'var(--ink)' }}>{user?.name}</div>
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
      <main className="flex-1 overflow-hidden pt-[56px] md:pt-0 pb-[64px] md:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white flex items-center justify-around px-2"
        style={{
          height: 'var(--bottom-nav-h)',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 12px rgba(26,26,46,0.06)'
        }}>
        {BOTTOM_NAV.map(item => {
          const Icon   = item.icon
          const active = isActive(item.to)
          return (
            <NavLink key={item.to} to={item.to}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative"
              style={{ color: active ? 'var(--emerald)' : 'var(--ink-4)' }}>
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold">{item.label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'var(--emerald)' }} />
              )}
            </NavLink>
          )
        })}
        <button onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--ink-4)' }}>
          <Menu size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </div>
  )
}