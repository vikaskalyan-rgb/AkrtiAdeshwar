import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal, WhatsAppIcon } from '../components/ui'
import { Search, Phone } from 'lucide-react'
import api from '../api/config'

const NORTH_UNITS = ['A','B','C','D','E','F']
const SOUTH_UNITS = ['G','H','J','K']

export default function FlatDirectory() {
  const [flats, setFlats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [wing, setWing] = useState('all')
  const [floor, setFloor] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchFlats() }, [])

  const fetchFlats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/flats')
      setFlats(res.data)
    } catch (err) {
      console.error('Error fetching flats:', err)
    } finally {
      setLoading(false)
    }
  }

  const occupiedFlats = flats.filter(f => f.floor > 0)

  const filtered = occupiedFlats.filter(f => {
    const matchSearch = search === '' ||
      f.flatNo?.toLowerCase().includes(search.toLowerCase()) ||
      f.residentName?.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName?.toLowerCase().includes(search.toLowerCase())
    const matchWing = wing === 'all' || f.wing === wing
    const matchFloor = floor === 'all' || f.floor === parseInt(floor)
    return matchSearch && matchWing && matchFloor
  })

  const showGrid = wing === 'all' && search === '' && floor === 'all'

  const stats = {
    total: occupiedFlats.length,
    occupied: occupiedFlats.filter(f => f.ownerType !== 'VACANT').length,
    vacant: occupiedFlats.filter(f => f.ownerType === 'VACANT').length,
    rented: occupiedFlats.filter(f => f.ownerType === 'RENTED').length,
  }

  const getOwnerTypeStyle = (type) => {
    if (type === 'RENTED') return { background:'#fef9c3', color:'#78350f' }
    if (type === 'VACANT') return { background:'#ffe4e6', color:'#9f1239' }
    return { background:'#eeeeff', color:'var(--indigo)' }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background:'var(--surface-2)' }}>
      <Topbar title="Flat Directory" subtitle="All 43 units" />
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { label:'Total',    value: stats.total,    color:'var(--indigo)' },
            { label:'Occupied', value: stats.occupied, color:'var(--emerald)' },
            { label:'Vacant',   value: stats.vacant,   color:'var(--rose)' },
            { label:'Tenants',  value: stats.rented,   color:'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'var(--ink-3)' }}>{s.label}</div>
              <div className="text-[24px] font-bold mt-0.5" style={{ color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--ink-4)' }} />
            <input className="input pl-9" placeholder="Search flat, owner or resident..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select flex-shrink-0" value={wing} onChange={e => setWing(e.target.value)}>
            <option value="all">All Wings</option>
            <option value="North">North (A–F)</option>
            <option value="South">South (G,H,J,K)</option>
          </select>
          <select className="select flex-shrink-0" value={floor} onChange={e => setFloor(e.target.value)}>
            <option value="all">All Floors</option>
            {[1,2,3,4].map(f => <option key={f} value={f}>Floor {f}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>Loading...</div>
        ) : showGrid ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name:'North Wing', units:NORTH_UNITS, color:'var(--sky)',    lightBg:'#f0f9ff', border:'#bae6fd' },
              { name:'South Wing', units:SOUTH_UNITS, color:'var(--indigo)', lightBg:'#eeeeff', border:'var(--indigo-md)' },
            ].map(w => (
              <div key={w.name} className="card overflow-hidden">
                <div className="px-4 py-3" style={{ background:w.lightBg, borderBottom:`1px solid ${w.border}` }}>
                  <div className="text-[14px] font-bold" style={{ color:w.color }}>{w.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                    Units: {w.units.join(', ')} · Floors 1–4
                  </div>
                </div>
                <div className="p-3">
                  {[1,2,3,4].map(fl => (
                    <div key={fl} className="mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:'var(--ink-4)' }}>Floor {fl}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {w.units.map(unit => {
                          const flat = flats.find(f => f.flatNo === `${fl}${unit}`)
                          if (!flat) return null
                          return (
                            <div key={flat.flatNo}
                              onClick={() => flat.ownerType !== 'VACANT' && setSelected(flat)}
                              className="rounded-xl p-2 transition-all cursor-pointer hover:scale-105"
                              style={{
                                background: flat.ownerType === 'VACANT' ? 'var(--surface-3)' : 'white',
                                border: `1px solid ${flat.ownerType === 'VACANT' ? 'var(--border)' : w.border}`,
                                minWidth: '60px',
                              }}>
                              <div className="text-[11px] font-bold font-mono"
                                style={{ color: flat.ownerType === 'VACANT' ? 'var(--ink-4)' : w.color }}>
                                {flat.flatNo}
                              </div>
                              {flat.ownerType === 'VACANT'
                                ? <div className="text-[9px]" style={{ color:'var(--ink-4)' }}>Vacant</div>
                                : <div className="text-[9px] truncate" style={{ color:'var(--ink-3)', maxWidth:'60px' }}>
                                    {flat.residentName?.split(' ')[0] || flat.ownerName?.split(' ')[0]}
                                  </div>
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
          /* List View */
          <div className="card overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight:'calc(100dvh - 320px)' }}>
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-[13px]" style={{ color:'var(--ink-4)' }}>No flats found</div>
              ) : filtered.map(f => (
                <div key={f.flatNo}
                  onClick={() => f.ownerType !== 'VACANT' && setSelected(f)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom:'1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold font-mono flex-shrink-0"
                    style={{
                      background: f.wing === 'North' ? '#f0f9ff' : '#eeeeff',
                      color: f.wing === 'North' ? 'var(--sky)' : 'var(--indigo)'
                    }}>
                    {f.flatNo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color:'var(--ink)' }}>
                      {f.residentName || f.ownerName || '—'}
                    </div>
                    <div className="text-[11px]" style={{ color:'var(--ink-3)' }}>
                      {f.wing} Wing · Floor {f.floor}
                    </div>
                  </div>
                  <span className="badge flex-shrink-0" style={getOwnerTypeStyle(f.ownerType)}>
                    {f.ownerType === 'OWNER_OCCUPIED' ? 'Owner' : f.ownerType === 'RENTED' ? 'Rented' : 'Vacant'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Flat Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Flat ${selected?.flatNo}`}>
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Flat No',       selected.flatNo],
                ['Floor',         `Floor ${selected.floor}`],
                ['Wing',          `${selected.wing} Wing`],
                ['Type',          selected.ownerType === 'OWNER_OCCUPIED' ? 'Owner Occupied' : selected.ownerType === 'RENTED' ? 'Rented' : 'Vacant'],
                ['Owner',         selected.ownerName || '—'],
                ['Owner Phone',   selected.ownerPhone || '—'],
                ['Resident',      selected.residentName || '—'],
                ['Resident Phone',selected.residentPhone || '—'],
                ['Parking',       selected.parkingSlot || '—'],
                ['Owner Email',   selected.ownerEmail || '—'],
              ].map(([k,v]) => (
                <div key={k} className="rounded-xl p-3" style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color:'var(--ink-3)' }}>{k}</div>
                  <div className="text-[12px] font-medium break-all" style={{ color:'var(--ink)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.open(`tel:${selected.ownerPhone}`)}
                className="btn-ghost flex-1 justify-center">
                <Phone size={13}/> Call Owner
              </button>
              <button
                onClick={() => window.open(`https://wa.me/91${selected.ownerPhone}`)}
                className="btn-whatsapp flex-1 justify-center">
                <WhatsAppIcon size={13}/> WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}