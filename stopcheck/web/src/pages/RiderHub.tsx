import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { fetchRider, fetchResults, type RiderInfo, type RiderSummary } from '../api'
import OAuthButton from '../components/OAuthButton'
import FitUpload from '../components/FitUpload'
import CourseDownloads from '../components/CourseDownloads'

export default function RiderHub() {
  const { authToken } = useParams<{ authToken: string }>()
  const [searchParams] = useSearchParams()
  const [rider, setRider] = useState<RiderInfo | null>(null)
  const [summary, setSummary] = useState<RiderSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const justConnected = searchParams.get('connected')

  const loadData = useCallback(async () => {
    if (!authToken) return
    try {
      const [riderData, resultsData] = await Promise.all([
        fetchRider(authToken),
        fetchResults(authToken).catch(() => ({ summary: null, stops: [] })),
      ])
      setRider(riderData)
      setSummary(resultsData.summary)

      // Cache for offline/PWA
      if ('caches' in window) {
        const cache = await caches.open('stopcheck-rider-data')
        cache.put(`/rider/${authToken}`, new Response(JSON.stringify(riderData)))
        if (resultsData.summary) {
          cache.put(`/results/${authToken}`, new Response(JSON.stringify(resultsData)))
        }
      }
    } catch {
      setError('Unable to load your event information. Please check your link.')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => { loadData() }, [loadData])

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
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Not Found</h1>
          <p className="text-gray-500">{error || 'This rider link is not valid.'}</p>
        </div>
      </div>
    )
  }

  const connected = !!rider.connected_at
  const eventDate = new Date(rider.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
            <span className="text-2xl">&#128721;</span>
            StopCheck
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Event Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{rider.event_name}</h1>
          <p className="text-gray-500 text-sm">{eventDate}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">
              {rider.name}{rider.bib_number ? ` — Bib #${rider.bib_number}` : ''}
            </span>
          </div>
        </div>

        {/* Just Connected Banner */}
        {justConnected && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="font-semibold text-green-800">
              &#10003; {justConnected.charAt(0).toUpperCase() + justConnected.slice(1)} Connected!
            </div>
            <div className="text-sm text-green-600 mt-1">
              Your activities will sync automatically after the event.
            </div>
          </div>
        )}

        {/* Results Banner (if processed) */}
        {summary && (
          <Link
            to={`/r/${authToken}/results`}
            className="block bg-white rounded-2xl border border-gray-200 p-5 no-underline hover:border-green-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Compliance Report</div>
                <div className={`text-2xl font-bold ${summary.dq_recommended ? 'text-red-600' : 'text-green-600'}`}>
                  {summary.compliance_pct.toFixed(0)}%
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                summary.dq_recommended
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {summary.dq_recommended ? 'VIOLATIONS FOUND' : 'ALL CLEAR'}
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-600 font-medium">
              View detailed results &#8594;
            </div>
          </Link>
        )}

        {/* Course Downloads */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Course Files</h2>
          <CourseDownloads courseFileUrl={rider.course_file_url} />
        </section>

        {/* OAuth Connect */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Connect Your Platform</h2>
          <p className="text-sm text-gray-500 mb-3">
            Choose one platform to automatically sync your ride data after the event.
          </p>
          <div className="space-y-2">
            <OAuthButton platform="strava" riderToken={authToken!} connected={connected} connectedPlatform={rider.platform} />
            <OAuthButton platform="garmin" riderToken={authToken!} connected={connected} connectedPlatform={rider.platform} />
            <OAuthButton platform="wahoo" riderToken={authToken!} connected={connected} connectedPlatform={rider.platform} />
          </div>
        </section>

        {/* FIT Upload Fallback */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-1">Manual Upload</h2>
          <p className="text-sm text-gray-500 mb-3">
            If you prefer, upload your FIT file directly after the ride.
          </p>
          <FitUpload authToken={authToken!} onUploaded={loadData} />
        </section>

        {/* Privacy Notice */}
        <div className="text-center text-xs text-gray-400 pb-6 space-y-1">
          <p>StopCheck only accesses your activity GPS and speed data.</p>
          <p>Full GPS tracks are never stored. Only stop-zone speed records are retained.</p>
          <p>No account required. No tracking. No third-party analytics.</p>
        </div>
      </main>
    </div>
  )
}
