import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/config'
import { Trophy, Footprints, ChevronRight } from 'lucide-react'

function fmtSteps(n) {
  return Number(n).toLocaleString('en-IN')
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
const COLORS  = ['#f59e0b', '#6b7280', '#d97706', '#5b52f0', '#059669']

export default function StepsDashboardWidget() {
  const navigate = useNavigate()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/steps/leaderboard?filter=today')
      .then(r => setData(r.data.slice(0, 5)))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const maxSteps = data[0]?.totalSteps || 1

  return (
    <div className="card overflow-hidden">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={15} style={{ color: '#f59e0b' }} />
          <span className="card-title">Today's Top Walkers</span>
        </div>
        <button
          onClick={() => navigate('/steps?tab=leaderboard')}
          className="flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: 'var(--indigo)' }}>
          See All <ChevronRight size={12} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[12px]" style={{ color: 'var(--ink-4)' }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <Footprints size={28} className="mx-auto mb-2"
            style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
          <p className="text-[12px]" style={{ color: 'var(--ink-3)' }}>No walks recorded today</p>
          <button onClick={() => navigate('/steps')}
            className="mt-2 text-[11px] font-semibold"
            style={{ color: 'var(--indigo)' }}>
            Start your walk →
          </button>
        </div>
      ) : (
        <div>
          {data.map((entry, i) => {
            const pct = Math.round((entry.totalSteps / maxSteps) * 100)
            return (
              <div key={entry.walkerId}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors"
                style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="text-[16px] w-6 text-center flex-shrink-0">{MEDALS[i]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                      {entry.walkerName}
                    </span>
                    <span className="text-[11px] font-bold ml-2 flex-shrink-0" style={{ color: COLORS[i] }}>
                      {fmtSteps(entry.totalSteps)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--ink-4)' }}>
                    Flat {entry.flatNo}
                  </div>
                </div>
              </div>
            )
          })}

          <button
            onClick={() => navigate('/steps?tab=leaderboard')}
            className="w-full py-3 text-[12px] font-semibold flex items-center justify-center gap-1.5"
            style={{ color: 'var(--indigo)', borderTop: '1px solid var(--border)' }}>
            🏃 Open Step Challenge <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}