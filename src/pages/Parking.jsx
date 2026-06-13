import { useState, useEffect, useRef } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'
import {
  Car, Bike, Plus, Trash2, Save, Minus, Maximize2, RotateCcw
} from 'lucide-react'

// ── Vehicle types ─────────────────────────────────────────
const VEHICLE_TYPES = [
  { value: 'CAR',     label: 'Car',     icon: Car,  color: '#5b52f0', emoji: '🚗' },
  { value: 'BIKE',    label: 'Bike',    icon: Bike, color: '#059669', emoji: '🏍️' },
  { value: 'SCOOTER', label: 'Scooter', icon: Bike, color: '#0284c7', emoji: '🛵' },
  { value: 'CYCLE',   label: 'Cycle',   icon: Bike, color: '#d97706', emoji: '🚲' },
  { value: 'TEMPO',   label: 'Tempo',   icon: Car,  color: '#e11d48', emoji: '🚐' },
]
const typeConf = (t) => VEHICLE_TYPES.find(v => v.value === (t || '').toUpperCase()) || VEHICLE_TYPES[0]

// ── Slot layout — arranged to mirror the brochure site plan ──
// kinds: 'v' = nose-in (tall), 'h' = parallel (wide)
const T = { w: 64, h: 110 }   // tall slot
const W = { w: 110, h: 58 }   // wide slot

const SLOT_LAYOUT = [
  // North strip (top, near transformer)
  { label: '40', x: 470, y: 40,  ...W },
  { label: '39', x: 585, y: 40,  ...W },
  { label: '38', x: 700, y: 40,  ...W },

  // North bay — upper row (facing down)
  { label: '25', x: 250, y: 150, ...T },
  { label: '24', x: 320, y: 150, ...T },
  { label: '23', x: 390, y: 150, ...T },
  { label: '22', x: 460, y: 150, ...T },

  // North bay — lower row (facing up)
  { label: '26', x: 250, y: 268, ...T },
  { label: '27', x: 320, y: 268, ...T },
  { label: '28', x: 390, y: 268, ...T },
  { label: '29', x: 460, y: 268, ...T },

  // Right column (road side)
  { label: '20', x: 800, y: 150, ...W },
  { label: '19', x: 800, y: 216, ...W },
  { label: '18', x: 800, y: 282, ...W },
  { label: '17', x: 800, y: 348, ...W },
  { label: '16', x: 800, y: 414, ...W },

  // Left column
  { label: '30',  x: 60, y: 150, ...W },
  { label: '31',  x: 60, y: 216, ...W },
  { label: '32',  x: 60, y: 282, ...W },
  { label: '33',  x: 60, y: 348, ...W },
  { label: '33a', x: 60, y: 414, ...W },
  { label: '34',  x: 60, y: 480, ...W },

  // Centre slots (near lifts / ramp)
  { label: '10a', x: 600, y: 300, ...T },
  { label: '14a', x: 588, y: 624, ...T },
  { label: '14',  x: 660, y: 624, ...T },

  // Bottom-left
  { label: '35', x: 60,  y: 600, ...W },
  { label: '36', x: 60,  y: 666, ...W },
  { label: '5',  x: 200, y: 762, ...T },
  { label: '5a', x: 270, y: 762, ...T },

  // Bottom row (left-centre)
  { label: '1', x: 200, y: 892, ...T },
  { label: '2', x: 270, y: 892, ...T },
  { label: '3', x: 340, y: 892, ...T },
  { label: '4', x: 410, y: 892, ...T },

  // Bottom-centre
  { label: '6', x: 500, y: 892, ...T },
  { label: '7', x: 570, y: 892, ...T },
  { label: '8', x: 640, y: 892, ...T },
  { label: '9', x: 710, y: 892, ...T },

  // Bottom-right
  { label: '10', x: 800, y: 762, ...W },
  { label: '11', x: 800, y: 828, ...W },
  { label: '12', x: 800, y: 894, ...W },
  { label: '13', x: 800, y: 960, ...W },
]

const VIEW_W = 1000
const VIEW_H = 1100

// ════════════════════════════════════════════════════════════
//  Main Parking Page
// ════════════════════════════════════════════════════════════
export default function Parking() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const isTenant = user?.role === 'tenant' || (user?.identifier || '').includes('_tenant')
  const userFlat = (user?.flatNo || '').toUpperCase()

  const [slots,        setSlots]        = useState([])      // from DB (keyed by label)
  const [loading,      setLoading]      = useState(true)
  const [selectedLbl,  setSelectedLbl]  = useState(null)
  const [showModal,    setShowModal]    = useState(false)

  const [assignFlat,   setAssignFlat]   = useState('')
  const [vType,        setVType]        = useState('CAR')
  const [vNumber,      setVNumber]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [err,          setErr]          = useState(null)

  const [zoom,         setZoom]         = useState(0.5)
  const wrapRef = useRef(null)

  useEffect(() => { fetchSlots() }, [])

  // fit to width on first load
  useEffect(() => {
    if (wrapRef.current) {
      const cw = wrapRef.current.clientWidth
      const fit = Math.max(0.34, Math.min(1, cw / VIEW_W))
      setZoom(fit)
    }
  }, [loading])

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/parking/slots')
      setSlots(res.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // db slot lookup by label
  const byLabel = {}
  slots.forEach(s => { byLabel[s.label] = s })

  const selectedDb = selectedLbl ? byLabel[selectedLbl] : null
  const canEdit = !!(selectedDb && selectedDb.assignedFlat &&
                     selectedDb.assignedFlat.toUpperCase() === userFlat)

  const openSlot = (label) => {
    setSelectedLbl(label)
    const db = byLabel[label]
    setAssignFlat(db?.assignedFlat || '')
    setVType('CAR'); setVNumber(''); setErr(null)
    setShowModal(true)
  }

  const handleSaveAssign = async () => {
    if (!selectedDb) return
    setSaving(true); setErr(null)
    try {
      await api.put(`/api/parking/slots/${selectedDb.id}`, {
        assignedFlat: assignFlat.trim().toUpperCase() || null,
      })
      await fetchSlots()
      setShowModal(false)
    } catch (e) { setErr('Could not save') }
    finally { setSaving(false) }
  }

  const handleAddVehicle = async () => {
    if (!selectedDb) return
    setSaving(true); setErr(null)
    try {
      const res = await api.post('/api/parking/vehicles', {
        slotId: selectedDb.id,
        flatNo: userFlat,
        type: vType,
        numberPlate: vNumber.trim().toUpperCase(),
        addedBy: user?.identifier,
        isTenant,
      })
      if (res.data?.error) { setErr(res.data.error); return }
      setVNumber('')
      await fetchSlots()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not add vehicle')
    } finally { setSaving(false) }
  }

  const handleDeleteVehicle = async (vid) => {
    try { await api.delete(`/api/parking/vehicles/${vid}`); await fetchSlots() }
    catch (e) { console.error(e) }
  }

  // ── slot colours ──
  const slotStyle = (lbl) => {
    const db = byLabel[lbl]
    const assigned = !!db?.assignedFlat
    const mine = assigned && db.assignedFlat.toUpperCase() === userFlat
    const selected = lbl === selectedLbl
    let fill = '#ffffff', stroke = '#cbd5e1', text = '#64748b'
    if (assigned) { fill = '#d1fae5'; stroke = '#6ee7b7'; text = '#065f46' }
    if (mine)     { fill = '#5b52f0'; stroke = '#4f46e5'; text = '#ffffff' }
    return { fill, stroke, text, selected }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Parking" subtitle="Society parking layout" />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Legend + zoom */}
        <div className="card p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {[
              ['#5b52f0', 'Your slot'],
              ['#d1fae5', 'Assigned'],
              ['#ffffff', 'Empty'],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div style={{ width: 14, height: 14, borderRadius: 4, background: c, border: '1px solid #cbd5e1' }} />
                <span className="text-[11px]" style={{ color: 'var(--ink-2)' }}>{l}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(0.34, +(z - 0.18).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Minus size={15} style={{ color: 'var(--ink-2)' }} />
            </button>
            <button onClick={() => { if (wrapRef.current) setZoom(Math.max(0.34, Math.min(1, wrapRef.current.clientWidth / VIEW_W))) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <RotateCcw size={14} style={{ color: 'var(--ink-2)' }} />
            </button>
            <button onClick={() => setZoom(z => Math.min(2.4, +(z + 0.18).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Plus size={15} style={{ color: 'var(--ink-2)' }} />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="card p-0 overflow-hidden">
          <div ref={wrapRef} style={{ overflow: 'auto', maxHeight: '64vh', background: '#e9ecf2', WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 300 }}>
                <span className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading parking…</span>
              </div>
            ) : (
              <div style={{ width: VIEW_W * zoom, height: VIEW_H * zoom, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">

                  {/* plot background */}
                  <rect x="20" y="20" width={VIEW_W - 40} height={VIEW_H - 40} rx="20"
                    fill="#dfe3ea" stroke="#c2c8d2" strokeWidth="2" />

                  {/* driveway hint down the centre */}
                  <rect x="150" y="120" width="700" height="860" rx="14"
                    fill="#e9ecf2" stroke="#d2d8e0" strokeWidth="1.5" strokeDasharray="6 8" />

                  {/* ── Lifts ── */}
                  {[{ x: 430, y: 470 }, { x: 430, y: 620 }].map((l, i) => (
                    <g key={i}>
                      <rect x={l.x} y={l.y} width="72" height="62" rx="8"
                        fill="#ddd6fe" stroke="#c4b5fd" strokeWidth="2" />
                      <text x={l.x + 36} y={l.y + 37} textAnchor="middle"
                        fontSize="15" fontWeight="700" fill="#5b21b6">LIFT</text>
                    </g>
                  ))}

                  {/* stairs */}
                  <g>
                    <rect x="430" y="416" width="72" height="46" rx="8"
                      fill="#eef1f6" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="466" y="444" textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">UP</text>
                  </g>

                  {/* ── Ramp (striped) leading to gate ── */}
                  <g>
                    <rect x="690" y="486" width="212" height="62" rx="6" fill="#d8dde6" stroke="#c2c8d2" strokeWidth="1.5" />
                    {[0,1,2,3,4,5].map(i => (
                      <rect key={i} x={702 + i * 34} y="492" width="16" height="50" rx="2" fill="#f5c542" />
                    ))}
                    <text x="796" y="572" textAnchor="middle" fontSize="12" fontWeight="600" fill="#94a3b8">RAMP</text>
                  </g>
                  {/* gate on road edge */}
                  <rect x="906" y="486" width="12" height="62" rx="3" fill="#e11d48" />
                  <text x="912" y="476" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e11d48">GATE</text>

                  {/* road label */}
                  <text x="960" y="540" textAnchor="middle" fontSize="12" fontWeight="600" fill="#94a3b8"
                    transform="rotate(90 960 540)">10.0 M WIDE ROAD</text>

                  {/* ── Slots ── */}
                  {SLOT_LAYOUT.map(s => {
                    const st = slotStyle(s.label)
                    const db = byLabel[s.label]
                    const vehicles = db?.vehicles || []
                    const cx = s.x + s.w / 2
                    return (
                      <g key={s.label} onClick={() => openSlot(s.label)} style={{ cursor: 'pointer' }}>
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="9"
                          fill={st.fill} stroke={st.selected ? '#f59e0b' : st.stroke}
                          strokeWidth={st.selected ? 3.5 : 1.5} />
                        {/* slot number */}
                        <text x={cx} y={s.y + (db?.assignedFlat ? s.h / 2 - 6 : s.h / 2 + 6)}
                          textAnchor="middle" fontSize="19" fontWeight="700" fill={st.text}>
                          {s.label}
                        </text>
                        {/* assigned flat */}
                        {db?.assignedFlat && (
                          <text x={cx} y={s.y + s.h / 2 + 16} textAnchor="middle"
                            fontSize="13" fontWeight="700"
                            fill={st.text === '#ffffff' ? '#e0e7ff' : '#5b52f0'}>
                            {db.assignedFlat}
                          </text>
                        )}
                        {/* vehicle dots */}
                        {vehicles.length > 0 && (
                          <g>
                            {vehicles.slice(0, 5).map((v, i) => (
                              <circle key={i}
                                cx={s.x + 12 + i * 12} cy={s.y + s.h - 10} r="4"
                                fill={st.text === '#ffffff' ? '#ffffff' : typeConf(v.type).color} />
                            ))}
                          </g>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-center" style={{ color: 'var(--ink-4)' }}>
          <Maximize2 size={11} className="inline mb-0.5" /> Pinch or use +/− to zoom · scroll to pan · tap a slot
        </p>
      </div>

      {/* ── Slot Modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={selectedLbl ? `Slot ${selectedLbl}` : 'Slot'}>
        {selectedLbl && (
          <div className="space-y-4">

            {/* Assigned status */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: selectedDb?.assignedFlat ? '#ecfdf5' : 'var(--surface-2)',
                border: `1px solid ${selectedDb?.assignedFlat ? '#6ee7b7' : 'var(--border)'}`,
              }}>
              <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>
                {selectedDb?.assignedFlat
                  ? <>Assigned to <span className="font-bold" style={{ color: '#065f46' }}>Flat {selectedDb.assignedFlat}</span></>
                  : 'Not assigned to any flat yet'}
              </span>
            </div>

            {/* ── Admin: assign flat ── */}
            {isAdmin && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                  Admin · Assign Slot
                </div>
                <input className="input w-full" placeholder="Flat number (e.g. 2H) — blank to unassign"
                  value={assignFlat} onChange={e => setAssignFlat(e.target.value.toUpperCase())} />
                <button onClick={handleSaveAssign} disabled={saving} className="btn-primary w-full justify-center">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}

            {/* ── Vehicles list ── */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>
                Vehicles {selectedDb?.assignedFlat ? `· Flat ${selectedDb.assignedFlat}` : ''}
              </div>
              {(!selectedDb?.vehicles || selectedDb.vehicles.length === 0) ? (
                <div className="text-[12px] text-center py-4 rounded-xl"
                  style={{ color: 'var(--ink-4)', background: 'var(--surface-2)' }}>
                  No vehicles added
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDb.vehicles.map(v => {
                    const conf = typeConf(v.type)
                    const Icon = conf.icon
                    return (
                      <div key={v.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${conf.color}18` }}>
                          <Icon size={15} style={{ color: conf.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{conf.label}</div>
                          {v.numberPlate && <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{v.numberPlate}</div>}
                        </div>
                        {v.isTenant && (
                          <span className="badge text-[9px]" style={{ background: '#fffbeb', color: '#d97706' }}>Tenant</span>
                        )}
                        {canEdit && (
                          <button onClick={() => handleDeleteVehicle(v.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#fff1f2', color: '#e11d48' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Add vehicle (residents of this flat) ── */}
            {canEdit && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#065f46' }}>
                  Add a Vehicle
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VEHICLE_TYPES.map(t => {
                    const Icon = t.icon
                    const active = vType === t.value
                    return (
                      <button key={t.value} onClick={() => setVType(t.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                        style={{
                          background: active ? t.color : 'white',
                          color: active ? 'white' : 'var(--ink-2)',
                          border: `1px solid ${active ? t.color : 'var(--border)'}`,
                        }}>
                        <Icon size={13} /> {t.label}
                      </button>
                    )
                  })}
                </div>
                <input className="input w-full" placeholder="Vehicle number (e.g. TN09AB1234)"
                  value={vNumber} onChange={e => setVNumber(e.target.value.toUpperCase())} />
                {err && (
                  <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>
                )}
                <button onClick={handleAddVehicle} disabled={saving} className="btn-primary w-full justify-center">
                  <Plus size={14} /> {saving ? 'Adding…' : 'Add Vehicle'}
                </button>
              </div>
            )}

            {/* note for non-residents */}
            {!canEdit && !isAdmin && selectedDb?.assignedFlat && (
              <div className="text-[11px] px-3 py-2.5 rounded-xl text-center"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-4)' }}>
                Only residents of Flat {selectedDb.assignedFlat} can add vehicles here.
              </div>
            )}
            {err && (isAdmin || !canEdit) && (
              <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
