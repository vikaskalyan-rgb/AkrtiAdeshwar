import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar, ChevronLeft, LogOut } from 'lucide-react'

// Home routes — no back button on these
const HOME_ROUTES = ['/home']

export default function Topbar({ title, subtitle, actions }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { logout } = useAuth()

  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const isHome = HOME_ROUTES.includes(location.pathname)

  return (
    <div
      className="flex items-center justify-between px-3 md:px-5 bg-white flex-shrink-0 gap-2"
      style={{ borderBottom: '1px solid var(--border)', minHeight: '56px' }}>

      {/* ── Left: Back button (hidden on home) ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            title="Go back">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* ── Center: Title + subtitle ── */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-[15px] md:text-[17px] font-bold truncate"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[10px] md:text-[11px] mt-0.5 truncate"
            style={{ color: 'var(--ink-3)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right: actions + date + logout ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {actions}

        {/* Date — desktop only */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium"
          style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
          <Calendar size={12} />
          {todayIST}
        </div>

        {/* Logout — always visible except on HomeScreen (HomeScreen has its own) */}
        {!isHome && (
          <button
            onClick={logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}
            title="Sign out">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  )
}