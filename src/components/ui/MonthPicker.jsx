import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function MonthPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value?.year || new Date().getFullYear())
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (month) => {
    onChange({ month: month + 1, year: viewYear }) 
    setOpen(false)
  }

  const display = value
    ? `${MONTHS[value.month - 1]} ${value.year}`
    : 'Select month'

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
        style={{
          background: open ? 'var(--indigo)' : 'white',
          color:      open ? 'white' : 'var(--ink-2)',
          border:     `1px solid ${open ? 'var(--indigo)' : 'var(--border)'}`,
        }}>
        <Calendar size={13} />
        {label && <span className="text-[11px] font-normal" style={{ color: open ? 'rgba(255,255,255,0.7)' : 'var(--ink-4)' }}>{label}:</span>}
        {display}
      </button>

      {open && (
        <div className="absolute top-full mt-2 z-50 rounded-2xl overflow-hidden animate-in"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(26,26,46,0.12)',
            minWidth: '220px',
            right: 0,
          }}>
          {/* Year navigation */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setViewYear(y => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-3)]"
              style={{ color: 'var(--ink-3)' }}>
              <ChevronLeft size={15} />
            </button>
            <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{viewYear}</span>
            <button onClick={() => setViewYear(y => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-3)]"
              style={{ color: 'var(--ink-3)' }}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTHS.map((m, i) => {
              const isSelected = value?.month === i + 1 && value?.year === viewYear
              const isFuture = new Date(viewYear, i) > new Date()
              return (
                <button key={m}
                  onClick={() => !isFuture && select(i)}
                  disabled={isFuture}
                  className="py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={
                    isSelected
                      ? { background: 'var(--indigo)', color: 'white' }
                      : isFuture
                      ? { background: 'transparent', color: 'var(--ink-4)', cursor: 'not-allowed' }
                      : { background: 'var(--surface-2)', color: 'var(--ink-2)' }
                  }>
                  {m}
                </button>
              )
            })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// Range picker — from month/year to month/year
export function MonthRangePicker({ from, to, onFromChange, onToChange }) {
  return (
    <div className="flex items-center gap-2">
      <MonthPicker value={from} onChange={onFromChange} label="From" />
      <span className="text-[12px]" style={{ color: 'var(--ink-4)' }}>→</span>
      <MonthPicker value={to} onChange={onToChange} label="To" />
    </div>
  )
}