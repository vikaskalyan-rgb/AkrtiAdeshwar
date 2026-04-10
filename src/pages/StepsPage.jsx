import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import api from '../api/config'
import {
  Play, Square, Edit3, Check, X, Plus, Trash2,
  Trophy, Flame, Footprints,
  TrendingUp, Users, RefreshCw
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────
function fmtSteps(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('en-IN')
}

function rankMedal(rank) {
  if (rank === 1) return { emoji: '🥇', color: '#f59e0b', bg: '#fffbeb' }
  if (rank === 2) return { emoji: '🥈', color: '#6b7280', bg: '#f9fafb' }
  if (rank === 3) return { emoji: '🥉', color: '#d97706', bg: '#fef3c7' }
  return { emoji: `${rank}`, color: 'var(--ink-3)', bg: 'var(--surface-2)' }
}

// ── Step Counter Circle ───────────────────────────────────
function StepCircle({ steps, isWalking, target = 10000 }) {
  const pct    = Math.min((steps / target) * 100, 100)
  const radius = 70
  const circ   = 2 * Math.PI * radius
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {isWalking && (
        <div className="absolute inset-0 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle, #5b52f020 0%, transparent 70%)' }} />
      )}
      <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={radius}
          fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="90" cy="90" r={radius}
          fill="none"
          stroke={isWalking ? '#5b52f0' : '#059669'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--ink-4)' }}>Steps</span>
        <span className="text-[32px] font-bold tabular-nums"
          style={{
            color: isWalking ? 'var(--indigo)' : 'var(--ink)',
            letterSpacing: '-0.04em',
            transition: 'color 0.3s ease'
          }}>
          {fmtSteps(steps)}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--ink-4)' }}>
          / {fmtSteps(target)} goal
        </span>
      </div>
    </div>
  )
}

// ── Walker Card ───────────────────────────────────────────
function WalkerCard({ walker, flatNo, onSelect, onDelete }) {
  const [todaySteps, setTodaySteps] = useState(null)

  useEffect(() => {
    api.get(`/api/steps/today/${flatNo}/${walker.id}`)
      .then(r => setTodaySteps(r.data.steps))
      .catch(() => setTodaySteps(0))
  }, [walker.id, flatNo])

  return (
    <div
      onClick={() => onSelect(walker)}
      className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: 'white', border: '1.5px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
        style={{ background: `hsl(${(walker.walkerName.charCodeAt(0) * 37) % 360}, 60%, 55%)` }}>
        {walker.walkerName[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold truncate" style={{ color: 'var(--ink)' }}>
          {walker.walkerName}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Footprints size={11} style={{ color: 'var(--indigo)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--indigo)' }}>
            {todaySteps === null ? '...' : fmtSteps(todaySteps)} today
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold"
          style={{ background: '#eeeeff', color: 'var(--indigo)' }}>
          Start →
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(walker) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ color: 'var(--rose)', background: '#fff1f2' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Walker Counter ────────────────────────────────────────
function WalkerCounter({ walker, flatNo, onBack }) {
  const [steps,      setSteps]      = useState(0)
  const [savedSteps, setSavedSteps] = useState(0)
  const [isWalking,  setIsWalking]  = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [editVal,    setEditVal]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [wakeLock,   setWakeLock]   = useState(null)
  const [sensorOk,   setSensorOk]   = useState(true)
  const [elapsed,    setElapsed]    = useState(0)

  const lastMag   = useRef(0)
  const stepBuf   = useRef([])
  const lastStep  = useRef(0)
  const timerRef  = useRef(null)
  const liveSteps = useRef(0)

  useEffect(() => {
    api.get(`/api/steps/today/${flatNo}/${walker.id}`)
      .then(r => {
        setSavedSteps(r.data.steps || 0)
        setSteps(r.data.steps || 0)
        liveSteps.current = r.data.steps || 0
      })
      .catch(() => {})
  }, [walker.id, flatNo])

  useEffect(() => {
    if (isWalking) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isWalking])

  const fmtTime = (s) => {
    const m = Math.floor(s / 60)
    return `${m}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc) return
    const mag = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2)
    stepBuf.current.push(mag)
    if (stepBuf.current.length > 5) stepBuf.current.shift()
    const avg = stepBuf.current.reduce((a,b) => a+b, 0) / stepBuf.current.length
    const now = Date.now()
    if (mag > avg + 2.5 && now - lastStep.current > 350) {
      lastStep.current = now
      liveSteps.current += 1
      setSteps(liveSteps.current)
    }
    lastMag.current = mag
  }, [])

  const startWalking = async () => {
    setIsWalking(true)
    setElapsed(0)
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const perm = await DeviceMotionEvent.requestPermission()
        if (perm !== 'granted') { setSensorOk(false); setIsWalking(false); return }
      } catch { setSensorOk(false) }
    }
    window.addEventListener('devicemotion', handleMotion, { passive: true })
    if ('wakeLock' in navigator) {
      try { setWakeLock(await navigator.wakeLock.request('screen')) } catch {}
    }
  }

  const stopWalking = async () => {
    setIsWalking(false)
    window.removeEventListener('devicemotion', handleMotion)
    if (wakeLock) { await wakeLock.release(); setWakeLock(null) }
    await saveSteps(liveSteps.current)
  }

  const saveSteps = async (s) => {
    setSaving(true)
    try {
      await api.post(`/api/steps/log/${flatNo}/${walker.id}`, { steps: s })
      setSavedSteps(s)
    } catch {}
    finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    const val = parseInt(editVal)
    if (isNaN(val) || val < 0) return
    liveSteps.current = val
    setSteps(val)
    setEditing(false)
    await saveSteps(val)
  }

  const calories = Math.round(steps * 0.04)
  const distKm   = (steps * 0.000762).toFixed(2)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title={walker.walkerName} subtitle={`Flat ${flatNo} · Today's Walk`} showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card p-6 flex flex-col items-center gap-4">
          {isWalking && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: '#eeeeff' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--indigo)' }} />
              <span className="text-[11px] font-bold" style={{ color: 'var(--indigo)' }}>
                Walking · {fmtTime(elapsed)}
              </span>
            </div>
          )}
          <StepCircle steps={steps} isWalking={isWalking} />
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { label: 'Calories', value: calories, icon: Flame,      color: '#e11d48', bg: '#fff1f2' },
              { label: 'Distance', value: distKm,   icon: TrendingUp, color: '#059669', bg: '#ecfdf5' },
              { label: 'Saved',    value: fmtSteps(savedSteps), icon: Check, color: '#5b52f0', bg: '#eeeeff' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl"
                  style={{ background: s.bg }}>
                  <Icon size={14} style={{ color: s.color }} />
                  <span className="text-[14px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: s.color }}>{s.label}</span>
                </div>
              )
            })}
          </div>
          {!sensorOk && (
            <div className="w-full px-3 py-2 rounded-xl text-[11px]"
              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#78350f' }}>
              ⚠️ Motion sensor not available. Use manual edit to enter your steps.
            </div>
          )}
          {isWalking && (
            <div className="w-full px-3 py-2 rounded-xl text-[11px]"
              style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46' }}>
              📱 Screen will stay on while walking to count your steps.
            </div>
          )}
          {!isWalking ? (
            <button onClick={startWalking}
              className="w-full py-4 rounded-2xl text-[16px] font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #5b52f0, #059669)', boxShadow: '0 4px 20px rgba(91,82,240,0.35)' }}>
              <Play size={20} fill="white" /> Start Walk
            </button>
          ) : (
            <button onClick={stopWalking}
              className="w-full py-4 rounded-2xl text-[16px] font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #e11d48, #d97706)', boxShadow: '0 4px 20px rgba(225,29,72,0.35)' }}>
              <Square size={18} fill="white" /> Stop & Save
            </button>
          )}
          {!isWalking && (
            editing ? (
              <div className="flex gap-2 w-full">
                <input className="input flex-1 text-center text-[15px] font-bold"
                  type="number" placeholder="Enter step count"
                  value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus />
                <button onClick={handleEditSave} disabled={saving}
                  className="px-4 py-2 rounded-xl font-bold text-white" style={{ background: 'var(--emerald)' }}>
                  {saving ? '...' : <Check size={16} />}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl font-bold"
                  style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => { setEditing(true); setEditVal(String(steps)) }}
                className="flex items-center gap-2 text-[12px] font-semibold"
                style={{ color: 'var(--ink-3)' }}>
                <Edit3 size={13} /> Edit step count manually
              </button>
            )
          )}
        </div>
        {steps >= 10000 && (
          <div className="card p-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #ecfdf5)', border: '1px solid #6ee7b7' }}>
            <span className="text-[32px]">🎉</span>
            <div>
              <div className="text-[14px] font-bold" style={{ color: '#065f46' }}>Goal reached! 10,000 steps!</div>
              <div className="text-[11px]" style={{ color: '#059669' }}>Amazing work today! Keep it up! 💪</div>
            </div>
          </div>
        )}
        {steps >= 5000 && steps < 10000 && (
          <div className="card p-4 flex items-center gap-3"
            style={{ background: '#f0f9ff', border: '1px solid #7dd3fc' }}>
            <span className="text-[28px]">🔥</span>
            <div className="text-[13px] font-bold" style={{ color: '#0369a1' }}>
              Halfway there! {fmtSteps(10000 - steps)} more to go!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Leaderboard ───────────────────────────────────────────
function Leaderboard({ myFlatNo }) {
  const [filter,  setFilter]  = useState('today')
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/steps/leaderboard?filter=${filter}`
      if (filter === 'custom' && from && to) url += `&from=${from}&to=${to}`
      const res = await api.get(url)
      setData(res.data)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [filter, from, to])

  useEffect(() => { load() }, [load])

  const filters = [
    { v: 'today',  l: 'Today' },
    { v: '10days', l: '10 Days' },
    { v: '30days', l: '30 Days' },
    { v: 'custom', l: '📅 Custom' },
  ]

  const maxSteps = data[0]?.totalSteps || 1

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all"
            style={{
              background: filter === f.v ? 'var(--indigo)' : 'white',
              color:      filter === f.v ? 'white' : 'var(--ink-2)',
              border:     `1px solid ${filter === f.v ? 'var(--indigo)' : 'var(--border)'}`,
            }}>
            {f.l}
          </button>
        ))}
        <button onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--ink-3)' }}>
          <RefreshCw size={13} />
        </button>
      </div>
      {filter === 'custom' && (
        <div className="flex gap-2">
          <input type="date" className="input flex-1 text-[12px]"
            value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input flex-1 text-[12px]"
            value={to} onChange={e => setTo(e.target.value)} />
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center gap-2">
          <Trophy size={16} style={{ color: '#f59e0b' }} />
          <span className="card-title">Step Leaderboard</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            <Footprints size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>No steps recorded yet</p>
          </div>
        ) : data.map((entry, i) => {
          const medal    = rankMedal(entry.rank)
          const pct      = Math.round((entry.totalSteps / maxSteps) * 100)
          const isMyFlat = entry.flatNo === myFlatNo
          return (
            <div key={entry.walkerId}
              className="px-4 py-3 transition-colors"
              style={{
                borderBottom: '1px solid var(--border)',
                background: isMyFlat ? 'var(--indigo-lt)' : i < 3 ? medal.bg : 'white',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                  style={{ background: medal.bg, color: medal.color }}>
                  {entry.rank <= 3 ? medal.emoji : entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold truncate" style={{ color: 'var(--ink)' }}>
                      {entry.walkerName}
                    </span>
                    {isMyFlat && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--indigo)', color: 'white' }}>You</span>
                    )}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Flat {entry.flatNo}</div>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: i === 0 ? '#f59e0b' : i === 1 ? '#6b7280' : i === 2 ? '#d97706' : 'var(--indigo)',
                      }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[14px] font-bold" style={{ color: medal.color }}>
                    {fmtSteps(entry.totalSteps)}
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--ink-4)' }}>steps</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main StepsPage ────────────────────────────────────────
export default function StepsPage() {
  const { user }  = useAuth()
  const flatNo    = user?.flatNo
  const [searchParams] = useSearchParams()                          // ✅ inside component
  const [tab,      setTab]     = useState(searchParams.get('tab') || 'walkers')  // ✅ inside component
  const [walkers,  setWalkers] = useState([])
  const [loading,  setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [adding,   setAdding]  = useState(false)
  const [newName,  setNewName] = useState('')
  const [saving,   setSaving]  = useState(false)

  useEffect(() => {
    if (flatNo) loadWalkers()
  }, [flatNo])

  const loadWalkers = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/steps/walkers/${flatNo}`)
      setWalkers(res.data)
    } catch { setWalkers([]) }
    finally { setLoading(false) }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await api.post(`/api/steps/walkers/${flatNo}`, { walkerName: newName.trim() })
      setNewName('')
      setAdding(false)
      await loadWalkers()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add walker')
    } finally { setSaving(false) }
  }

  const handleDelete = async (walker) => {
    if (!confirm(`Remove ${walker.walkerName} from step tracking?`)) return
    try {
      await api.delete(`/api/steps/walkers/${flatNo}/${walker.id}`)
      await loadWalkers()
    } catch { alert('Failed to remove') }
  }

  if (selected) {
    return (
      <WalkerCounter
        walker={selected}
        flatNo={flatNo}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Step Challenge" subtitle="Walk · Compete · Win 🏃" />

      {/* Tabs */}
      <div className="flex gap-0 px-4 pt-3 pb-0 flex-shrink-0">
        {[
          { v: 'walkers',     l: '👤 My Flat' },
          { v: 'leaderboard', l: '🏆 Leaderboard' },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className="flex-1 py-2.5 text-[12px] font-bold transition-all"
            style={{
              borderBottom: tab === t.v ? '2.5px solid var(--indigo)' : '2.5px solid transparent',
              color: tab === t.v ? 'var(--indigo)' : 'var(--ink-3)',
              background: 'transparent',
            }}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={{ height: 1, background: 'var(--border)' }} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'walkers' && (
          <>
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #5b52f0, #059669)', boxShadow: '0 4px 20px rgba(91,82,240,0.2)' }}>
              <span className="text-[40px]">🏃</span>
              <div>
                <div className="text-[16px] font-bold text-white">Flat {flatNo} Walkers</div>
                <div className="text-[11px]" style={{ color: '#c7c4fc' }}>Tap your name to start counting steps</div>
              </div>
            </div>

            {loading ? (
              <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
            ) : walkers.length === 0 ? (
              <div className="card p-8 text-center">
                <span className="text-[48px]">👟</span>
                <p className="text-[14px] font-bold mt-3" style={{ color: 'var(--ink-2)' }}>No walkers added yet</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>Add yourself to start tracking steps</p>
              </div>
            ) : (
              <div className="space-y-2">
                {walkers.map(w => (
                  <WalkerCard key={w.id} walker={w} flatNo={flatNo}
                    onSelect={setSelected} onDelete={handleDelete} />
                ))}
              </div>
            )}

            {adding ? (
              <div className="card p-4 space-y-3">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-2)' }}>Add family member</p>
                <input className="input w-full"
                  placeholder="Name (e.g. Vikas, Mrs. Vikas)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus />
                <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 justify-center">
                    <Check size={14} /> {saving ? 'Adding...' : 'Add'}
                  </button>
                  <button onClick={() => { setAdding(false); setNewName('') }} className="btn-ghost">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold transition-all"
                style={{ background: 'white', border: '2px dashed var(--border)', color: 'var(--ink-3)' }}>
                <Plus size={16} /> Add family member
              </button>
            )}
          </>
        )}

        {tab === 'leaderboard' && <Leaderboard myFlatNo={flatNo} />}
      </div>
    </div>
  )
}