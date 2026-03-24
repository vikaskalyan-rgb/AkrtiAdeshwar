import { useState, useEffect, useCallback } from 'react'
import Topbar from '../components/layout/Topbar'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────
const NIGHT_SLOTS  = [22, 23, 0, 1, 2, 3, 4, 5]
const SLOT_LABELS  = {
  22: '10 PM', 23: '11 PM',
   0: '12 AM',  1: '1 AM',
   2: '2 AM',   3: '3 AM',
   4: '4 AM',   5: '5 AM',
}

function formatPatrolDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

function getCompliancColor(pct) {
  if (pct === 100) return { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' }
  if (pct >= 75)   return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return               { color: '#e11d48', bg: '#fff1f2', border: '#fca5a5' }
}

// ── Slot Grid component ────────────────────────────────────
const SlotGrid = ({ loggedSlots = [], currentSlot, isNight }) => (
  <div className="grid grid-cols-4 gap-2">
    {NIGHT_SLOTS.map(slot => {
      const done    = loggedSlots.includes(slot)
      const isCurr  = slot === currentSlot && isNight
      return (
        <div key={slot}
          className="flex flex-col items-center justify-center rounded-2xl py-3 gap-1 transition-all"
          style={{
            background: done ? '#ecfdf5' : isCurr ? '#fffbeb' : 'var(--surface-3)',
            border: `1.5px solid ${done ? '#6ee7b7' : isCurr ? '#fde68a' : 'var(--border)'}`,
          }}>
          <span className="text-[18px]">
            {done ? '✅' : isCurr ? '⏰' : '○'}
          </span>
          <span className="text-[11px] font-bold"
            style={{ color: done ? '#059669' : isCurr ? '#d97706' : 'var(--ink-3)' }}>
            {SLOT_LABELS[slot]}
          </span>
          <span className="text-[9px]"
            style={{ color: done ? '#059669' : isCurr ? '#d97706' : 'var(--ink-4)' }}>
            {done ? 'Done' : isCurr ? 'Now' : '–'}
          </span>
        </div>
      )
    })}
  </div>
)

// ── Main Page ──────────────────────────────────────────────
export default function WatchmanLog() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const isSupervisor = user?.identifier === 'SUP' || user?.role === 'supervisor'

  const [status,    setStatus]    = useState(null)
  const [summary,   setSummary]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [logging,   setLogging]   = useState(false)
  const [logResult, setLogResult] = useState(null) // { success, message }
  const [activeTab, setActiveTab] = useState('tonight') // tonight | history
  const [historyPage, setHistoryPage] = useState(0)    // 0 = last 7 days

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, summaryRes] = await Promise.all([
        api.get('/api/watchman/status'),
        api.get('/api/watchman/summary?days=30'),
      ])
      setStatus(statusRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Refresh every 2 minutes
    const interval = setInterval(fetchAll, 120000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const handleLog = async () => {
    setLogging(true)
    setLogResult(null)
    try {
      await api.post('/api/watchman/log')
      setLogResult({ success: true, message: '✅ Logged successfully!' })
      await fetchAll()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to log'
      setLogResult({ success: false, message: msg })
    } finally {
      setLogging(false)
      setTimeout(() => setLogResult(null), 4000)
    }
  }

  const handleRaiseComplaint = async (patrolDate) => {
    try {
      await api.post('/api/complaints', {
        title:       `Watchman patrol missed — ${formatPatrolDate(patrolDate)}`,
        description: `Watchman did not complete all patrol whistle logs for the night of ${formatPatrolDate(patrolDate)}. Please follow up.`,
        category:    'Security',
        priority:    'HIGH',
        flatNo:      user?.flatNo,
      })
      alert('Complaint raised successfully! Admin has been notified.')
    } catch {
      alert('Failed to raise complaint')
    }
  }

  // Current night's data from summary
  const tonightData = summary[0] || null

  // History = last 30 days, paginated 7 per page
  const historyChunks = []
  for (let i = 0; i < summary.length; i += 7) {
    historyChunks.push(summary.slice(i, i + 7))
  }
  const currentChunk = historyChunks[historyPage] || []

  if (loading) return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Night Patrol" subtitle="Watchman whistle log" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[14px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Night Patrol" subtitle="10PM – 6AM whistle log" />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* ══════════════════════════════════════════════ */}
        {/* SUPERVISOR VIEW — Big tap button              */}
        {/* ══════════════════════════════════════════════ */}
        {isSupervisor && (
          <div className="space-y-3">

            {/* Time status card */}
            <div className="card p-4 text-center"
              style={{
                background: status?.isNightTime
                  ? 'linear-gradient(135deg, #1a1a2e, #2d2d5e)'
                  : 'var(--surface-3)',
              }}>
              <div className="text-[32px] mb-1">
                {status?.isNightTime ? '🌙' : '☀️'}
              </div>
              <div className="text-[14px] font-bold"
                style={{ color: status?.isNightTime ? 'white' : 'var(--ink-2)' }}>
                {status?.isNightTime ? 'Night Duty Active' : 'Day Time'}
              </div>
              <div className="text-[12px] mt-1"
                style={{ color: status?.isNightTime ? '#a5b4fc' : 'var(--ink-4)' }}>
                {status?.isNightTime
                  ? `Current slot: ${SLOT_LABELS[status?.currentSlot]}`
                  : 'Patrol starts at 10PM'}
              </div>
              {status?.isNightTime && (
                <div className="mt-2 text-[11px] font-semibold"
                  style={{ color: '#86efac' }}>
                  {status?.loggedCount} of {status?.totalSlots} whistles logged tonight
                </div>
              )}
            </div>

            {/* ── BIG LOG BUTTON ── */}
            {status?.isNightTime && (
              <div className="card p-6 flex flex-col items-center gap-4">

                {status?.alreadyLogged ? (
                  /* Already logged this hour */
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="text-[56px]">✅</div>
                    <div className="text-[18px] font-bold" style={{ color: '#059669' }}>
                      Logged for {SLOT_LABELS[status?.currentSlot]}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                      Next log at {SLOT_LABELS[NIGHT_SLOTS[(NIGHT_SLOTS.indexOf(status?.currentSlot) + 1) % NIGHT_SLOTS.length]]}
                    </div>
                  </div>
                ) : (
                  /* Not yet logged */
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="text-center">
                      <div className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                        Time to log your whistle!
                      </div>
                      <div className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                        Tap the button after whistling
                      </div>
                    </div>

                    {/* THE BIG BUTTON */}
                    <button
                      onClick={handleLog}
                      disabled={logging}
                      className="w-full flex flex-col items-center justify-center gap-3 rounded-3xl transition-all active:scale-95"
                      style={{
                        background: logging
                          ? 'var(--surface-3)'
                          : 'linear-gradient(135deg, #5b52f0, #7c6ff7)',
                        minHeight: '160px',
                        boxShadow: logging ? 'none' : '0 8px 32px rgba(91,82,240,0.4)',
                        border: 'none',
                        cursor: logging ? 'not-allowed' : 'pointer',
                      }}>
                      <span className="text-[56px]">
                        {logging ? '⏳' : '📣'}
                      </span>
                      <span className="text-[20px] font-bold text-white">
                        {logging ? 'Logging...' : 'I Whistled!'}
                      </span>
                      <span className="text-[13px]" style={{ color: '#c7c4fc' }}>
                        {SLOT_LABELS[status?.currentSlot]} slot
                      </span>
                    </button>
                  </div>
                )}

                {/* Log result banner */}
                {logResult && (
                  <div className="w-full px-4 py-3 rounded-2xl text-center font-semibold text-[14px]"
                    style={{
                      background: logResult.success ? '#ecfdf5' : '#fff1f2',
                      color:      logResult.success ? '#059669' : '#e11d48',
                      border:     `1px solid ${logResult.success ? '#6ee7b7' : '#fca5a5'}`,
                    }}>
                    {logResult.message}
                  </div>
                )}
              </div>
            )}

            {/* Tonight's slot grid */}
            <div className="card p-4">
              <div className="text-[13px] font-bold mb-3" style={{ color: 'var(--ink)' }}>
                Tonight's Log
              </div>
              <SlotGrid
                loggedSlots={status?.loggedSlots || []}
                currentSlot={status?.currentSlot}
                isNight={status?.isNightTime}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* RESIDENT / ADMIN VIEW                         */}
        {/* ══════════════════════════════════════════════ */}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1"
          style={{ background: 'white', border: '1px solid var(--border)' }}>
          {[
            { v: 'tonight', l: '🌙 Tonight' },
            { v: 'history', l: '📅 History' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className="flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: activeTab === v ? 'var(--indigo)' : 'transparent',
                color:      activeTab === v ? 'white' : 'var(--ink-3)',
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── Tonight Tab ── */}
        {activeTab === 'tonight' && (
          <div className="space-y-3">

            {/* Tonight summary card */}
            {tonightData && (() => {
              const pct    = Math.round((tonightData.logged / tonightData.total) * 100)
              const colors = getCompliancColor(pct)
              return (
                <div className="card p-4"
                  style={{ border: `1.5px solid ${colors.border}`, background: colors.bg }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: colors.color }}>
                        {formatPatrolDate(tonightData.patrolDate)}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                        {tonightData.logged} of {tonightData.total} slots logged
                      </div>
                    </div>
                    <div className="text-[28px] font-bold" style={{ color: colors.color }}>
                      {pct}%
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: colors.color }} />
                  </div>
                  {/* Raise complaint if incomplete and not supervisor */}
                  {!isSupervisor && tonightData.missed > 0 && (
                    <button
                      onClick={() => handleRaiseComplaint(tonightData.patrolDate)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                      style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}>
                      <AlertTriangle size={13} />
                      {tonightData.missed} slot{tonightData.missed > 1 ? 's' : ''} missed — Raise Complaint
                    </button>
                  )}
                  {tonightData.complete && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-xl"
                      style={{ background: '#ecfdf5' }}>
                      <CheckCircle2 size={14} style={{ color: '#059669' }} />
                      <span className="text-[12px] font-semibold" style={{ color: '#059669' }}>
                        All clear — full night patrol complete ✓
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Tonight's slot grid */}
            <div className="card p-4">
              <div className="text-[12px] font-bold uppercase tracking-wide mb-3"
                style={{ color: 'var(--ink-3)' }}>Slot Details</div>
              <SlotGrid
                loggedSlots={status?.loggedSlots || []}
                currentSlot={status?.currentSlot}
                isNight={status?.isNightTime}
              />
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[['✅','Logged'],['⏰','Current'],['○','Pending']].map(([e,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <span className="text-[14px]">{e}</span>
                    <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="space-y-2">

            {/* Pagination header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>
                {historyPage === 0 ? 'Last 7 nights' : `Days ${historyPage * 7 + 1}–${Math.min((historyPage + 1) * 7, summary.length)}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                  disabled={historyPage === 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: historyPage === 0 ? 'var(--surface-3)' : 'var(--indigo-lt)',
                    color:      historyPage === 0 ? 'var(--ink-4)' : 'var(--indigo)',
                  }}>
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {historyPage + 1} / {historyChunks.length}
                </span>
                <button
                  onClick={() => setHistoryPage(p => Math.min(historyChunks.length - 1, p + 1))}
                  disabled={historyPage >= historyChunks.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: historyPage >= historyChunks.length - 1 ? 'var(--surface-3)' : 'var(--indigo-lt)',
                    color:      historyPage >= historyChunks.length - 1 ? 'var(--ink-4)' : 'var(--indigo)',
                  }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* History rows */}
            <div className="card overflow-hidden">
              {currentChunk.map((day, i) => {
                const pct    = Math.round((day.logged / day.total) * 100)
                const colors = getCompliancColor(pct)
                const loggedSlots = (day.logs || []).map(l => l.hourSlot)
                return (
                  <div key={day.patrolDate}>
                    {/* Date row */}
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? 'white' : 'var(--surface-2)',
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: colors.bg }}>
                          <span className="text-[16px]">
                            {day.complete ? '✅' : day.logged === 0 ? '❌' : '⚠️'}
                          </span>
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                            {formatPatrolDate(day.patrolDate)}
                          </div>
                          <div className="text-[10px]" style={{ color: colors.color }}>
                            {day.logged}/{day.total} logged
                            {day.missed > 0 ? ` · ${day.missed} missed` : ' · Complete ✓'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-[16px] font-bold" style={{ color: colors.color }}>
                            {pct}%
                          </div>
                        </div>
                        {/* Raise complaint button for residents if missed */}
                        {!isSupervisor && day.missed > 0 && (
                          <button
                            onClick={() => handleRaiseComplaint(day.patrolDate)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                            style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fca5a5' }}>
                            <AlertTriangle size={10} /> Report
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mini slot strip */}
                    <div className="flex gap-1 px-4 py-2"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: i % 2 === 0 ? '#fafafa' : 'var(--surface-2)',
                      }}>
                      {NIGHT_SLOTS.map(slot => (
                        <div key={slot}
                          className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg"
                          style={{
                            background: loggedSlots.includes(slot) ? '#ecfdf5' : '#fff1f2',
                          }}>
                          <span className="text-[10px]">
                            {loggedSlots.includes(slot) ? '✓' : '✗'}
                          </span>
                          <span className="text-[8px] font-medium"
                            style={{ color: loggedSlots.includes(slot) ? '#059669' : '#e11d48' }}>
                            {SLOT_LABELS[slot].replace(' ', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <Clock size={13} style={{ color: 'var(--indigo)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-[11px]" style={{ color: 'var(--indigo)' }}>
            Night patrol runs <strong>10PM – 6AM</strong>. The watchman logs once per hour after whistling.
            {!isSupervisor && ' Use the "Report" button if a slot is missed.'}
          </p>
        </div>

      </div>
    </div>
  )
}