import { useState } from 'react'
import { flats, NORTH_WING, SOUTH_WING } from '../data/mockData'
import Topbar from '../components/layout/Topbar'
import { Modal, WhatsAppIcon } from '../components/ui'
import { Search, Phone } from 'lucide-react'
import clsx from 'clsx'

export default function FlatDirectory() {
  const [search, setSearch] = useState('')
  const [wing, setWing] = useState('all')
  const [floor, setFloor] = useState('all')
  const [selected, setSelected] = useState(null)

  const occupiedFlats = flats.filter(f => f.floor > 0)
  const filtered = occupiedFlats.filter(f => {
    const matchSearch = search==='' || f.flatNo.toLowerCase().includes(search.toLowerCase()) || f.residentName?.toLowerCase().includes(search.toLowerCase()) || f.ownerName?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (wing==='all'||f.wing===wing) && (floor==='all'||f.floor===parseInt(floor))
  })

  const showGrid = wing==='all' && search==='' && floor==='all'

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Flat Directory" subtitle="All 43 units" />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label:'Total', value:'43', color:'var(--indigo)' },
            { label:'Occupied', value:occupiedFlats.filter(f=>!f.isVacant).length, color:'var(--emerald)' },
            { label:'Vacant', value:occupiedFlats.filter(f=>f.isVacant).length, color:'var(--rose)' },
            { label:'Tenants', value:occupiedFlats.filter(f=>f.ownerType==='Rented').length, color:'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{s.label}</div>
              <div className="text-[24px] font-bold mt-0.5" style={{ color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat, owner or resident..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="select flex-shrink-0" value={wing} onChange={e=>setWing(e.target.value)}>
            <option value="all">All Wings</option>
            <option value="North">North (A–F)</option>
            <option value="South">South (G,H,J,K)</option>
          </select>
          <select className="select flex-shrink-0" value={floor} onChange={e=>setFloor(e.target.value)}>
            <option value="all">All Floors</option>
            {[1,2,3,4].map(f=><option key={f} value={f}>Floor {f}</option>)}
          </select>
        </div>

        {showGrid ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name:'North Wing', units:NORTH_WING, color:'var(--sky)', lightBg:'#f0f9ff', border:'#bae6fd' },
              { name:'South Wing', units:SOUTH_WING, color:'var(--indigo)', lightBg:'#eeeeff', border:'var(--indigo-md)' },
            ].map(w => (
              <div key={w.name} className="card overflow-hidden">
                <div className="px-4 py-3" style={{ background:w.lightBg, borderBottom:`1px solid ${w.border}` }}>
                  <div className="text-[14px] font-bold" style={{ color:w.color }}>{w.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>Units: {w.units.join(', ')} · Floors 1–4</div>
                </div>
                <div className="p-3">
                  {[1,2,3,4].map(fl => (
                    <div key={fl} className="mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:'var(--ink-4)' }}>Floor {fl}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {w.units.map(unit => {
                          const flat = flats.find(f => f.flatNo===`${fl}${unit}`)
                          if (!flat) return null
                          return (
                            <div key={flat.flatNo} onClick={() => !flat.isVacant && setSelected(flat)}
                              className="rounded-xl p-2 transition-all cursor-pointer hover:scale-105"
                              style={{
                                background: flat.isVacant ? 'var(--surface-3)' : 'white',
                                border: `1px solid ${flat.isVacant ? 'var(--border)' : w.border}`,
                                minWidth: '60px',
                              }}>
                              <div className="text-[11px] font-bold font-mono" style={{ color: flat.isVacant ? 'var(--ink-4)' : w.color }}>{flat.flatNo}</div>
                              {flat.isVacant
                                ? <div className="text-[9px]" style={{ color:'var(--ink-4)' }}>Vacant</div>
                                : <div className="text-[9px] truncate" style={{ color:'var(--ink-3)', maxWidth:'60px' }}>{flat.residentName?.split(' ')[0]}</div>
                              }
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 320px)' }}>
              {filtered.map(f => (
                <div key={f.flatNo} onClick={() => !f.isVacant && setSelected(f)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold font-mono flex-shrink-0"
                    style={{ background: f.wing==='North' ? '#f0f9ff' : '#eeeeff', color: f.wing==='North' ? 'var(--sky)' : 'var(--indigo)' }}>
                    {f.flatNo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>{f.residentName || f.ownerName || '—'}</div>
                    <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>{f.wing} Wing · Floor {f.floor} · {f.ownerType}</div>
                  </div>
                  <span className="badge flex-shrink-0" style={ f.isVacant ? { background:'var(--surface-3)', color:'var(--ink-4)' } : { background:'#ecfdf5', color:'#059669' }}>
                    {f.isVacant?'Vacant':'Occupied'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Flat ${selected?.flatNo}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[['Flat',selected.flatNo],['Floor',`Floor ${selected.floor}`],['Wing',`${selected.wing} Wing`],['Type',selected.ownerType],['Owner',selected.ownerName],['Owner Phone',selected.ownerPhone],['Resident',selected.residentName||'—'],['Resident Phone',selected.residentPhone||'—'],['Parking',selected.parkingSlot||'—']].map(([k,v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => alert(`Calling ${selected.ownerPhone}...`)} className="btn-ghost flex-1 justify-center"><Phone size={13}/> Call</button>
              <button onClick={() => alert(`WhatsApp to ${selected.ownerName}`)} className="btn-whatsapp flex-1 justify-center"><WhatsAppIcon size={13}/> WhatsApp</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}