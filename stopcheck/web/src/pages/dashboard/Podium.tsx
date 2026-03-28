import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { searchPodium, type PodiumRider } from '../../dashboardApi'

export default function Podium() {
  const { id: eventId } = useParams<{ id: string }>()
  const [query, setQuery] = useState('')
  const [riders, setRiders] = useState<PodiumRider[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (!eventId || q.length < 1) { setRiders([]); return }
    setLoading(true)
    try {
      // Try network first, fall back to cache
      const results = await searchPodium(eventId, q)
      setRiders(results)

      // Cache results for offline
      if ('caches' in window) {
        const cache = await caches.open('stopcheck-rider-data')
        cache.put(
          `/podium/${eventId}/${q}`,
          new Response(JSON.stringify(results))
        )
      }
    } catch {
      // Offline — try cache
      if ('caches' in window) {
        const cache = await caches.open('stopcheck-rider-data')
        const cached = await cache.match(`/podium/${eventId}/${q}`)
        if (cached) {
          setRiders(await cached.json())
        }
      }
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <span className="text-2xl">&#128721;</span>
          <span className="font-bold text-lg text-green-400">StopCheck</span>
          <span className="text-gray-400 text-sm ml-auto">Podium Check</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or bib number..."
            autoFocus
            className="w-full px-4 py-4 text-xl bg-gray-800 border-2 border-gray-600 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-green-500 transition-colors"
          />
          {loading && (
            <div className="text-center text-gray-500 text-sm mt-2">Searching...</div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {riders.map(rider => (
            <PodiumCard key={rider.id} rider={rider} />
          ))}

          {query.length > 0 && !loading && riders.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-lg">
              No riders found for "{query}"
            </div>
          )}
        </div>

        {query.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <div className="text-5xl mb-4">&#128269;</div>
            <div className="text-xl">Type a name or bib number</div>
            <div className="text-sm mt-2 text-gray-500">Results appear as you type</div>
          </div>
        )}
      </main>
    </div>
  )
}

function PodiumCard({ rider }: { rider: PodiumRider }) {
  const hasSummary = rider.compliance_pct !== null
  const hasViolation = rider.dq_recommended
  const failedStops = rider.stops.filter(s => s.status === 'fail')

  // Card color: green = compliant, red = violation, grey = pending
  let cardBg: string, cardBorder: string, statusText: string, statusIcon: string
  if (!hasSummary) {
    cardBg = 'bg-gray-800'
    cardBorder = 'border-gray-600'
    statusText = 'DATA PENDING'
    statusIcon = '\u23F3'
  } else if (hasViolation) {
    cardBg = 'bg-red-950'
    cardBorder = 'border-red-500'
    statusText = rider.dq_confirmed ? 'DISQUALIFIED' : 'VIOLATION'
    statusIcon = '\u274C'
  } else {
    cardBg = 'bg-green-950'
    cardBorder = 'border-green-500'
    statusText = 'COMPLIANT'
    statusIcon = '\u2705'
  }

  return (
    <div className={`${cardBg} border-2 ${cardBorder} rounded-2xl p-5`}>
      {/* Rider info + status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-2xl font-bold">{rider.name}</div>
          {rider.bib_number && (
            <div className="text-lg text-gray-400">Bib #{rider.bib_number}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl">{statusIcon}</div>
          <div className={`text-sm font-bold mt-1 ${
            !hasSummary ? 'text-gray-400' : hasViolation ? 'text-red-400' : 'text-green-400'
          }`}>
            {statusText}
          </div>
        </div>
      </div>

      {/* Compliance score */}
      {hasSummary && (
        <div className="flex items-center gap-4 mb-3">
          <div className={`text-4xl font-bold ${hasViolation ? 'text-red-400' : 'text-green-400'}`}>
            {rider.compliance_pct!.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400">
            <div>{rider.stops_passed} passed</div>
            <div>{rider.stops_failed} failed</div>
            {(rider.stops_missed ?? 0) > 0 && <div>{rider.stops_missed} missed</div>}
          </div>
        </div>
      )}

      {/* Per-stop dots */}
      {rider.stops.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {rider.stops.map((s, i) => (
            <StopDot key={i} status={s.status} sequence={s.sequence} />
          ))}
        </div>
      )}

      {/* Failed stops detail */}
      {failedStops.length > 0 && (
        <div className="border-t border-red-800 pt-3 mt-3 space-y-2">
          <div className="text-sm font-semibold text-red-400 uppercase tracking-wide">Failed Stops</div>
          {failedStops.map((stop, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                #{stop.sequence} {stop.stop_location}
              </span>
              <span className="text-red-400 font-semibold">
                {stop.min_speed_mph.toFixed(1)} mph
                {stop.stop_duration_s != null && ` / ${stop.stop_duration_s.toFixed(1)}s`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StopDot({ status, sequence }: { status: string; sequence: number }) {
  const colors: Record<string, string> = {
    pass: 'bg-green-500',
    fail: 'bg-red-500',
    guard_waived: 'bg-orange-500',
    missed: 'bg-gray-500',
    not_applicable: 'bg-gray-600',
  }
  return (
    <div
      className={`w-6 h-6 rounded-full ${colors[status] || 'bg-gray-600'} flex items-center justify-center text-[10px] font-bold text-white`}
      title={`Stop #${sequence}: ${status}`}
    >
      {sequence}
    </div>
  )
}
