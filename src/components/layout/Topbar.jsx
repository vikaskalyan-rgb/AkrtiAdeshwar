import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calendar, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

const HOME_ROUTES = ['/home']

export default function Topbar({ title, subtitle, actions }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarRef = useRef(null)

  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const isHome = HOME_ROUTES.includes(location.pathname)

  const isAdmin = user?.role === 'admin'
  const isOwner = user?.role === 'owner'
  const isSup   = user?.identifier === 'SUP'
  const roleLabel = isSup ? 'Supervisor' : isAdmin ? 'Admin' : isOwner ? 'Owner' : 'Tenant'
  const roleColor = isAdmin ? '#5b52f0' : isOwner ? '#059669' : '#0284c7'
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-3 md:px-5 bg-white flex-shrink-0 gap-2"
      style={{ borderBottom: '1px solid var(--border)', minHeight: '56px' }}>

      {/* ── Left: Back button ── */}
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
          <p className="text-[10px] md:text-[11px] mt-0.5 truncate" style={{ color: 'var(--ink-3)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Right: actions + date + avatar ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {actions}

        {/* Date — desktop only */}
        <div
          className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium"
          style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
          <Calendar size={12} />
          {todayIST}
        </div>

        {/* Avatar with popover — shown on all pages except home (home has its own) */}
        {!isHome && (
          <div ref={avatarRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarMenuOpen(v => !v)}
              style={{
                width: 36, height: 36, borderRadius: 99,
                background: roleColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
                cursor: 'pointer', border: 'none',
                boxShadow: avatarMenuOpen ? `0 0 0 3px ${roleColor}30` : 'none',
                transition: 'box-shadow 0.15s ease',
              }}>
              {initials}
            </button>

            {/* Popover */}
            {avatarMenuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 100,
                background: 'white', borderRadius: 14,
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 180, padding: 8,
              }}>
                {/* User info */}
                <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {user?.name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>
                    {roleLabel}{user?.flatNo ? ` · Flat ${user.flatNo}` : ''}
                  </div>
                </div>

                {/* Go Back */}
                <button
                  onClick={() => { setAvatarMenuOpen(false); navigate(-1) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--ink-2)', fontSize: 13, fontWeight: 500,
                  }}
                  className="hover:bg-[var(--surface-2)] transition-colors">
                  <ChevronLeft size={15} style={{ color: 'var(--ink-3)' }} />
                  Go Back
                </button>

                {/* Home */}
                <button
                  onClick={() => { setAvatarMenuOpen(false); navigate('/home') }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--ink-2)', fontSize: 13, fontWeight: 500,
                  }}
                  className="hover:bg-[var(--surface-2)] transition-colors">
                  🏠
                  <span>Home</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => { setAvatarMenuOpen(false); logout() }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: '#e11d48', fontSize: 13, fontWeight: 500,
                    marginTop: 2,
                  }}
                  className="hover:bg-[#fff1f2] transition-colors">
                  <LogOut size={15} style={{ color: '#e11d48' }} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
