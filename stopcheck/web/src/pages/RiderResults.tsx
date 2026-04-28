import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchRider, fetchResults, type RiderInfo, type RiderResultsData } from '../api'
import StatusBadge from '../components/StatusBadge'

export default function RiderResults() {
  const { authToken } = useParams<{ authToken: string }>()
  const [rider, setRider] = useState<RiderInfo | null>(null)
  const [results, setResults] = useState<RiderResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authToken) return
    Promise.all([fetchRider(authToken), fetchResults(authToken)])
      .then(([r, res]) => { setRider(r); setResults(res) })
      .catch(() => setError('Unable to load results.'))
      .finally(() => setLoading(false))
  }, [authToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !rider) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">&#128683;</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Results Not Available</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const summary = results?.summary
  const stops = results?.stops || []

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header authToken={authToken!} />
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="text-5xl mb-4">&#9203;</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Results Pending</h1>
          <p className="text-gray-500">
            Your ride data hasn't been processed yet. Results will appear here
            automatically after your activity uploads.
          </p>
          <Link
            to={`/r/${authToken}`}
            className="inline-block mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-medium no-underline hover:bg-green-700"
          >
            Back to Hub
          </Link>
        </main>
      </div>
    )
  }

  const allClear = !summary.dq_recommended
  const processedDate = new Date(summary.processed_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header authToken={authToken!} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Overall Result Card */}
        <div className={`rounded-2xl p-6 text-center ${
          allClear
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="text-5xl mb-2">{allClear ? '\u2705' : '\u274C'}</div>
          <h1 className="text-2xl font-bold mb-1">
            {allClear ? 'All stops confirmed' : 'Findings to review'}
          </h1>
          <div className="text-4xl font-bold my-2">
            {summary.compliance_pct.toFixed(0)}%
          </div>
          <div className="opacity-80 text-sm">
            {summary.stops_passed} passed &middot; {summary.stops_failed} failed &middot; {summary.stops_missed} missed
          </div>
          {summary.dq_confirmed && (
            <div className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm font-semibold">
              Finding confirmed by organizer
            </div>
          )}
        </div>

        {/* Rider Info */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">{rider.name}</div>
            <div className="text-sm text-gray-500">
              {rider.bib_number ? `Bib #${rider.bib_number}` : rider.event_name}
            </div>
          </div>
          <div className="text-xs text-gray-400">Processed {processedDate}</div>
        </div>

        {/* Per-Stop Cards */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Stop-by-Stop Breakdown</h2>
          <div className="space-y-3">
            {stops.map((stop) => (
              <StopCard key={stop.id} stop={stop} />
            ))}
          </div>
        </section>

        {/* Privacy */}
        <div className="text-center text-xs text-gray-400 pb-6">
          <p>Only stop-zone speed data is retained. No full GPS track is stored.</p>
        </div>
      </main>
    </div>
  )
}

function Header({ authToken }: { authToken: string }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to={`/r/${authToken}`}
          className="flex items-center gap-2 text-green-700 font-bold text-lg no-underline"
        >
          <span className="text-2xl">&#128721;</span>
          StopCheck
        </Link>
        <Link
          to={`/r/${authToken}`}
          className="text-sm text-blue-600 no-underline font-medium"
        >
          &#8592; Hub
        </Link>
      </div>
    </header>
  )
}

function StopCard({ stop }: { stop: import('../api').StopResult }) {
  const isPass = stop.status === 'pass' || stop.status === 'guard_waived'
  const borderColor = isPass ? 'border-l-green-500' : 'border-l-red-500'

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColor} overflow-hidden`}>
      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-400">#{stop.sequence}</span>
            <span className="font-medium text-gray-800 text-sm">{stop.stop_location}</span>
          </div>
          <StatusBadge status={stop.status} size="sm" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Detail
            label="Min Speed"
            value={`${stop.min_speed_mph.toFixed(1)} mph`}
            highlight={stop.status === 'fail'}
          />
          <Detail
            label="Stop Duration"
            value={stop.stop_duration_s != null ? `${stop.stop_duration_s.toFixed(1)}s` : '—'}
            highlight={false}
          />
          <Detail
            label="Speed Source"
            value={stop.speed_source === 'sensor' ? 'Wheel Sensor' : 'GPS Only'}
            highlight={false}
          />
          {stop.crossing_guard && (
            <Detail
              label="Crossing Guard"
              value="Posted"
              highlight={false}
              badge
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, highlight, badge }: {
  label: string; value: string; highlight: boolean; badge?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${
        highlight ? 'text-red-600' : badge ? 'text-blue-600' : 'text-gray-800'
      }`}>
        {value}
      </div>
    </div>
  )
}
