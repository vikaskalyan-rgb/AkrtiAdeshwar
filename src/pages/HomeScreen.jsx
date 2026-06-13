import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api/config'
import {
  CreditCard, MessageSquareWarning, Megaphone, Users, Building2,
  Receipt, LogOut, Shield, MapPin, Package, CalendarDays,
  Users2, Network, PackageSearch, BarChart3, ClipboardList,
  FileBarChart2, Footprints, Feather, Lightbulb, ShoppingBag,
  CalendarCheck, GraduationCap, X, ChevronRight, ChevronLeft,
  Truck, Volume2, Mail, Car
} from 'lucide-react'

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

// ── Sections data ─────────────────────────────────────────
const ADMIN_SECTIONS = [
  { label: 'Maintenance', color: '#059669', emoji: '💳',
    desc: 'Payments, expenses, reports, flat management',
    items: [
      { to: '/maintenance',     icon: CreditCard,           label: 'Maintenance',  desc: 'Track and collect monthly maintenance payments',    color: '#059669', bg: '#ecfdf5' },
      { to: '/expenses',        icon: Receipt,              label: 'Expenses',     desc: 'Track and manage society expenses',                color: '#d97706', bg: '#fffbeb' },
      { to: '/reports',         icon: BarChart3,            label: 'Reports',      desc: 'Financial reports and collection summaries',       color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/complaints',      icon: MessageSquareWarning, label: 'Complaints',   desc: 'Manage and resolve resident complaints',           color: '#e11d48', bg: '#fff1f2' },
      { to: '/flat-management', icon: ClipboardList,        label: 'Flat Mgmt',    desc: 'Update resident and owner details',                color: '#7c3aed', bg: '#f3f0ff' },
    ],
  },
  { label: 'Community Life', color: '#7c3aed', emoji: '✨',
    desc: 'Step challenge, creative corner, ideas, buy & sell',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  desc: 'Log your walks and compete on the leaderboard',     color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', desc: 'Share poems, stories and creative content',         color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           desc: 'Suggest improvements for the apartment',            color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      desc: 'Buy or sell items within the apartment',            color: '#059669', bg: '#ecfdf5' },
    ],
  },
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉',
    desc: 'Activities, classes, hall booking',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   desc: 'Weekly activities and RSVP for events',            color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      desc: 'Yoga, fitness classes and learning sessions',       color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', desc: 'Book the community hall for events',                color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒',
    desc: 'Visitors, deliveries, parking, lost & found, night patrol',
    items: [
      { to: '/visitors',   icon: Users,        label: 'Visitors',    desc: 'Log and track visitor entries and exits',           color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries', icon: Package,      label: 'Deliveries',  desc: 'Track parcels and courier arrivals',                color: '#d97706', bg: '#fffbeb' },
      { to: '/parking',    icon: Car,          label: 'Parking',     desc: 'View and manage the 3D parking layout',             color: '#5b52f0', bg: '#eeeeff' },
      { to: '/lost-found', icon: PackageSearch,label: 'Lost & Found',desc: 'Report or find lost items in the apartment',        color: '#e11d48', bg: '#fff1f2' },
      { to: '/watchman',   icon: Shield,       label: 'Night Patrol',desc: 'Night security patrol logs and schedules',          color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  { label: 'Information', color: '#059669', emoji: 'ℹ️',
    desc: 'Nearby places, flat directory, announcements, workers, committee',
    items: [
      { to: '/nearby',        icon: MapPin,   label: 'Nearby Places',  desc: 'Restaurants, hospitals, schools near the apartment', color: '#059669', bg: '#ecfdf5' },
      { to: '/flats',         icon: Building2,label: 'Flat Directory', desc: 'Contact details of all residents',                  color: '#059669', bg: '#ecfdf5' },
      { to: '/announcements', icon: Megaphone,label: 'Announcements',  desc: 'Important notices from the committee',              color: '#5b52f0', bg: '#eeeeff' },
      { to: '/workers',       icon: Users2,   label: 'Workers',        desc: 'Plumbers, electricians and maintenance staff',      color: '#0284c7', bg: '#f0f9ff' },
      { to: '/org-chart',     icon: Network,  label: 'Committee',      desc: 'Apartment committee members and contacts',          color: '#d97706', bg: '#fffbeb' },
    ],
  },
]

const OWNER_SECTIONS = [
  { label: 'Maintenance', color: '#059669', emoji: '💳',
    desc: 'Monthly payments, complaints, expenses, reports',
    items: [
      { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance', desc: 'Pay and track your monthly maintenance',              color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',  desc: 'Raise and track your complaints',                     color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/expenses',    icon: Receipt,              label: 'Expenses',    desc: 'View society expenses and financial reports',          color: '#d97706', bg: '#fffbeb' },
      { to: '/resident/reports',     icon: FileBarChart2,        label: 'Reports',     desc: 'Your payment history and reports',                    color: '#7c3aed', bg: '#f3f0ff' },
    ],
  },
  { label: 'Community Life', color: '#7c3aed', emoji: '✨',
    desc: 'Step challenge, creative corner, ideas, buy & sell',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  desc: 'Log your walks and compete on the leaderboard',     color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', desc: 'Share poems, stories and creative content',         color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           desc: 'Suggest improvements for the apartment',            color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      desc: 'Buy or sell items within the apartment',            color: '#059669', bg: '#ecfdf5' },
    ],
  },
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉',
    desc: 'Activities, classes, hall booking',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   desc: 'Weekly activities and RSVP for events',            color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      desc: 'Yoga, fitness classes and learning sessions',       color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', desc: 'Book the community hall for events',                color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒',
    desc: 'Visitors, deliveries, parking, lost & found, night patrol',
    items: [
      { to: '/resident/visitors', icon: Users,        label: 'Visitors',    desc: 'Log and track visitor entries and exits',           color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries',        icon: Package,      label: 'Deliveries',  desc: 'Track parcels and courier arrivals',                color: '#d97706', bg: '#fffbeb' },
      { to: '/parking',           icon: Car,          label: 'Parking',     desc: 'View your parking slot and add vehicles',           color: '#5b52f0', bg: '#eeeeff' },
      { to: '/lost-found',        icon: PackageSearch,label: 'Lost & Found',desc: 'Report or find lost items in the apartment',        color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/watchman', icon: Shield,       label: 'Night Patrol',desc: 'Night security patrol logs',                        color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  { label: 'Information', color: '#059669', emoji: 'ℹ️',
    desc: 'Nearby places, flat directory, announcements, workers, committee',
    items: [
      { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  desc: 'Restaurants, hospitals, schools near the apartment', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', desc: 'Contact details of all residents',                  color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  desc: 'Important notices from the committee',              color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/workers',       icon: Users2,   label: 'Workers',        desc: 'Plumbers, electricians and maintenance staff',      color: '#0284c7', bg: '#f0f9ff' },
      { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      desc: 'Apartment committee members and contacts',          color: '#d97706', bg: '#fffbeb' },
    ],
  },
]

const TENANT_SECTIONS = [
  { label: 'Maintenance', color: '#059669', emoji: '💳',
    desc: 'Monthly payments and complaints',
    items: [
      { to: '/resident/maintenance', icon: CreditCard,           label: 'Maintenance', desc: 'Pay and track your monthly maintenance',   color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/complaints',  icon: MessageSquareWarning, label: 'Complaints',  desc: 'Raise and track your complaints',          color: '#e11d48', bg: '#fff1f2' },
    ],
  },
  { label: 'Community Life', color: '#7c3aed', emoji: '✨',
    desc: 'Step challenge, creative corner, ideas, buy & sell',
    items: [
      { to: '/steps',           icon: Footprints,  label: 'Step Challenge',  desc: 'Log your walks and compete on the leaderboard',     color: '#5b52f0', bg: '#eeeeff' },
      { to: '/community-board', icon: Feather,     label: 'Creative Corner', desc: 'Share poems, stories and creative content',         color: '#7c3aed', bg: '#f3f0ff' },
      { to: '/ideas',           icon: Lightbulb,   label: 'Ideas',           desc: 'Suggest improvements for the apartment',            color: '#d97706', bg: '#fffbeb' },
      { to: '/buy-sell',        icon: ShoppingBag, label: 'Buy & Sell',      desc: 'Buy or sell items within the apartment',            color: '#059669', bg: '#ecfdf5' },
    ],
  },
  { label: 'Events & Activities', color: '#0284c7', emoji: '🎉',
    desc: 'Activities, classes, hall booking',
    items: [
      { to: '/weekly-activities', icon: CalendarCheck, label: 'Activities',   desc: 'Weekly activities and RSVP for events',            color: '#0284c7', bg: '#f0f9ff' },
      { to: '/classes-events',    icon: GraduationCap, label: 'Classes',      desc: 'Yoga, fitness classes and learning sessions',       color: '#e11d48', bg: '#fff1f2' },
      { to: '/amenities',         icon: CalendarDays,  label: 'Hall Booking', desc: 'Book the community hall for events',                color: '#5b52f0', bg: '#eeeeff' },
    ],
  },
  { label: 'Safety & Services', color: '#e11d48', emoji: '🔒',
    desc: 'Visitors, deliveries, parking, lost & found, night patrol',
    items: [
      { to: '/resident/visitors', icon: Users,        label: 'Visitors',    desc: 'Log and track visitor entries and exits',           color: '#0284c7', bg: '#f0f9ff' },
      { to: '/deliveries',        icon: Package,      label: 'Deliveries',  desc: 'Track parcels and courier arrivals',                color: '#d97706', bg: '#fffbeb' },
      { to: '/parking',           icon: Car,          label: 'Parking',     desc: 'View your parking slot and add vehicles',           color: '#5b52f0', bg: '#eeeeff' },
      { to: '/lost-found',        icon: PackageSearch,label: 'Lost & Found',desc: 'Report or find lost items in the apartment',        color: '#e11d48', bg: '#fff1f2' },
      { to: '/resident/watchman', icon: Shield,       label: 'Night Patrol',desc: 'Night security patrol logs',                        color: '#1a1a2e', bg: '#f1f1f9' },
    ],
  },
  { label: 'Information', color: '#059669', emoji: 'ℹ️',
    desc: 'Nearby places, flat directory, announcements, workers, committee',
    items: [
      { to: '/resident/nearby',        icon: MapPin,   label: 'Nearby Places',  desc: 'Restaurants, hospitals, schools near the apartment', color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/directory',     icon: Building2,label: 'Flat Directory', desc: 'Contact details of all residents',                  color: '#059669', bg: '#ecfdf5' },
      { to: '/resident/announcements', icon: Megaphone,label: 'Announcements',  desc: 'Important notices from the committee',              color: '#5b52f0', bg: '#eeeeff' },
      { to: '/resident/workers',       icon: Users2,   label: 'Workers',        desc: 'Plumbers, electricians and maintenance staff',      color: '#0284c7', bg: '#f0f9ff' },
      { to: '/resident/org-chart',     icon: Network,  label: 'Committee',      desc: 'Apartment committee members and contacts',          color: '#d97706', bg: '#fffbeb' },
    ],
  },
]

// ── Announcements Sheet ───────────────────────────────────
function AnnouncementsSheet({ open, onClose, announcements, onNavigate, isAdmin }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const announcementsRoute = isAdmin ? '/announcements' : '/resident/announcements'

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
        maxHeight: '75vh', display: 'flex', flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eeeeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={17} style={{ color: '#5b52f0' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Announcements</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>{announcements.length} total</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin && (
              <button
                onClick={() => { onClose(); onNavigate(announcementsRoute) }}
                className="btn-primary text-[11px] px-3 py-1.5">
                Post +
              </button>
            )}
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 99,
              background: 'var(--surface-3)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <X size={15} style={{ color: 'var(--ink-3)' }} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink-4)', fontSize: 13 }}>No announcements yet</div>
          ) : announcements.map((a, idx) => (
            <div key={a.id} style={{ padding: '14px 16px', borderBottom: idx < announcements.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 99, flexShrink: 0, marginTop: 5,
                  background: a.type === 'URGENT' ? '#e11d48' : a.type === 'EVENT' ? '#0284c7' : '#5b52f0',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {a.type && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '1px 6px', borderRadius: 99,
                      background: a.type === 'URGENT' ? '#fff1f2' : a.type === 'EVENT' ? '#f0f9ff' : '#eeeeff',
                      color: a.type === 'URGENT' ? '#e11d48' : a.type === 'EVENT' ? '#0284c7' : '#5b52f0',
                      marginBottom: 4, display: 'inline-block',
                    }}>{a.type}</span>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{a.title}</div>
                  {a.content && (
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 4 }}>{a.content}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {a.postedAt ? new Date(a.postedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Section Sheet ─────────────────────────────────────────
function SectionSheet({ open, section, onClose, onNavigate }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!section) return null

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
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e2e8f0' }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${section.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              {section.emoji}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{section.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>{section.items.length} features</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 99,
            background: 'var(--surface-3)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <X size={15} style={{ color: 'var(--ink-3)' }} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
          {section.items.map((item, idx) => {
            const Icon = item.icon
            return (
              <button key={item.to}
                onClick={() => { onClose(); onNavigate(item.to) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)] text-left"
                style={{ borderBottom: idx < section.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: item.bg, border: `1px solid ${item.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} style={{ color: item.color }} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ── Sections Card ─────────────────────────────────────────
function SectionsCard({ sections, onSectionPress }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span className="card-title">Features</span>
      </div>
      {sections.map((sec, idx) => (
        <button key={sec.label} onClick={() => onSectionPress(sec)}
          className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)] text-left"
          style={{ borderBottom: idx < sections.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${sec.color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {sec.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{sec.label}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.4 }}>{sec.desc}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              background: `${sec.color}15`, color: sec.color,
            }}>{sec.items.length}</span>
            <ChevronRight size={14} style={{ color: 'var(--ink-4)' }} />
          </div>
        </button>
      ))}
    </div>
  )
}

// ── Community Pulse ───────────────────────────────────────
function CommunityPulse({ openComplaints, parcelsWaiting, visitorsIn, announcementsCount }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>Community Pulse</div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Open Complaints', value: openComplaints,     color: '#e11d48', icon: MessageSquareWarning },
          { label: 'Parcels Waiting', value: parcelsWaiting,     color: '#d97706', icon: Truck },
          { label: 'Visitors In',     value: visitorsIn,         color: '#059669', icon: Users },
          { label: 'Announcements',   value: announcementsCount, color: '#5b52f0', icon: Volume2 },
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
  )
}

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

// ── Greeting Block ────────────────────────────────────────
function GreetingBlock({ user, roleLabel, roleColor }) {
  const now        = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hour       = now.getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙'
  return (
    <div className="mb-1">
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{greeting} {greetEmoji}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {user?.name?.split(' ')[0]}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${roleColor}18`, color: roleColor }}>
          {roleLabel}
        </span>
        {user?.flatNo && <span style={{ fontSize: 10, color: '#94a3b8' }}>Flat {user.flatNo}</span>}
      </div>
    </div>
  )
}

// ── Admin Home ────────────────────────────────────────────
function AdminHome({ user, navigate, sections, onSectionPress, announcements }) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const [selMonth,      setSelMonth]   = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [dashboard,     setDashboard]  = useState(null)
  const [trend,         setTrend]      = useState([])
  const [payments,      setPayments]   = useState([])
  const [complaints,    setComplaints] = useState([])
  const [deliveries,    setDeliveries] = useState([])
  const [visitors,      setVisitors]   = useState([])
  const [loading,       setLoading]    = useState(true)
  const [sendingAll,    setSendingAll] = useState(false)
  const [reminderMsg,   setReminderMsg]= useState(null)

  useEffect(() => { fetchAll() }, [selMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, trendRes, paymentsRes, complaintsRes, visitorsRes, deliveriesRes] =
        await Promise.all([
          api.get(`/api/dashboard?month=${selMonth.month}&year=${selMonth.year}`),
          api.get('/api/dashboard/trend?months=6'),
          api.get(`/api/maintenance?month=${selMonth.month}&year=${selMonth.year}`),
          api.get('/api/complaints'),
          api.get('/api/visitors?todayOnly=true'),
          api.get('/api/deliveries').catch(() => ({ data: [] })),
        ])
      setDashboard(dashRes.data)
      setTrend(trendRes.data)
      setPayments(paymentsRes.data)
      setComplaints(complaintsRes.data)
      setVisitors(visitorsRes.data)
      setDeliveries((deliveriesRes.data || []).filter(d => d.status === 'PENDING'))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSendAllReminders = async () => {
    setSendingAll(true)
    try {
      const res = await api.post(`/api/maintenance/reminders?month=${selMonth.month}&year=${selMonth.year}`)
      setReminderMsg(res.data.message || 'Reminders sent!')
      setTimeout(() => setReminderMsg(null), 4000)
    } catch { alert('Failed') }
    finally { setSendingAll(false) }
  }

  const maintenance    = dashboard?.maintenance || {}
  const societyFund    = dashboard?.societyFund || {}
  const expensesTotal  = dashboard?.expenses?.total || 0
  const MONTHLY_AMOUNT = maintenance.monthlyAmount || 4200
  const defaulters     = payments.filter(p => p.status === 'UNPAID')
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED')
  const visitorsIn     = visitors.filter(v => v.status === 'IN').length
  const pct = maintenance.total
    ? Math.round((maintenance.collected || 0) / (maintenance.total * MONTHLY_AMOUNT) * 100)
    : 0
  const monthLabel = `${MONTH_NAMES[selMonth.month - 1]} ${selMonth.year}`
  const chartData  = trend.map(t => ({ name: MONTH_NAMES[t.month - 1], collected: t.collected || 0 }))

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Collected', value: fmt(maintenance.collected || 0), sub: `${maintenance.paid || 0}/${maintenance.total || 0} paid`, color: '#059669' },
          { label: 'Pending',   value: fmt(maintenance.pending   || 0), sub: `${defaulters.length} flats`,                            color: '#e11d48' },
          { label: 'Expenses',  value: fmt(expensesTotal),              sub: 'this month',                                            color: '#d97706' },
          { label: 'Corpus',    value: fmt(societyFund.currentBalance || 0), sub: 'society fund',                                     color: '#5b52f0' },
        ].map(k => (
          <div key={k.label} className="card p-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: k.color }} />
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>{k.label}</div>
            <div className="text-[20px] font-bold" style={{ color: k.color, letterSpacing: '-0.02em' }}>{k.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Community Pulse */}
      <CommunityPulse
        openComplaints={openComplaints.length}
        parcelsWaiting={deliveries.length}
        visitorsIn={visitorsIn}
        announcementsCount={announcements.length}
      />

      {/* Collection progress */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>Collection · {monthLabel}</span>
          <span className="text-[12px] font-bold" style={{ color: pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#e11d48' }}>{pct}%</span>
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

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Monthly Collection</span>
          <button onClick={() => navigate('/reports')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>Report →</button>
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
            <div className="h-[90px] flex items-center justify-center text-[12px]" style={{ color: 'var(--ink-4)' }}>No data</div>
          )}
        </div>
      </div>

      {/* Defaulters */}
      {defaulters.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Defaulters · {monthLabel}</span>
            <button onClick={handleSendAllReminders} disabled={sendingAll} className="btn-primary py-1 px-2 text-[10px]">
              <Mail size={11} />{sendingAll ? '...' : 'Email All'}
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
              <div key={d.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--surface-2)]"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: '#ffe4e6', color: '#9f1239' }}>{d.flatNo}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{d.payerName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>Unpaid</div>
                </div>
                <div className="text-[11px] font-bold" style={{ color: 'var(--rose)' }}>{fmt(d.amount || MONTHLY_AMOUNT)}</div>
              </div>
            ))}
            {defaulters.length > 8 && (
              <button onClick={() => navigate('/maintenance')} className="w-full py-2.5 text-[11px] font-semibold text-center" style={{ color: 'var(--indigo)' }}>
                View all {defaulters.length} →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sections card */}
      <SectionsCard sections={sections} onSectionPress={onSectionPress} />
    </div>
  )
}

// ── Resident Home ─────────────────────────────────────────
function ResidentHome({ user, navigate, sections, onSectionPress, announcements }) {
  const now     = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const isOwner = user?.role === 'owner'

  const [selMonth,     setSelMonth]   = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [myPayments,   setMyPayments] = useState([])
  const [myComplaints, setMyComplaints]= useState([])
  const [myVisitors,   setMyVisitors] = useState([])
  const [dashboard,    setDashboard]  = useState(null)
  const [expenses,     setExpenses]   = useState([])
  const [allFlats,     setAllFlats]   = useState([])
  const [allPayments,  setAllPayments]= useState([])
  const [deliveries,   setDeliveries] = useState([])
  const [loading,      setLoading]    = useState(true)

  useEffect(() => { if (user?.flatNo) fetchAll() }, [user, selMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const requests = [
        api.get(`/api/maintenance/flat/${user.flatNo}`),
        api.get(`/api/complaints/flat/${user.flatNo}`),
        api.get(`/api/visitors?flatNo=${user.flatNo}&todayOnly=true`),
        api.get(`/api/dashboard?month=${selMonth.month}&year=${selMonth.year}`),
        api.get('/api/flats'),
        api.get(`/api/maintenance?month=${selMonth.month}&year=${selMonth.year}`),
        api.get('/api/deliveries').catch(() => ({ data: [] })),
      ]
      if (isOwner) requests.push(api.get(`/api/expenses?month=${selMonth.month}&year=${selMonth.year}`))
      const results = await Promise.all(requests)
      setMyPayments(results[0].data)
      setMyComplaints(results[1].data)
      setMyVisitors(results[2].data)
      setDashboard(results[3].data)
      setAllFlats(results[4].data.filter(f => f.floor > 0 && f.wing !== 'Ground'))
      setAllPayments(results[5].data)
      setDeliveries((results[6].data || []).filter(d => d.status === 'PENDING'))
      if (isOwner && results[7]) setExpenses(results[7].data)
    } catch (err) { console.error(err) }
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

  const payHistory = [...myPayments]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(p => ({ name: MONTH_NAMES[p.month - 1], paid: p.status === 'PAID' ? (p.amount || MONTHLY_AMOUNT) : 0, status: p.status }))

  const flatGrid = allFlats.map(f => {
    const pay = allPayments.find(p => p.flatNo === f.flatNo)
    return { ...f, payStatus: pay?.status || 'UNPAID' }
  })

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
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

      {/* My payment hero */}
      <div className="card p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48' }} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>
              My Maintenance · {monthLabel}
            </div>
            <div className="text-[26px] font-bold" style={{
              color: currentMonthPay?.status === 'PAID' ? '#059669' : '#e11d48', letterSpacing: '-0.03em',
            }}>
              {currentMonthPay?.status === 'PAID' ? 'Paid ✓'
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
            <button onClick={() => navigate('/resident/maintenance')} className="btn-primary text-[12px] px-3 py-2 flex-shrink-0">
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
          <button onClick={() => navigate('/resident/complaints')} className="text-[10px] font-semibold mt-1" style={{ color: 'var(--indigo)' }}>View →</button>
        </div>
        <div className="card p-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#059669' }} />
          <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Society</div>
          <div className="text-[20px] font-bold" style={{ color: '#059669', letterSpacing: '-0.02em' }}>{societyPct}%</div>
          <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{maintenance.paid || 0}/{maintenance.total || 0} paid</div>
        </div>
        {isOwner ? (
          <>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#d97706' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Expenses</div>
              <div className="text-[20px] font-bold" style={{ color: '#d97706', letterSpacing: '-0.02em' }}>{fmt(expTotal)}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>{expenses.length} entries</div>
              <button onClick={() => navigate('/resident/expenses')} className="text-[10px] font-semibold mt-1" style={{ color: 'var(--indigo)' }}>View →</button>
            </div>
            <div className="card p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#5b52f0' }} />
              <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-3)' }}>Fund</div>
              <div className="text-[20px] font-bold" style={{ color: '#5b52f0', letterSpacing: '-0.02em' }}>{fmt(societyFund.currentBalance || 0)}</div>
              <div className="text-[10px]" style={{ color: 'var(--ink-4)' }}>corpus balance</div>
            </div>
          </>
        ) : (
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

      {/* Community Pulse */}
      <CommunityPulse
        openComplaints={openComplaints.length}
        parcelsWaiting={deliveries.length}
        visitorsIn={myVisitors.filter(v => v.status === 'IN').length}
        announcementsCount={announcements.length}
      />

      {/* Payment history + flat grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Payment History</span>
          <button onClick={() => navigate('/resident/maintenance')} className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>All →</button>
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
            <div className="h-[85px] flex items-center justify-center text-[12px]" style={{ color: 'var(--ink-4)' }}>No payment history</div>
          )}
          {flatGrid.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>Society Status — {monthLabel}</span>
                <div className="flex gap-2">
                  {[['#d1fae5','Paid'],['#ffe4e6','Unpaid']].map(([bg,l]) => (
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
                        outline: isMe ? '2px solid var(--emerald)' : 'none', outlineOffset: '1px',
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

      {/* Sections card */}
      <SectionsCard sections={sections} onSectionPress={onSectionPress} />
    </div>
  )
}

// ── Main HomeScreen ───────────────────────────────────────
export default function HomeScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeSection,  setActiveSection]  = useState(null)
  const [annSheetOpen,   setAnnSheetOpen]   = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [announcements,  setAnnouncements]  = useState([])
  const avatarRef = useRef(null)

  const isAdmin = user?.role === 'admin'
  const isOwner = user?.role === 'owner'
  const isSup   = user?.identifier === 'SUP'

  const roleLabel = isSup ? 'Supervisor' : isAdmin ? 'Admin' : isOwner ? 'Owner' : 'Tenant'
  const roleColor = isAdmin ? '#5b52f0' : isOwner ? '#059669' : '#0284c7'
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  const sections  = isAdmin ? ADMIN_SECTIONS : isOwner ? OWNER_SECTIONS : TENANT_SECTIONS

  // Fetch announcements at top level so bell can use them
  useEffect(() => {
    api.get('/api/announcements')
      .then(r => setAnnouncements(r.data))
      .catch(() => {})
  }, [])

  // Close avatar menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasUnread = announcements.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>

      {/* ── Navbar ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>

        {/* Left — Announcements icon */}
        <button
          onClick={() => setAnnSheetOpen(true)}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: hasUnread ? '#eeeeff' : 'var(--surface-2)',
            border: `1px solid ${hasUnread ? 'var(--indigo-md)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}>
          <Megaphone size={18} style={{ color: hasUnread ? 'var(--indigo)' : 'var(--ink-3)' }} />
          {hasUnread && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: 99,
              background: '#e11d48', border: '1.5px solid white',
            }} />
          )}
        </button>

        {/* App name center */}
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', letterSpacing: '-0.01em' }}>
          Akriti Adeshwar
        </span>

        {/* Right — Avatar with popover */}
        <div ref={avatarRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setAvatarMenuOpen(v => !v)}
            style={{
              width: 40, height: 40, borderRadius: 99,
              background: roleColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
              cursor: 'pointer', border: 'none',
              boxShadow: avatarMenuOpen ? `0 0 0 3px ${roleColor}30` : 'none',
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
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* User info */}
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{user?.name?.split(' ')[0]}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>
                  {roleLabel}{user?.flatNo ? ` · Flat ${user.flatNo}` : ''}
                </div>
              </div>

              {/* Go Back — closes menu */}
              <button
                onClick={() => setAvatarMenuOpen(false)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: 'transparent', cursor: 'pointer', color: 'var(--ink-2)',
                  fontSize: 13, fontWeight: 500,
                }}
                className="hover:bg-[var(--surface-2)] transition-colors">
                <ChevronLeft size={15} style={{ color: 'var(--ink-3)' }} />
                Go Back
              </button>

              {/* Logout */}
              <button
                onClick={() => { setAvatarMenuOpen(false); logout() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: 'transparent', cursor: 'pointer', color: '#e11d48',
                  fontSize: 13, fontWeight: 500,
                }}
                className="hover:bg-[#fff1f2] transition-colors">
                <LogOut size={15} style={{ color: '#e11d48' }} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5">

        {/* Greeting in content area */}
        <GreetingBlock user={user} roleLabel={roleLabel} roleColor={roleColor} />

        <div className="mt-3">
          {isAdmin
            ? <AdminHome user={user} navigate={navigate} sections={sections} onSectionPress={setActiveSection} announcements={announcements} />
            : <ResidentHome user={user} navigate={navigate} sections={sections} onSectionPress={setActiveSection} announcements={announcements} />
          }
        </div>

        <div className="h-6" />
      </div>

      {/* ── Announcements Sheet ── */}
      <AnnouncementsSheet
        open={annSheetOpen}
        onClose={() => setAnnSheetOpen(false)}
        announcements={announcements}
        onNavigate={navigate}
        isAdmin={isAdmin}
      />

      {/* ── Section Sheet ── */}
      <SectionSheet
        open={!!activeSection}
        section={activeSection}
        onClose={() => setActiveSection(null)}
        onNavigate={navigate}
      />
    </div>
  )
}