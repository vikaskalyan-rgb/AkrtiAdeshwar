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
const typeConf = t => VEHICLE_TYPES.find(v => v.value === (t||'').toUpperCase()) || VEHICLE_TYPES[0]

// ─────────────────────────────────────────────────────────────
//  SLOT LAYOUT — re-mapped carefully from brochure screenshots
//
//  Canvas: 920 × 1020
//  Reading the brochure top→bottom, left→right:
//
//  TOP AREA (y 30-130):
//    39, 40 = top centre (vertical, facing down)
//    38 = top right near transformer (vertical)
//
//  UPPER ZONE (y 140-320):
//    LEFT COL (horizontal facing right): 30 @ y155, 31 @ y250, 29(sm) next to 31
//    CENTRE ROW 1 (vertical facing down): 25,24,23,22 @ y140, then gap, 21,20 further right
//    CENTRE ROW 2 (vertical facing up):   26,27,28 @ y236
//    10a = lone slot right of 28
//    RIGHT COL (horizontal facing left):  20 same row as upper centre right
//                                         19,18,17,16,15 stacked down
//
//  MIDDLE ZONE (y 320-580):
//    LEFT COL: 32,32a @ y355  |  33,33a @ y445  |  34 @ y525
//    CENTRE: Garden patch (vertical) | Lift 1 to its right | W.TOI right of that
//    RIGHT COL: 15a @ y465 (same height as 33), then gap for ramp
//
//  LOWER ZONE (y 580-900):
//    LEFT COL: 35 @ y590, 36 @ y660, 37 @ y730
//    CENTRE-LEFT: 4a,5a,6a (small, facing down) @ y640
//    CENTRE-RIGHT: 14a, 14 @ y640 | Garden patch 2 (horiz)
//    RIGHT COL: 13 @ y590, 12 @ y668, 11 @ y748, 10 @ y828
//    BOTTOM ROWS: 1,2,3,4 (left group) | 5,6,7,8,9 (right group) @ y830-900
// ─────────────────────────────────────────────────────────────

const SV = { w: 54, h: 90 }   // vertical slot
const SH = { w: 90, h: 54 }   // horizontal slot
const SM = { w: 46, h: 54 }   // small/bike slot

const SLOTS = [
  // ── TOP STRIP — 39,40,38 all top-right near transformer ──
  { id: '39', x: 588, y: 24, ...SV },
  { id: '40', x: 648, y: 24, ...SV },
  { id: '38', x: 710, y: 24, ...SV },

  // ── UPPER CENTRE ROW 1 (facing down) ─────────────────────
  { id: '25', x: 236, y: 140, ...SV },
  { id: '24', x: 298, y: 140, ...SV },
  { id: '23', x: 374, y: 140, ...SV },
  { id: '22', x: 450, y: 140, ...SV },
  { id: '21', x: 580, y: 140, ...SV },
  { id: '20', x: 648, y: 140, ...SV },

  // ── UPPER CENTRE ROW 2 (facing up) ───────────────────────
  { id: '26', x: 236, y: 242, ...SV },
  { id: '27', x: 344, y: 242, ...SV },
  { id: '28', x: 418, y: 242, ...SV },
  { id: '10a',x: 520, y: 242, ...SV },

  // ── RIGHT COLUMN (horizontal, facing left) ────────────────
  { id: '19', x: 742, y: 148, ...SH },
  { id: '18', x: 742, y: 214, ...SH },
  { id: '17', x: 742, y: 280, ...SH },
  { id: '16', x: 742, y: 346, ...SH },
  { id: '15', x: 742, y: 412, ...SH },
  // 15a is LEFT of 15, same y
  { id: '15a', x: 638, y: 412, ...SH },

  // ── LEFT COLUMN (horizontal, facing right) ────────────────
  { id: '30',  x: 22, y: 148, ...SH },
  { id: '31',  x: 22, y: 248, ...SH },
  { id: '29',  x: 122, y: 248, ...SM },
  { id: '32',  x: 22, y: 356, ...SH },
  { id: '32a', x: 122, y: 356, ...SM },
  { id: '33',  x: 22, y: 448, ...SH },
  { id: '33a', x: 122, y: 448, ...SM },
  { id: '34',  x: 22, y: 528, ...SH },

  // ── LEFT BOTTOM COLUMN ────────────────────────────────────
  { id: '35', x: 22, y: 616, ...SH },
  { id: '36', x: 22, y: 690, ...SH },
  { id: '37', x: 22, y: 764, ...SH },

  // ── CENTRE RIGHT — 13 below ramp, 14a/14 lower ──────────
  { id: '13',  x: 742, y: 596, ...SH },
  { id: '14a', x: 548, y: 660, ...SV },
  { id: '14',  x: 614, y: 660, ...SV },

  // ── RIGHT BOTTOM COLUMN ───────────────────────────────────
  { id: '12', x: 742, y: 666, ...SH },
  { id: '11', x: 742, y: 736, ...SH },
  { id: '10', x: 742, y: 806, ...SH },

  // ── BOTTOM UPPER SUB-ROW (4a,5a,6a above main rows) ──────
  { id: '4a', x: 226, y: 660, ...SV },
  { id: '5a', x: 292, y: 660, ...SV },
  { id: '6a', x: 376, y: 660, ...SV },

  // ── BOTTOM MAIN ROWS ─────────────────────────────────────
  { id: '1', x: 130, y: 784, ...SV },
  { id: '2', x: 196, y: 784, ...SV },
  { id: '3', x: 262, y: 784, ...SV },
  { id: '4', x: 328, y: 784, ...SV },
  { id: '5', x: 394, y: 784, ...SV },
  { id: '6', x: 460, y: 784, ...SV },
  { id: '7', x: 526, y: 784, ...SV },
  { id: '8', x: 592, y: 764, ...SV },
  { id: '9', x: 658, y: 764, ...SV },
]

const VIEW_W = 862
const VIEW_H = 890

// ════════════════════════════════════════════════════════════
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

  const openSlot = id => {
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

  const handleDeleteVehicle = async vid => {
    try { await api.delete(`/api/parking/vehicles/${vid}`); await fetchSlots() }
    catch (e) { console.error(e) }
  }

  const slotColor = id => {
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
            <button onClick={() => setZoom(z => Math.max(0.28, +(z-0.08).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <Minus size={14} style={{ color:'var(--ink-2)' }}/>
            </button>
            <button onClick={() => {
              if (wrapRef.current) setZoom(Math.max(0.28, Math.min(1.2, (wrapRef.current.clientWidth-16)/VIEW_W)))
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
                  <rect x="12" y="6" width={VIEW_W-24} height={VIEW_H-12}
                    rx="14" fill="#e4e8f2" stroke="#c8cfdc" strokeWidth="2"/>

                  {/* Septic tank — top left */}
                  <rect x="28" y="20" width="156" height="100" rx="7"
                    fill="none" stroke="#c0c8d8" strokeWidth="1.5" strokeDasharray="5 4"/>
                  <text x="106" y="68" textAnchor="middle" fontSize="9" fill="#a0aec0" fontWeight="600">SEPTIC TANK</text>

                  {/* Transformer — top right */}
                  <rect x="748" y="10" width="100" height="36" rx="5"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="798" y="32" textAnchor="middle" fontSize="8" fill="#854d0e" fontWeight="700">TRANSFORMER</text>

                  {/* Security cabin */}
                  <rect x="840" y="54" width="18" height="54" rx="4"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="849" y="74" textAnchor="middle" fontSize="6" fill="#854d0e" fontWeight="700">SEC</text>
                  <text x="849" y="86" textAnchor="middle" fontSize="6" fill="#854d0e" fontWeight="700">CAB</text>

                  {/* Gate — right edge mid */}
                  <rect x="850" y="484" width="10" height="56" rx="3" fill="#e11d48"/>
                  <text x="848" y="480" textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="700">GATE</text>

                  {/* W.TOI box — right of 10a */}
                  <rect x="608" y="250" width="68" height="40" rx="5"
                    fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
                  <text x="642" y="275" textAnchor="middle" fontSize="9" fill="#0369a1" fontWeight="600">W.TOI</text>

                  {/* Garden patch 1 — vertical green strip, centre of plot */}
                  <rect x="310" y="328" width="90" height="220" rx="9"
                    fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>
                  <text x="355" y="442" textAnchor="middle" fontSize="9" fill="#15803d" fontWeight="600">GARDEN</text>

                  {/* Garden patch 2 — horizontal green, right-centre */}
                  <rect x="448" y="478" width="266" height="40" rx="7"
                    fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>

                  {/* Ramp — below garden 2 leading to gate */}
                  <rect x="448" y="526" width="260" height="50" rx="5"
                    fill="#dde3ed" stroke="#c8d0dc" strokeWidth="1.5"/>
                  {[0,1,2,3,4,5,6].map(i => (
                    <rect key={i} x={456+i*33} y="533" width="16" height="36" rx="2" fill="#fbbf24"/>
                  ))}
                  <text x="578" y="594" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="600">RAMP / ENTRY</text>

                  {/* MES panel labels */}
                  <text x="430" y="324" textAnchor="middle" fontSize="7" fill="#94a3b8">MES PANEL</text>
                  <text x="430" y="560" textAnchor="middle" fontSize="7" fill="#94a3b8">MES PANEL</text>

                  {/* Stairs UP upper */}
                  <rect x="420" y="330" width="70" height="28" rx="4"
                    fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="455" y="349" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* LIFT 1 — upper, RIGHT of garden */}
                  <rect x="420" y="366" width="70" height="66" rx="7"
                    fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x="455" y="406" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* LIFT 2 — lower, RIGHT of garden */}
                  <rect x="420" y="530" width="70" height="66" rx="7"
                    fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x="455" y="570" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* Stairs UP lower */}
                  <rect x="420" y="604" width="70" height="28" rx="4"
                    fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="455" y="623" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* Road label */}
                  <text x="858" y="750" textAnchor="middle" fontSize="8" fill="#94a3b8"
                    fontWeight="600" transform="rotate(90 858 750)">10.0M WIDE ROAD</text>

                  {/* ── SLOTS ── */}
                  {SLOTS.map(s => {
                    const col = slotColor(s.id)
                    const db  = byId[s.id]
                    const isSel = s.id === selId
                    const vcount = db?.vehicles?.length || 0
                    const cx = s.x + s.w / 2
                    const cy = s.y + s.h / 2
                    const fontSize = s.w < 50 ? 10 : 13

                    return (
                      <g key={s.id} onClick={() => openSlot(s.id)} style={{ cursor:'pointer' }}>
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="7"
                          fill={col.fill}
                          stroke={isSel ? '#f59e0b' : col.stroke}
                          strokeWidth={isSel ? 3 : 1.5}/>
                        <text x={cx} y={db?.assignedFlat ? cy-5 : cy+5}
                          textAnchor="middle" fontSize={fontSize} fontWeight="800" fill={col.text}>
                          {s.id}
                        </text>
                        {db?.assignedFlat && (
                          <text x={cx} y={cy+10} textAnchor="middle"
                            fontSize={s.w < 50 ? 8 : 10} fontWeight="700"
                            fill={col.text === '#ffffff' ? '#c7d2fe' : '#16a34a'}>
                            {db.assignedFlat}
                          </text>
                        )}
                        {vcount > 0 && (
                          <>
                            <circle cx={s.x+s.w-9} cy={s.y+9} r="8"
                              fill={col.text === '#ffffff' ? 'rgba(255,255,255,0.3)' : '#5b52f0'}/>
                            <text x={s.x+s.w-9} y={s.y+13}
                              textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">
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

        <p className="text-[11px] text-center pb-2" style={{ color:'var(--ink-4)' }}>
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

            {isAdmin && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>
                  Admin · Assign Flat
                </div>
                <input className="input w-full"
                  placeholder="Flat no. (e.g. 2H) — blank to unassign"
                  value={assignFlat} onChange={e => setAssignFlat(e.target.value.toUpperCase())}/>
                <button onClick={handleSaveAssign} disabled={saving} className="btn-primary w-full justify-center">
                  <Save size={14}/> {saving ? 'Saving…' : 'Save'}
                </button>
                {err && <div className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ background:'#fff1f2', color:'#9f1239' }}>{err}</div>}
              </div>
            )}

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color:'var(--ink-3)' }}>
                Vehicles{selectedDb?.assignedFlat ? ` · Flat ${selectedDb.assignedFlat}` : ''}
              </div>
              {(!selectedDb?.vehicles || selectedDb.vehicles.length === 0) ? (
                <div className="text-[12px] text-center py-4 rounded-xl"
                  style={{ color:'var(--ink-4)', background:'var(--surface-2)' }}>
                  No vehicles added yet
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDb.vehicles.map(v => {
                    const conf = typeConf(v.type)
                    const Icon = conf.icon
                    return (
                      <div key={v.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background:`${conf.color}18` }}>
                          <Icon size={15} style={{ color:conf.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color:'var(--ink)' }}>{conf.label}</div>
                          {v.numberPlate && <div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{v.numberPlate}</div>}
                        </div>
                        {v.isTenant && (
                          <span className="badge text-[9px]" style={{ background:'#fffbeb', color:'#d97706' }}>Tenant</span>
                        )}
                        {canEdit && (
                          <button onClick={() => handleDeleteVehicle(v.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background:'#fff1f2', color:'#e11d48' }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {canEdit && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background:'#f0fdf4', border:'1px solid #86efac' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'#166534' }}>
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
                        <Icon size={13}/> {t.label}
                      </button>
                    )
                  })}
                </div>
                <input className="input w-full" placeholder="Vehicle number (e.g. TN09AB1234)"
                  value={vNumber} onChange={e => setVNumber(e.target.value.toUpperCase())}/>
                {err && <div className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ background:'#fff1f2', color:'#9f1239' }}>{err}</div>}
                <button onClick={handleAddVehicle} disabled={saving} className="btn-primary w-full justify-center">
                  <Plus size={14}/> {saving ? 'Adding…' : 'Add Vehicle'}
                </button>
              </div>
            )}

            {!canEdit && !isAdmin && selectedDb?.assignedFlat && (
              <div className="text-[11px] px-3 py-2.5 rounded-xl text-center"
                style={{ background:'var(--surface-2)', color:'var(--ink-4)' }}>
                Only residents of Flat {selectedDb.assignedFlat} can manage vehicles here.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}