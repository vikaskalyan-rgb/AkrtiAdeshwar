import Topbar from '../components/layout/Topbar'

const PRESIDENT = { name: 'Mr N Kalyan',           flat: '4B', role: 'President',  color: '#5b52f0', light: '#eeeeff', dark: '#c7c4fc' }
const CORE = [
  { name: 'Mr T Ranjith',          flat: '2J', role: 'Secretary',  color: '#059669', light: '#ecfdf5', dark: '#6ee7b7' },
  { name: 'Mr G K Muralidharan',   flat: '4J', role: 'Treasurer',  color: '#d97706', light: '#fffbeb', dark: '#fcd34d' },
  { name: 'Mr Sharbudeen',         flat: 'SB', role: 'Supervisor', color: '#0284c7', light: '#f0f9ff', dark: '#7dd3fc' },
]
const WINGS = [
  {
    name: 'North Wing', color: '#0284c7', light: '#f0f9ff', border: '#bae6fd',
    members: [
      { flat: '1K', name: 'Mr Natraj',           role: 'Floor 1 Incharge' },
      { flat: '2J', name: 'Mr T Ranjith',         role: 'Floor 2 · Secretary' },
      { flat: '3J', name: 'Mr Swamy Nathan',      role: 'Floor 3 Incharge' },
      { flat: '4J', name: 'Mr G K Muralidharan',  role: 'Floor 4 · Treasurer' },
    ]
  },
  {
    name: 'South Wing', color: '#5b52f0', light: '#eeeeff', border: '#c7c4fc',
    members: [
      { flat: '1D', name: 'Mr Karthik',      role: 'Floor 1 Incharge' },
      { flat: '2B', name: 'Mr Palpandian',   role: 'Floor 2 Incharge' },
      { flat: '3C', name: 'Mr GM Sai Kriba', role: 'Floor 3 Incharge' },
      { flat: '4A', name: 'Mrs Shanthi',     role: 'Floor 4 Incharge' },
    ]
  }
]

export default function OrgChart() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Association Committee" subtitle="Akriti Aadeshwar Apartment Association" />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Banner */}
          <div className="rounded-2xl px-6 py-5 text-center relative overflow-hidden"
            style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, #5b52f0, #0284c7, #059669)' }} />
            <div className="text-[10px] font-bold tracking-[3px] uppercase mb-1"
              style={{ color: '#5b52f0' }}>Registered Association</div>
            <div className="text-[20px] font-bold"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Akriti Aadeshwar Apartment Association
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
              43 Units · Gated Community
            </div>
          </div>

          {/* President */}
          <div className="flex flex-col items-center gap-0">
            <div className="rounded-2xl px-8 py-5 flex items-center gap-4 relative overflow-hidden"
              style={{
                background: 'white',
                border: `2px solid ${PRESIDENT.color}`,
                boxShadow: `0 0 0 4px ${PRESIDENT.light}`,
                minWidth: '280px'
              }}>
              <div className="absolute inset-x-0 top-0 h-1"
                style={{ background: PRESIDENT.color }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[16px] font-bold text-white flex-shrink-0"
                style={{ background: PRESIDENT.color }}>
                {PRESIDENT.flat}
              </div>
              <div>
                <div className="text-[16px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  {PRESIDENT.name}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: PRESIDENT.light, color: PRESIDENT.color }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: PRESIDENT.color }} />
                  {PRESIDENT.role}
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center">
              <div className="w-px h-6" style={{ background: 'var(--border)' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
          </div>

          {/* Core team */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-0 left-[16.66%] right-[16.66%] h-px"
              style={{ background: 'var(--border)' }} />

            <div className="grid grid-cols-3 gap-3">
              {CORE.map((p, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-px h-6" style={{ background: 'var(--border)' }} />
                  <div className="w-full rounded-2xl p-4 flex flex-col items-center gap-2.5 relative overflow-hidden"
                    style={{
                      background: 'white',
                      border: `1.5px solid ${p.dark}40`,
                    }}>
                    <div className="absolute inset-x-0 top-0 h-0.5"
                      style={{ background: p.color }} />
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[13px] font-bold text-white"
                      style={{ background: p.color }}>
                      {p.flat}
                    </div>
                    <div className="text-center">
                      <div className="text-[13px] font-bold leading-tight"
                        style={{ color: 'var(--ink)' }}>{p.name}</div>
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: p.light, color: p.color }}>
                        {p.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'var(--surface-3)', color: 'var(--ink-3)', border: '1px solid var(--border)' }}>
              Wing Representatives
            </div>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Wings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WINGS.map((wing, wi) => (
              <div key={wi} className="rounded-2xl overflow-hidden"
                style={{ background: 'white', border: `1.5px solid ${wing.border}` }}>
                {/* Wing header */}
                <div className="px-4 py-3 flex items-center gap-2.5"
                  style={{ background: wing.light, borderBottom: `1px solid ${wing.border}` }}>
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{ background: wing.color }} />
                  <span className="text-[13px] font-bold"
                    style={{ color: wing.color }}>{wing.name}</span>
                  <span className="ml-auto text-[10px] font-medium"
                    style={{ color: wing.color + '99' }}>Floor Incharges</span>
                </div>

                {/* Members */}
                {wing.members.map((m, mi) => (
                  <div key={mi}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ borderBottom: mi < wing.members.length - 1 ? `1px solid ${wing.border}40` : 'none' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: wing.color }}>
                      {m.flat}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold"
                        style={{ color: 'var(--ink)' }}>{m.name}</div>
                      <div className="text-[11px] mt-0.5"
                        style={{ color: 'var(--ink-3)' }}>{m.role}</div>
                    </div>
                    <div className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: wing.light, color: wing.color }}>
                      Floor {mi + 1}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center py-3 text-[11px]" style={{ color: 'var(--ink-4)' }}>
            For queries contact the Secretary or Supervisor
          </div>

        </div>
      </div>
    </div>
  )
}