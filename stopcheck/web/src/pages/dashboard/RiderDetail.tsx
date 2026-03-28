import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchEvent, fetchRiderDetail, fetchRiderCompliance, confirmDQ,
  type EventData, type RiderDetailData, type ComplianceResult,
} from '../../dashboardApi'
import StatusBadge from '../../components/StatusBadge'

export default function RiderDetail() {
  const { id: eventId, riderId } = useParams<{ id: string; riderId: string }>()
  const { token } = useAuth()
  const [event, setEvent] = useState<EventData | null>(null)
  const [rider, setRider] = useState<RiderDetailData | null>(null)
  const [stops, setStops] = useState<ComplianceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [dqLoading, setDqLoading] = useState(false)
  const [showDqModal, setShowDqModal] = useState(false)

  const load = () => {
    if (!token || !eventId || !riderId) return
    Promise.all([
      fetchEvent(token, eventId),
      fetchRiderDetail(token, eventId, riderId),
      fetchRiderCompliance(token, eventId, riderId),
    ])
      .then(([e, r, c]) => { setEvent(e); setRider(r); setStops(c) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [token, eventId, riderId])

  const executeDQ = async (action: 'confirm' | 'waive') => {
    if (!token || !eventId || !riderId) return
    setDqLoading(true)
    setShowDqModal(false)
    try {
      await confirmDQ(token, eventId, riderId, action)
      load()
    } finally {
      setDqLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>
  if (!rider || !event) return <div className="text-center py-12 text-red-500">Rider not found</div>

  const hasSummary = rider.compliance_pct !== null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link to="/dashboard" className="no-underline hover:text-gray-600">Events</Link>
        {' / '}
        <Link to={`/events/${eventId}`} className="no-underline hover:text-gray-600">{event.name}</Link>
        {' / '}
        <span className="text-gray-600">{rider.name}</span>
      </div>

      {/* Rider header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{rider.name}</h1>
            <p className="text-sm text-gray-500">
              {rider.bib_number && `Bib #${rider.bib_number} \u2014 `}
              {rider.platform ? `Connected via ${rider.platform}` : 'Not connected'}
            </p>
          </div>
          {hasSummary && (
            <div className={`text-3xl font-bold ${rider.dq_recommended ? 'text-red-600' : 'text-green-600'}`}>
              {rider.compliance_pct?.toFixed(0)}%
            </div>
          )}
        </div>

        {hasSummary && (
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{rider.stops_passed} passed</span>
            <span className="text-red-600 font-medium">{rider.stops_failed} failed</span>
            <span className="text-gray-400 font-medium">{rider.stops_missed} missed</span>
          </div>
        )}
      </div>

      {/* DQ Confirmation Modal */}
      {showDqModal && rider && event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-red-600 text-3xl mb-3">&#9888;</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirm Disqualification</h2>
            <p className="text-gray-600 text-sm mb-4">
              This will disqualify <strong>{rider.name}</strong> from <strong>{event.name}</strong>.
              This action will notify the rider by email. Confirm?
            </p>
            <div className="flex gap-3">
              <button onClick={() => executeDQ('confirm')} disabled={dqLoading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {dqLoading ? 'Processing...' : 'Confirm DQ'}
              </button>
              <button onClick={() => setShowDqModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DQ Banner — Two-step flow */}
      {rider.dq_recommended && (
        <div className={`rounded-xl border-2 p-5 mb-5 ${
          rider.dq_confirmed
            ? 'bg-red-50 border-red-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`font-bold ${rider.dq_confirmed ? 'text-red-800' : 'text-amber-800'}`}>
                {rider.dq_confirmed ? 'Disqualification Confirmed' : 'DQ Recommended \u2014 Review Before Confirming'}
              </h2>
              <p className={`text-sm mt-1 ${rider.dq_confirmed ? 'text-red-600' : 'text-amber-600'}`}>
                {rider.dq_confirmed
                  ? 'This rider has been officially disqualified.'
                  : 'Review the stop data below. Click "Confirm DQ" to proceed to the confirmation step.'}
              </p>
            </div>
            <div className="flex gap-2">
              {!rider.dq_confirmed ? (
                <>
                  {/* Step 1: Opens modal (step 2 is inside modal) */}
                  <button onClick={() => setShowDqModal(true)} disabled={dqLoading}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                    Confirm DQ...
                  </button>
                  <button onClick={() => executeDQ('waive')} disabled={dqLoading}
                    className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                    Waive
                  </button>
                </>
              ) : (
                <button onClick={() => executeDQ('waive')} disabled={dqLoading}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-lg font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                  Reverse DQ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Per-stop cards */}
      {stops.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-800">Stop-by-Stop Analysis</h2>
          {stops.map(stop => (
            <StopCard key={stop.id} stop={stop} />
          ))}
        </div>
      )}

      {!hasSummary && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">&#9203;</div>
          <p className="text-gray-500">Results not yet available for this rider.</p>
        </div>
      )}
    </div>
  )
}

function StopCard({ stop }: { stop: ComplianceResult }) {
  const isPass = stop.status === 'pass' || stop.status === 'guard_waived'

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${
      isPass ? 'border-l-green-500' : stop.status === 'missed' ? 'border-l-gray-400' : 'border-l-red-500'
    } p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-400">#{stop.sequence}</span>
          <span className="font-medium text-gray-800">{stop.stop_location}</span>
        </div>
        <StatusBadge status={stop.status} />
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-gray-400 uppercase">Min Speed</div>
          <div className={`font-semibold mt-0.5 ${stop.status === 'fail' ? 'text-red-600' : 'text-gray-800'}`}>
            {stop.min_speed_mph.toFixed(1)} mph
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase">Duration</div>
          <div className="font-semibold mt-0.5 text-gray-800">
            {stop.stop_duration_s != null ? `${stop.stop_duration_s.toFixed(1)}s` : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase">Source</div>
          <div className="font-semibold mt-0.5 text-gray-800">
            {stop.speed_source === 'sensor' ? 'Wheel Sensor' : 'GPS'}
          </div>
        </div>
      </div>
      {stop.crossing_guard && (
        <div className="mt-2 text-xs text-blue-600 font-medium">Crossing guard posted</div>
      )}
    </div>
  )
}
