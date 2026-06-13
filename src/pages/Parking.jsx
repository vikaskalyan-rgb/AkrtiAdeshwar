import { useState, useEffect, useRef } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'
import { Car, Bike, Plus, Trash2, Save, Minus, RotateCcw } from 'lucide-react'

const VEHICLE_TYPES = [
  { value: 'CAR',     label: 'Car',     icon: Car,  color: '#5b52f0' },
  { value: 'BIKE',    label: 'Bike',    icon: Bike, color: '#059669' },
  { value: 'SCOOTER', label: 'Scooter', icon: Bike, color: '#0284c7' },
  { value: 'CYCLE',   label: 'Cycle',   icon: Bike, color: '#d97706' },
  { value: 'TEMPO',   label: 'Tempo',   icon: Car,  color: '#e11d48' },
]
const typeConf = (t) => VEHICLE_TYPES.find(v => v.value === (t||'').toUpperCase()) || VEHICLE_TYPES[0]

// ─────────────────────────────────────────────────────────────
//  SLOT LAYOUT — pixel-mapped from the brochure screenshots
//  SVG canvas: 900 wide × 980 tall
//  SV = vertical slot (car noses up/down):  w52 h86
//  SH = horizontal slot (car noses left/right): w86 h52
// ─────────────────────────────────────────────────────────────
const SV = { w: 52, h: 86 }
const SH = { w: 86, h: 52 }
const SM = { w: 44, h: 52 }   // small / bike slot

const SLOTS = [
  // ── TOP RIGHT — 38,39,40 near transformer (right side, top) ──
  { id: '40', x: 490, y: 22, ...SV },
  { id: '39', x: 555, y: 22, ...SV },
  { id: '38', x: 700, y: 22, ...SV },

  // ── UPPER CENTRE — row facing DOWN: 25,24,23,22,21,20 ──
  // (Left group: 25,24,23,22 — gap — right group near road: 21,20)
  { id: '25', x: 290, y: 140, ...SV },
  { id: '24', x: 350, y: 140, ...SV },
  { id: '23', x: 430, y: 140, ...SV },
  { id: '22', x: 510, y: 140, ...SV },
  { id: '21', x: 638, y: 140, ...SV },
  { id: '20', x: 700, y: 140, ...SV },

  // ── SECOND CENTRE ROW — facing UP: 26,27,28 ──
  { id: '26', x: 290, y: 236, ...SV },
  { id: '27', x: 390, y: 236, ...SV },
  { id: '28', x: 460, y: 236, ...SV },

  // ── 10a — lone slot right of 28 ──
  { id: '10a', x: 560, y: 236, ...SV },

  // ── RIGHT COLUMN — horizontal, facing left: 20→19→18→17→16→15→15a ──
  { id: '19',  x: 750, y: 208, ...SH },
  { id: '18',  x: 750, y: 272, ...SH },
  { id: '17',  x: 750, y: 336, ...SH },
  { id: '16',  x: 750, y: 400, ...SH },
  { id: '15',  x: 750, y: 464, ...SH },
  { id: '15a', x: 638, y: 464, ...SH },

  // ── LEFT COLUMN — horizontal, facing right: 30,31,32,32a,33,33a,34 ──
  { id: '30',  x: 24,  y: 164, ...SH },
  { id: '31',  x: 24,  y: 268, ...SH },
  { id: '32',  x: 24,  y: 372, ...SH },
  { id: '32a', x: 128, y: 372, ...SM },
  { id: '33',  x: 24,  y: 462, ...SH },
  { id: '33a', x: 128, y: 462, ...SM },
  { id: '34',  x: 24,  y: 546, ...SH },

  // 29 — bike slot next to 31 on the left col
  { id: '29',  x: 128, y: 268, ...SM },

  // ── LEFT BOTTOM — 35,36,37 ──
  { id: '35', x: 24, y: 620, ...SH },
  { id: '36', x: 24, y: 690, ...SH },
  { id: '37', x: 24, y: 760, ...SH },

  // ── CENTRE: LIFT area, then 14a, 14, 13 below ramp ──
  { id: '14a', x: 560, y: 620, ...SV },
  { id: '14',  x: 626, y: 620, ...SV },
  { id: '13',  x: 750, y: 590, ...SH },

  // ── RIGHT BOTTOM column — 12,11,10 ──
  { id: '12', x: 750, y: 668, ...SH },
  { id: '11', x: 750, y: 734, ...SH },
  { id: '10', x: 750, y: 800, ...SH },

  // ── BOTTOM UPPER SUB-ROW — 4a, 5a, 6a (facing down, smaller) ──
  { id: '4a', x: 270, y: 640, ...SV },
  { id: '5a', x: 334, y: 640, ...SV },
  { id: '6a', x: 410, y: 640, ...SV },

  // ── BOTTOM MAIN ROW 1 (upper) — facing up: 1,2,3,4,5,6,7,8,9 ──
  { id: '1', x: 130, y: 760, ...SV },
  { id: '2', x: 196, y: 760, ...SV },
  { id: '3', x: 262, y: 760, ...SV },
  { id: '4', x: 328, y: 760, ...SV },
  { id: '5', x: 394, y: 760, ...SV },
  { id: '6', x: 460, y: 760, ...SV },
  { id: '7', x: 526, y: 760, ...SV },
  { id: '8', x: 592, y: 760, ...SV },
  { id: '9', x: 658, y: 760, ...SV },
]

const VIEW_W = 870
const VIEW_H = 900

export default function Parking() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const isTenant = (user?.identifier || '').includes('_tenant')
  const userFlat = (user?.flatNo || '').toUpperCase()

  const [slots,      setSlots]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selId,      setSelId]      = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [assignFlat, setAssignFlat] = useState('')
  const [vType,      setVType]      = useState('CAR')
  const [vNumber,    setVNumber]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState(null)
  const [zoom,       setZoom]       = useState(0.44)
  const wrapRef = useRef(null)

  useEffect(() => { fetchSlots() }, [])
  useEffect(() => {
    if (!loading && wrapRef.current) {
      const fit = Math.min(1.2, (wrapRef.current.clientWidth - 16) / VIEW_W)
      setZoom(Math.max(0.34, fit))
    }
  }, [loading])

  const fetchSlots = async () => {
    setLoading(true)
    try { const r = await api.get('/api/parking/slots'); setSlots(r.data || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const byId = {}
  slots.forEach(s => { byId[s.label] = s })

  const openSlot = (id) => {
    const db = byId[id]
    setSelId(id)
    setAssignFlat(db?.assignedFlat || '')
    setVType('CAR'); setVNumber(''); setErr(null)
    setShowModal(true)
  }

  const selectedDb = selId ? byId[selId] : null
  const canEdit = !!(selectedDb?.assignedFlat &&
    selectedDb.assignedFlat.toUpperCase() === userFlat)

  const handleSaveAssign = async () => {
    if (!selectedDb) return
    setSaving(true); setErr(null)
    try {
      await api.put(`/api/parking/slots/${selectedDb.id}`, {
        assignedFlat: assignFlat.trim().toUpperCase() || null,
      })
      await fetchSlots(); setShowModal(false)
    } catch { setErr('Could not save') }
    finally { setSaving(false) }
  }

  const handleAddVehicle = async () => {
    if (!selectedDb) return
    setSaving(true); setErr(null)
    try {
      const r = await api.post('/api/parking/vehicles', {
        slotId: selectedDb.id, flatNo: userFlat,
        type: vType, numberPlate: vNumber.trim().toUpperCase(),
        addedBy: user?.identifier, isTenant,
      })
      if (r.data?.error) { setErr(r.data.error); return }
      setVNumber(''); await fetchSlots()
    } catch (e) { setErr(e?.response?.data?.error || 'Could not add vehicle') }
    finally { setSaving(false) }
  }

  const handleDeleteVehicle = async (vid) => {
    try { await api.delete(`/api/parking/vehicles/${vid}`); await fetchSlots() }
    catch (e) { console.error(e) }
  }

  const slotColor = (id) => {
    const db = byId[id]
    if (!db?.assignedFlat) return { fill: '#f8fafc', stroke: '#e2e8f0', text: '#94a3b8' }
    if (db.assignedFlat.toUpperCase() === userFlat)
      return { fill: '#5b52f0', stroke: '#4338ca', text: '#ffffff' }
    return { fill: '#dcfce7', stroke: '#86efac', text: '#166534' }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Parking" subtitle="Society parking layout" />

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Legend + zoom */}
        <div className="card p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {[['#5b52f0','Your slot'],['#dcfce7','Assigned'],['#f8fafc','Empty']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div style={{ width:13, height:13, borderRadius:3, background:c, border:'1.5px solid #cbd5e1' }}/>
                <span className="text-[11px]" style={{ color:'var(--ink-2)' }}>{l}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setZoom(z => Math.max(0.3, +(z-0.08).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <Minus size={14} style={{ color:'var(--ink-2)' }}/>
            </button>
            <button onClick={() => {
              if (wrapRef.current) setZoom(Math.max(0.3, Math.min(1.2, (wrapRef.current.clientWidth-16)/VIEW_W)))
            }} className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <RotateCcw size={13} style={{ color:'var(--ink-2)' }}/>
            </button>
            <button onClick={() => setZoom(z => Math.min(2.4, +(z+0.08).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <Plus size={14} style={{ color:'var(--ink-2)' }}/>
            </button>
            <span className="text-[10px] font-semibold ml-0.5" style={{ color:'var(--ink-3)' }}>
              {Math.round(zoom*100)}%
            </span>
          </div>
        </div>

        {/* Map */}
        <div className="card p-0 overflow-hidden" style={{ borderRadius:16 }}>
          <div ref={wrapRef} style={{ overflow:'auto', background:'#eef0f6', WebkitOverflowScrolling:'touch' }}>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height:260 }}>
                <span className="text-[13px]" style={{ color:'var(--ink-4)' }}>Loading…</span>
              </div>
            ) : (
              <div style={{ width: VIEW_W*zoom, height: VIEW_H*zoom }}>
                <svg width={VIEW_W*zoom} height={VIEW_H*zoom}
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  xmlns="http://www.w3.org/2000/svg">

                  {/* Plot boundary */}
                  <rect x="14" y="8" width={VIEW_W-28} height={VIEW_H-16}
                    rx="12" fill="#e4e8f2" stroke="#c8cfdc" strokeWidth="2"/>

                  {/* Inner paved area */}
                  <rect x="24" y="120" width={VIEW_W-60} height={VIEW_H-160}
                    rx="8" fill="#eaedf5" stroke="#d8dde8" strokeWidth="1"
                    strokeDasharray="4 6"/>

                  {/* Septic tank — top left */}
                  <rect x="30" y="24" width="148" height="86" rx="6"
                    fill="none" stroke="#c8cfdc" strokeWidth="1.5" strokeDasharray="5 4"/>
                  <text x="104" y="64" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">SEPTIC</text>
                  <text x="104" y="76" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">TANK</text>

                  {/* Transformer — top right */}
                  <rect x="746" y="14" width="98" height="38" rx="5"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="795" y="37" textAnchor="middle" fontSize="8" fill="#854d0e" fontWeight="700">TRANSFORMER</text>

                  {/* Security cabin */}
                  <rect x="836" y="62" width="26" height="52" rx="4"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="849" y="84" textAnchor="middle" fontSize="6.5" fill="#854d0e" fontWeight="700">SEC</text>
                  <text x="849" y="96" textAnchor="middle" fontSize="6.5" fill="#854d0e" fontWeight="700">CAB</text>

                  {/* W.TOI */}
                  <rect x="556" y="258" width="68" height="40" rx="5"
                    fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
                  <text x="590" y="283" textAnchor="middle" fontSize="9" fill="#0369a1" fontWeight="600">W.TOI</text>

                  {/* Garden 1 — vertical green patch left of lifts */}
                  <rect x="348" y="322" width="80" height="210" rx="8"
                    fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>
                  <text x="388" y="432" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="600">GARDEN</text>

                  {/* Garden 2 — horizontal green patch right side */}
                  <rect x="476" y="478" width="250" height="36" rx="6"
                    fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>

                  {/* MES panel label */}
                  <text x="448" y="316" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">MES PANEL</text>
                  <text x="448" y="560" textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">MES PANEL</text>

                  {/* Stairs UP — between lifts */}
                  <rect x="438" y="286" width="72" height="30" rx="4"
                    fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="474" y="306" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* LIFT 1 — upper */}
                  <rect x="438" y="326" width="72" height="64" rx="7"
                    fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x="474" y="365" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* LIFT 2 — lower (below garden) */}
                  <rect x="438" y="540" width="72" height="64" rx="7"
                    fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x="474" y="579" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* Stairs 2 */}
                  <rect x="438" y="612" width="72" height="30" rx="4"
                    fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="474" y="632" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* Ramp entry (right-side, mid) */}
                  <rect x="548" y="518" width="196" height="48" rx="5"
                    fill="#dde3ed" stroke="#c8d0dc" strokeWidth="1.5"/>
                  {[0,1,2,3,4,5].map(i => (
                    <rect key={i} x={556+i*31} y="525" width="16" height="34" rx="2" fill="#fbbf24"/>
                  ))}
                  <text x="646" y="582" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">RAMP</text>

                  {/* Gate */}
                  <rect x="846" y="518" width="12" height="48" rx="3" fill="#e11d48"/>
                  <text x="862" y="548" textAnchor="middle" fontSize="8" fill="#e11d48"
                    fontWeight="700" transform="rotate(90 862 548)">GATE</text>

                  {/* Road label */}
                  <text x="856" y="780" textAnchor="middle" fontSize="8" fill="#94a3b8"
                    fontWeight="600" transform="rotate(90 856 780)">10.0M WIDE ROAD</text>

                  {/* ── SLOTS ── */}
                  {SLOTS.map(s => {
                    const col = slotColor(s.id)
                    const db  = byId[s.id]
                    const isSel = s.id === selId
                    const vcount = db?.vehicles?.length || 0
                    const cx = s.x + s.w / 2
                    const cy = s.y + s.h / 2

                    return (
                      <g key={s.id} onClick={() => openSlot(s.id)} style={{ cursor: 'pointer' }}>
                        {/* slot box */}
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="7"
                          fill={col.fill}
                          stroke={isSel ? '#f59e0b' : col.stroke}
                          strokeWidth={isSel ? 3 : 1.5}/>

                        {/* slot number */}
                        <text
                          x={cx}
                          y={db?.assignedFlat ? cy - 5 : cy + 5}
                          textAnchor="middle"
                          fontSize={s.w < 50 ? 10 : 13}
                          fontWeight="800"
                          fill={col.text}>
                          {s.id}
                        </text>

                        {/* assigned flat label */}
                        {db?.assignedFlat && (
                          <text x={cx} y={cy + 10} textAnchor="middle"
                            fontSize={s.w < 50 ? 8 : 10} fontWeight="700"
                            fill={col.text === '#ffffff' ? '#c7d2fe' : '#16a34a'}>
                            {db.assignedFlat}
                          </text>
                        )}

                        {/* vehicle count badge */}
                        {vcount > 0 && (
                          <>
                            <circle cx={s.x + s.w - 9} cy={s.y + 9} r="8"
                              fill={col.text === '#ffffff' ? 'rgba(255,255,255,0.25)' : '#5b52f0'}/>
                            <text x={s.x + s.w - 9} y={s.y + 13}
                              textAnchor="middle" fontSize="8" fontWeight="800" fill="#ffffff">
                              {vcount}
                            </text>
                          </>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-center pb-2" style={{ color: 'var(--ink-4)' }}>
          Scroll to pan · +/− to zoom · tap a slot
        </p>
      </div>

      {/* ── Modal ── */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={selId ? `Slot ${selId}` : 'Slot'}>
        {selId && (
          <div className="space-y-4">

            <div className="px-3 py-2.5 rounded-xl text-[12px]"
              style={{
                background: selectedDb?.assignedFlat ? '#f0fdf4' : 'var(--surface-2)',
                border: `1px solid ${selectedDb?.assignedFlat ? '#86efac' : 'var(--border)'}`,
                color: selectedDb?.assignedFlat ? '#166534' : 'var(--ink-3)',
              }}>
              {selectedDb?.assignedFlat
                ? <>Assigned to <strong>Flat {selectedDb.assignedFlat}</strong></>
                : 'Not assigned to any flat yet'}
            </div>

            {/* Admin assign */}
            {isAdmin && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: 'var(--ink-3)' }}>Admin · Assign Flat</div>
                <input className="input w-full"
                  placeholder="Flat no. (e.g. 2H) — blank to unassign"
                  value={assignFlat}
                  onChange={e => setAssignFlat(e.target.value.toUpperCase())}/>
                <button onClick={handleSaveAssign} disabled={saving}
                  className="btn-primary w-full justify-center">
                  <Save size={14}/> {saving ? 'Saving…' : 'Save'}
                </button>
                {err && <div className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>}
              </div>
            )}

            {/* Vehicles */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-2"
                style={{ color: 'var(--ink-3)' }}>
                Vehicles{selectedDb?.assignedFlat ? ` · Flat ${selectedDb.assignedFlat}` : ''}
              </div>
              {(!selectedDb?.vehicles || selectedDb.vehicles.length === 0) ? (
                <div className="text-[12px] text-center py-4 rounded-xl"
                  style={{ color: 'var(--ink-4)', background: 'var(--surface-2)' }}>
                  No vehicles added yet
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
                          <Icon size={15} style={{ color: conf.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{conf.label}</div>
                          {v.numberPlate && <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{v.numberPlate}</div>}
                        </div>
                        {v.isTenant && (
                          <span className="badge text-[9px]"
                            style={{ background: '#fffbeb', color: '#d97706' }}>Tenant</span>
                        )}
                        {canEdit && (
                          <button onClick={() => handleDeleteVehicle(v.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#fff1f2', color: '#e11d48' }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add vehicle */}
            {canEdit && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide"
                  style={{ color: '#166534' }}>Add a Vehicle</div>
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
                        <Icon size={13}/> {t.label}
                      </button>
                    )
                  })}
                </div>
                <input className="input w-full"
                  placeholder="Vehicle number (e.g. TN09AB1234)"
                  value={vNumber}
                  onChange={e => setVNumber(e.target.value.toUpperCase())}/>
                {err && <div className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>}
                <button onClick={handleAddVehicle} disabled={saving}
                  className="btn-primary w-full justify-center">
                  <Plus size={14}/> {saving ? 'Adding…' : 'Add Vehicle'}
                </button>
              </div>
            )}

            {!canEdit && !isAdmin && selectedDb?.assignedFlat && (
              <div className="text-[11px] px-3 py-2.5 rounded-xl text-center"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-4)' }}>
                Only residents of Flat {selectedDb.assignedFlat} can manage vehicles here.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}