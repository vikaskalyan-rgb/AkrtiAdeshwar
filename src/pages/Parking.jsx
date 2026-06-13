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
// FINAL CORRECT LAYOUT from brochure photo:
//
// TOP STRIP (y=16):
//   39 @ x=390, 40 @ x=448  (top centre, above garden1)
//   38 @ x=630  (top right, near transformer)
//   Transformer top-right, SecCabin far right bottom
//
// UPPER ROWS (y=104..196):
//   Row1↓: 25@158  24@214  23@270  22@326  |gap|  21@490  20@546
//   Row2↑: 26@158  27@214  28@270  10a@326
//   W.TOI: x=390 y=204 (in garden corridor, between rows)
//
// MIDDLE (y=286..530):
//   Left col: 30..34 (horiz)
//   Garden1 (VERTICAL): x=376 y=286 w=70 h=210
//   Lift zone: x=456 (right of garden1)
//     - MES+stairs y=286
//     - LIFT1 y=304 h=66
//     - Ramp (yellow stripes) y=372→y=430
//     - LIFT2 y=432 h=66
//     - MES+stairs y=500
//   RIGHT of lift zone:
//     15a @ x=530 y=302 (horiz, above ramp)
//     15  @ x=622 y=302 (horiz)
//     16  @ x=700 y=286 (right col)
//   Garden2a (horiz, UPPER): x=530 y=372 w=200 h=30  ← between 15a/15 and gate
//   Road/ramp (grey): x=530 y=404 w=200 h=26
//   Garden2b (horiz, LOWER): x=530 y=432 w=200 h=30  ← at lift2 level
//   Gate: far RIGHT at y=372..462 (right boundary wall)
//
// LOWER (y=530..820):
//   35,36,37 left col
//   4a,5a,6a centre-left small slots
//   13,14a,14,12,11,10 right area
//   Bottom row: 1-9
// ─────────────────────────────────────────────────────────────

const SV  = { w:50, h:80 }
const SH  = { w:80, h:50 }
const SM  = { w:44, h:50 }
const SMV = { w:44, h:68 }

// Garden1 (vertical)
const G1X=376, G1Y=286, G1W=70, G1H=212
// Lift
const LX=456, LW=62, LH=66
const L1Y=304, L2Y=456
// Garden2 upper strip — starts right of lift (x=518), y=396 (below 15a bottom: 344+50=394)
const G2AX=518, G2AY=396, G2AW=202, G2AH=30
// Road between gardens
const ROAD_Y=428, ROAD_H=24
// Garden2 lower strip — at lift2 level
const G2BX=518, G2BY=454, G2BW=202, G2BH=30
// Gate at right boundary
const GATE_X=724, GATE_Y=396, GATE_H=88

const SLOTS = [
  // TOP STRIP
  { id:'39', x:390, y:16, ...SV },
  { id:'40', x:448, y:16, ...SV },
  { id:'38', x:630, y:16, ...SV },

  // ROW 1 ↓
  { id:'25', x:158, y:104, ...SV },
  { id:'24', x:214, y:104, ...SV },
  { id:'23', x:270, y:104, ...SV },
  { id:'22', x:326, y:104, ...SV },
  { id:'21', x:490, y:104, ...SV },
  { id:'20', x:546, y:104, ...SV },

  // ROW 2 ↑
  { id:'26',  x:158, y:196, ...SV },
  { id:'27',  x:214, y:196, ...SV },
  { id:'28',  x:270, y:196, ...SV },
  { id:'10a', x:326, y:196, ...SV },

  // RIGHT COLUMN
  { id:'19',  x:700, y:104, ...SH },
  { id:'18',  x:700, y:160, ...SH },
  { id:'17',  x:700, y:216, ...SH },
  { id:'16',  x:700, y:286, ...SH },
  // 15a and 15: right of ramp zone, at upper garden strip level
  { id:'15a', x:532, y:344, ...SH },
  { id:'15',  x:624, y:344, ...SH },
  // Lower right col
  { id:'13',  x:700, y:534, ...SH },
  { id:'12',  x:700, y:596, ...SH },
  { id:'11',  x:700, y:658, ...SH },
  { id:'10',  x:700, y:720, ...SH },

  // LEFT COLUMN
  { id:'30',  x:18, y:104, ...SH },
  { id:'31',  x:18, y:200, ...SH },
  { id:'29',  x:106, y:200, ...SM },
  { id:'32',  x:18, y:288, ...SH },
  { id:'32a', x:106, y:288, ...SM },
  { id:'33',  x:18, y:366, ...SH },
  { id:'33a', x:106, y:366, ...SM },
  { id:'34',  x:18, y:440, ...SH },
  { id:'35',  x:18, y:518, ...SH },
  { id:'36',  x:18, y:592, ...SH },
  { id:'37',  x:18, y:666, ...SH },

  // LOWER CENTRE
  { id:'4a',  x:158, y:602, ...SMV },
  { id:'5a',  x:210, y:602, ...SMV },
  { id:'6a',  x:268, y:602, ...SMV },
  { id:'14a', x:456, y:602, ...SV },
  { id:'14',  x:512, y:602, ...SV },

  // BOTTOM ROW
  { id:'1', x:106, y:716, ...SV },
  { id:'2', x:158, y:716, ...SV },
  { id:'3', x:210, y:716, ...SV },
  { id:'4', x:262, y:716, ...SV },
  { id:'5', x:314, y:716, ...SV },
  { id:'6', x:366, y:716, ...SV },
  { id:'7', x:418, y:716, ...SV },
  { id:'8', x:470, y:716, ...SV },
  { id:'9', x:522, y:716, ...SV },
]

const VIEW_W = 900
const VIEW_H = 832

export default function Parking() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const isTenant = (user?.identifier || '').includes('_tenant')
  const userFlat = (user?.flatNo || '').toUpperCase()

  const [slots,     setSlots]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selId,     setSelId]     = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [assignFlat,setAssignFlat]= useState('')
  const [vType,     setVType]     = useState('CAR')
  const [vNumber,   setVNumber]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState(null)
  const [zoom,      setZoom]      = useState(0.44)
  const wrapRef = useRef(null)

  useEffect(() => { fetchSlots() }, [])
  useEffect(() => {
    if (!loading && wrapRef.current) {
      const fit = Math.min(1.2,(wrapRef.current.clientWidth-16)/VIEW_W)
      setZoom(Math.max(0.34,fit))
    }
  }, [loading])

  const fetchSlots = async () => {
    setLoading(true)
    try { const r = await api.get('/api/parking/slots'); setSlots(r.data||[]) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const byId = {}
  slots.forEach(s => { byId[s.label]=s })

  const openSlot = id => {
    const db=byId[id]; setSelId(id); setAssignFlat(db?.assignedFlat||'')
    setVType('CAR'); setVNumber(''); setErr(null); setShowModal(true)
  }

  const selectedDb = selId ? byId[selId] : null
  const canEdit = !!(selectedDb?.assignedFlat &&
    selectedDb.assignedFlat.toUpperCase() === userFlat)

  const handleSaveAssign = async () => {
    if (!selectedDb) return; setSaving(true); setErr(null)
    try {
      await api.put(`/api/parking/slots/${selectedDb.id}`,
        { assignedFlat: assignFlat.trim().toUpperCase()||null })
      await fetchSlots(); setShowModal(false)
    } catch { setErr('Could not save') } finally { setSaving(false) }
  }

  const handleAddVehicle = async () => {
    if (!selectedDb) return; setSaving(true); setErr(null)
    try {
      const r = await api.post('/api/parking/vehicles', {
        slotId: selectedDb.id, flatNo: userFlat, type: vType,
        numberPlate: vNumber.trim().toUpperCase(),
        addedBy: user?.identifier, isTenant,
      })
      if (r.data?.error) { setErr(r.data.error); return }
      setVNumber(''); await fetchSlots()
    } catch(e) { setErr(e?.response?.data?.error||'Could not add vehicle') }
    finally { setSaving(false) }
  }

  const handleDeleteVehicle = async vid => {
    try { await api.delete(`/api/parking/vehicles/${vid}`); await fetchSlots() }
    catch(e) { console.error(e) }
  }

  const slotColor = id => {
    const db=byId[id]
    if (!db?.assignedFlat) return { fill:'#f8fafc', stroke:'#e2e8f0', text:'#94a3b8' }
    if (db.assignedFlat.toUpperCase()===userFlat) return { fill:'#5b52f0', stroke:'#4338ca', text:'#ffffff' }
    return { fill:'#dcfce7', stroke:'#86efac', text:'#166534' }
  }

  const rampTop = L1Y+LH+2
  const rampBot = L2Y-2
  const rampH   = rampBot-rampTop
  const nStripe = Math.max(1, Math.floor(rampH/13))

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Parking" subtitle="Society parking layout" />
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        <div className="card p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {[['#5b52f0','Your slot'],['#dcfce7','Assigned'],['#f8fafc','Empty']].map(([c,l])=>(
              <div key={l} className="flex items-center gap-1.5">
                <div style={{ width:13,height:13,borderRadius:3,background:c,border:'1.5px solid #cbd5e1' }}/>
                <span className="text-[11px]" style={{ color:'var(--ink-2)' }}>{l}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={()=>setZoom(z=>Math.max(0.28,+(z-0.08).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)',border:'1px solid var(--border)' }}>
              <Minus size={14} style={{ color:'var(--ink-2)' }}/>
            </button>
            <button onClick={()=>{ if(wrapRef.current) setZoom(Math.max(0.28,Math.min(1.2,(wrapRef.current.clientWidth-16)/VIEW_W))) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)',border:'1px solid var(--border)' }}>
              <RotateCcw size={13} style={{ color:'var(--ink-2)' }}/>
            </button>
            <button onClick={()=>setZoom(z=>Math.min(2.4,+(z+0.08).toFixed(2)))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background:'var(--surface-2)',border:'1px solid var(--border)' }}>
              <Plus size={14} style={{ color:'var(--ink-2)' }}/>
            </button>
            <span className="text-[10px] font-semibold ml-0.5" style={{ color:'var(--ink-3)' }}>
              {Math.round(zoom*100)}%
            </span>
          </div>
        </div>

        <div className="card p-0 overflow-hidden" style={{ borderRadius:16 }}>
          <div ref={wrapRef} style={{ overflow:'auto',background:'#eef0f6',WebkitOverflowScrolling:'touch' }}>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height:260 }}>
                <span className="text-[13px]" style={{ color:'var(--ink-4)' }}>Loading…</span>
              </div>
            ) : (
              <div style={{ width:VIEW_W*zoom, height:VIEW_H*zoom }}>
                <svg width={VIEW_W*zoom} height={VIEW_H*zoom}
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} xmlns="http://www.w3.org/2000/svg">

                  <rect x="10" y="6" width={VIEW_W-20} height={VIEW_H-12}
                    rx="14" fill="#e4e8f2" stroke="#c8cfdc" strokeWidth="2"/>

                  {/* SEPTIC TANK */}
                  <rect x="22" y="14" width="124" height="76" rx="7"
                    fill="none" stroke="#b0bec8" strokeWidth="1.5" strokeDasharray="5 4"/>
                  <text x="84" y="49" textAnchor="middle" fontSize="9" fill="#a0aec0" fontWeight="600">SEPTIC</text>
                  <text x="84" y="62" textAnchor="middle" fontSize="9" fill="#a0aec0" fontWeight="600">TANK</text>

                  {/* TRANSFORMER */}
                  <rect x="700" y="8" width="148" height="26" rx="5"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="774" y="24" textAnchor="middle" fontSize="8" fill="#854d0e" fontWeight="700">TRANSFORMER</text>

                  {/* SEC CABIN */}
                  <rect x="852" y="40" width="20" height="46" rx="4"
                    fill="#fef9c3" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="862" y="58" textAnchor="middle" fontSize="6" fill="#854d0e" fontWeight="700">SEC</text>
                  <text x="862" y="70" textAnchor="middle" fontSize="6" fill="#854d0e" fontWeight="700">CAB</text>

                  {/* W.TOI */}
                  <rect x={G1X+2} y="204" width={G1W-4} height="28" rx="5"
                    fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1.5"/>
                  <text x={G1X+G1W/2} y="216" textAnchor="middle" fontSize="8" fill="#0369a1" fontWeight="600">W.TOI</text>
                  <text x={G1X+G1W/2} y="228" textAnchor="middle" fontSize="7" fill="#0369a1">4′×6′</text>

                  {/* GARDEN 1 — vertical */}
                  <rect x={G1X} y={G1Y} width={G1W} height={G1H}
                    rx="8" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>
                  {[[411,308],[399,336],[423,336],[411,366],[399,396],[423,396],[411,426],[411,470]]
                    .map(([cx,cy],i)=>(
                    <circle key={i} cx={cx} cy={cy} r="10" fill="#4ade80" opacity="0.5"/>
                  ))}
                  <text x={G1X+G1W/2} y={G1Y+G1H/2+4}
                    textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="700">GARDEN</text>

                  {/* MES PANEL upper + stairs */}
                  <text x={LX+LW/2} y={G1Y-4} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="600">MES PANEL</text>
                  <rect x={LX} y={G1Y} width={LW} height="16" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x={LX+LW/2} y={G1Y+12} textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* LIFT 1 */}
                  <rect x={LX} y={L1Y} width={LW} height={LH} rx="7" fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x={LX+LW/2} y={L1Y+LH/2+5} textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* RAMP stripes between lifts */}
                  <rect x={LX} y={rampTop} width={LW} height={rampH} rx="3" fill="#dde3ed" stroke="#c8d0dc" strokeWidth="1"/>
                  {Array.from({length:nStripe}).map((_,i)=>(
                    <rect key={i} x={LX+5} y={rampTop+4+i*13} width={LW-10} height="7" rx="2" fill="#fbbf24" opacity="0.8"/>
                  ))}

                  {/* GARDEN 2A — upper horizontal strip */}
                  <rect x={G2AX} y={G2AY} width={G2AW} height={G2AH}
                    rx="6" fill="#86efac" stroke="#4ade80" strokeWidth="1.5"/>
                  {[538,580,622,664,706].map((cx,i)=>(
                    <circle key={i} cx={cx} cy={G2AY+G2AH/2} r="8" fill="#22c55e" opacity="0.6"/>
                  ))}

                  {/* ROAD between the two garden strips */}
                  <rect x={G2AX} y={ROAD_Y} width={G2AW} height={ROAD_H}
                    rx="0" fill="#d1d5db" opacity="0.6"/>

                  {/* GARDEN 2B — lower horizontal strip */}
                  <rect x={G2BX} y={G2BY} width={G2BW} height={G2BH}
                    rx="6" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5"/>
                  {[538,580,622,664,706].map((cx,i)=>(
                    <circle key={i} cx={cx} cy={G2BY+G2BH/2} r="8" fill="#4ade80" opacity="0.55"/>
                  ))}

                  {/* GATE — right boundary wall, spanning both garden strips */}
                  <rect x={GATE_X} y={GATE_Y-4} width="12" height={GATE_H+8} rx="3" fill="#e11d48"/>
                  <text x={GATE_X+6} y={GATE_Y-8} textAnchor="middle" fontSize="8" fill="#e11d48" fontWeight="700">GATE</text>

                  {/* LIFT 2 */}
                  <rect x={LX} y={L2Y} width={LW} height={LH} rx="7" fill="#ddd6fe" stroke="#a78bfa" strokeWidth="2"/>
                  <text x={LX+LW/2} y={L2Y+LH/2+5} textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="800">LIFT</text>

                  {/* MES PANEL lower + stairs */}
                  <text x={LX+LW/2} y={L2Y+LH+12} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="600">MES PANEL</text>
                  <rect x={LX} y={L2Y+LH+15} width={LW} height="16" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x={LX+LW/2} y={L2Y+LH+27} textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">UP ↑</text>

                  {/* ROAD label */}
                  <text x="876" y="560" textAnchor="middle" fontSize="8" fill="#94a3b8"
                    fontWeight="600" transform="rotate(90 876 560)">10.0M WIDE ROAD</text>

                  {/* SLOTS */}
                  {SLOTS.map(s=>{
                    const col=slotColor(s.id), db=byId[s.id]
                    const isSel=s.id===selId, vcount=db?.vehicles?.length||0
                    const cx=s.x+s.w/2, cy=s.y+s.h/2
                    const small=s.w<48||s.h<60, fz=small?9:11
                    return (
                      <g key={s.id} onClick={()=>openSlot(s.id)} style={{ cursor:'pointer' }}>
                        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="5"
                          fill={col.fill} stroke={isSel?'#f59e0b':col.stroke} strokeWidth={isSel?3:1.5}/>
                        <text x={cx} y={db?.assignedFlat?cy-4:cy+4}
                          textAnchor="middle" fontSize={fz} fontWeight="800" fill={col.text}>{s.id}</text>
                        {db?.assignedFlat&&(
                          <text x={cx} y={cy+9} textAnchor="middle" fontSize={small?7:9} fontWeight="700"
                            fill={col.text==='#ffffff'?'#c7d2fe':'#16a34a'}>{db.assignedFlat}</text>
                        )}
                        {vcount>0&&(
                          <>
                            <circle cx={s.x+s.w-7} cy={s.y+7} r="7"
                              fill={col.text==='#ffffff'?'rgba(255,255,255,0.3)':'#5b52f0'}/>
                            <text x={s.x+s.w-7} y={s.y+11}
                              textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">{vcount}</text>
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

      <Modal open={showModal} onClose={()=>setShowModal(false)} title={selId?`Slot ${selId}`:'Slot'}>
        {selId&&(
          <div className="space-y-4">
            <div className="px-3 py-2.5 rounded-xl text-[12px]"
              style={{
                background:selectedDb?.assignedFlat?'#f0fdf4':'var(--surface-2)',
                border:`1px solid ${selectedDb?.assignedFlat?'#86efac':'var(--border)'}`,
                color:selectedDb?.assignedFlat?'#166534':'var(--ink-3)',
              }}>
              {selectedDb?.assignedFlat
                ?<>Assigned to <strong>Flat {selectedDb.assignedFlat}</strong></>
                :'Not assigned to any flat yet'}
            </div>
            {isAdmin&&(
              <div className="rounded-xl p-4 space-y-3" style={{ background:'var(--surface-2)',border:'1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>Admin · Assign Flat</div>
                <input className="input w-full" placeholder="Flat no. (e.g. 2H) — blank to unassign"
                  value={assignFlat} onChange={e=>setAssignFlat(e.target.value.toUpperCase())}/>
                <button onClick={handleSaveAssign} disabled={saving} className="btn-primary w-full justify-center">
                  <Save size={14}/> {saving?'Saving…':'Save'}
                </button>
                {err&&<div className="text-[11px] px-3 py-2 rounded-lg" style={{ background:'#fff1f2',color:'#9f1239' }}>{err}</div>}
              </div>
            )}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color:'var(--ink-3)' }}>
                Vehicles{selectedDb?.assignedFlat?` · Flat ${selectedDb.assignedFlat}`:''}
              </div>
              {(!selectedDb?.vehicles||selectedDb.vehicles.length===0)?(
                <div className="text-[12px] text-center py-4 rounded-xl" style={{ color:'var(--ink-4)',background:'var(--surface-2)' }}>No vehicles added yet</div>
              ):(
                <div className="space-y-1.5">
                  {selectedDb.vehicles.map(v=>{
                    const conf=typeConf(v.type), Icon=conf.icon
                    return (
                      <div key={v.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background:'var(--surface-2)',border:'1px solid var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${conf.color}18` }}>
                          <Icon size={15} style={{ color:conf.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color:'var(--ink)' }}>{conf.label}</div>
                          {v.numberPlate&&<div className="text-[10px]" style={{ color:'var(--ink-3)' }}>{v.numberPlate}</div>}
                        </div>
                        {v.isTenant&&<span className="badge text-[9px]" style={{ background:'#fffbeb',color:'#d97706' }}>Tenant</span>}
                        {canEdit&&(
                          <button onClick={()=>handleDeleteVehicle(v.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background:'#fff1f2',color:'#e11d48' }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {canEdit&&(
              <div className="rounded-xl p-4 space-y-3" style={{ background:'#f0fdf4',border:'1px solid #86efac' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color:'#166534' }}>Add a Vehicle</div>
                <div className="flex flex-wrap gap-1.5">
                  {VEHICLE_TYPES.map(t=>{
                    const Icon=t.icon, active=vType===t.value
                    return (
                      <button key={t.value} onClick={()=>setVType(t.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                        style={{ background:active?t.color:'white', color:active?'white':'var(--ink-2)', border:`1px solid ${active?t.color:'var(--border)'}` }}>
                        <Icon size={13}/> {t.label}
                      </button>
                    )
                  })}
                </div>
                <input className="input w-full" placeholder="Vehicle number (e.g. TN09AB1234)"
                  value={vNumber} onChange={e=>setVNumber(e.target.value.toUpperCase())}/>
                {err&&<div className="text-[11px] px-3 py-2 rounded-lg" style={{ background:'#fff1f2',color:'#9f1239' }}>{err}</div>}
                <button onClick={handleAddVehicle} disabled={saving} className="btn-primary w-full justify-center">
                  <Plus size={14}/> {saving?'Adding…':'Add Vehicle'}
                </button>
              </div>
            )}
            {!canEdit&&!isAdmin&&selectedDb?.assignedFlat&&(
              <div className="text-[11px] px-3 py-2.5 rounded-xl text-center" style={{ background:'var(--surface-2)',color:'var(--ink-4)' }}>
                Only residents of Flat {selectedDb.assignedFlat} can manage vehicles here.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}